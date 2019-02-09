/**
 * @ignore
 * BasePackage class module.  The BasePackage is used to be extended
 * and not used directly.
 *
 * @module air-supply/src/packages/BasePackage
 *
 * @example
 * import BasePackage from 'air-supply/src/packages/BasePackage';
 * class CustomPackage extends BasePackage {
 *   // ...
 * }
 */

// Dependencies
import { join } from 'path';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import find from 'lodash/find';
import mapValues from 'lodash/mapValues';
import kebabCase from 'lodash/kebabCase';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import bind from 'lodash/bind';
import * as fsWrapper from 'fs-extra';
import * as objectHashWrapper from 'object-hash';
import * as debugWrapper from 'debug';
import * as jsonWrapper from 'json5';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:basepackage');

// Deal with import defaults
const objectHash = objectHashWrapper.default || objectHashWrapper;
const json = jsonWrapper.default || jsonWrapper;
const fs = fsWrapper.default || fsWrapper;

/**
 * The base package class that is meant to be extended
 * for each package type class.
 *
 * Do not use this class directly.
 *
 * @export
 * @class BasePackage
 *
 * @param {Object?} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options, as well as the specific package type options.
 * @param {Array!} [options.keyIdentifiers=['key', 'source']] An array of properties in the options
 *   that will get used to create the cache key
 * @param {String!} [options.cachePoint='fetch'] A string the defines when caching will happen;
 *   the options are:
 *     - fetch: Caching happens after fetch
 *     - transform: Caching happens after the transform function is performed
 *     - bundle: Caching happens after bundle function is preformed
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 * @param {Object?} packageDefaults This is used for classes that extend this class, so
 *   that they can provid default options.
 *
 * @return {<BasePackage>} The new BasePackage object.
 */
export default class BasePackage {
  // Constructor
  constructor(options = {}, airSupply, packageDefaults) {
    // 1. AirSupply class default options,
    // 2. Default options for package, and
    // 3. The actual options sent through
    this.options = merge(
      {},
      airSupply ? omit(airSupply.options, ['packages']) : {},
      {
        // What properties in the options to use as the key
        // for caching
        keyIdentifiers: ['key', 'source'],
        // When to cache: ['fetch', 'transform', 'bundle']
        cachePoint: 'fetch',
        // To make sure it's defined
        type: 'base-no-fetch'
      },
      packageDefaults || {},
      options
    );

    // Attach airsupply
    this.airSupply = airSupply;

    // Cache points
    this.cachePoints = ['fetch', 'transform', 'bundle'];

    // Make sure cachePoint is valid
    if (!~this.cachePoints.indexOf(this.options.cachePoint)) {
      throw new Error(
        `Cache point "${
          this.options.cachePoint
        }" is not a valid cache point; options: ${json.stringify(
          this.cachePoints
        )}`
      );
    }

    // Create id based on options
    this.createId();

    // Setup cache
    this.setupCache();

    return this;
  }

  /**
   * Wrapper around the implemented fetch method.  This will cache the result
   * if needed, and perform the transform method if needed as well.
   *
   * @async
   * @return The fetched data.
   */
  async cachedFetch() {
    if (!isFunction(this.fetch)) {
      throw new Error(
        `Package "${
          this.options.key
        }" does not have a "fetch" method implemented.`
      );
    }

    // If we don't have fetch data, do fetch
    if (!this.data.fetch) {
      this.data.fetch = await this.fetch();

      // Parse data
      // Add source.  This seems off.  :/
      if (isObject(this.options.parsers)) {
        this.options.parsers.source =
          this.options.parsers.source || this.options.source;
      }
      else if (
        isArray(this.options.parsers) &&
        isObject(this.options.parsers[0])
      ) {
        this.options.parsers[0].source =
          this.options.parsers[0].source || this.options.source;
      }
      else if (!this.options.parsers) {
        this.options.parsers = { source: this.options.source };
      }
      this.data.fetch = this.parse(this.data.fetch, this.options.parsers);

      // Cache fetch data
      if (this.data.fetch && this.option('cachePoint') === 'fetch') {
        this.setCache('fetch');
      }
    }

    return this.data.fetch;
  }

  /**
   * Parse
   *
   * @return The parsed data.
   */
  parse(data, options) {
    options = isArray(options) ? options : [options];

    // Go through each parser
    return options.reduce((parsed, p) => {
      return this.parseData(parsed, p);
    }, data);
  }

  /**
   * Parse some data
   *
   * @return The parsed data.
   */
  parseData(data, options = {}) {
    if (!data) {
      // TODO: Should this be a warning or error?
      return;
    }

    // Is string
    if (!isPlainObject(options)) {
      options = {
        parser: options
      };
    }

    // No parsing
    if (options.parser === false) {
      return data;
    }

    // Treat as multiple file
    if (options.multiSource) {
      return this.parseObject(data, options);
    }

    // For parser options, we will spread if an array
    options.parserOptions = isArray(options.parserOptions)
      ? options.parserOptions
      : [options.parserOptions];

    // Function
    if (isFunction(options.parser)) {
      return options.parser(data, ...options.parserOptions);
    }

    // Parser methods
    let parserMethods = options.parserMethods || this.options.parserMethods;

    // Specific parsing
    if (isString(options.parser) && parserMethods[options.parser]) {
      return parserMethods[options.parser].parser(
        data,
        ...options.parserOptions
      );
    }
    else if (isString(options.parser) && !(options.parser in parserMethods)) {
      throw new Error(
        `The parser provided "${
          options.parser
        }" was not found in the "parserMethods" config option.`
      );
    }

    // If no source
    if (!options.source) {
      // TODO: Should this error?
      return data;
    }

    // Guess
    let matched = find(parserMethods, p => {
      return p.match && options.source && options.source.match(p.match);
    });
    if (!matched) {
      debug(
        `Unable to match a parser with source: "${options.source}"`,
        options
      );
    }
    else {
      return matched.parser(data, ...options.parserOptions);
    }

    debug('Unable to determine how to parse.', options);
    return data;
  }

  /**
   * Goes through an object and runs `this.parse` on each one, using the
   * key as the `source` property.
   *
   * @return The parsed data.
   */
  parseObject(data, options = {}) {
    // Check for object
    if (!isObject(data)) {
      throw new Error('Data passed to "parseObject" is not an object.');
    }

    return mapValues(data, (d, s) => {
      let o =
        options && options[s]
          ? merge(options[s], { source: s })
          : { source: s };
      return this.parse(d, o);
    });
  }

  /**
   * Transform fetch data.
   *
   * @return {Object} The transformed (or fetched if no transform) data.
   */
  transform() {
    // If cache point is set to transform, but there
    // is no transform hook
    if (
      this.option('cachePoint') === 'transform' &&
      !isFunction(this.options.transform)
    ) {
      throw new Error(
        `Package "${
          this.options.key
        }" has cachePoint set to "transform" but there is no "transform" function set.`
      );
    }

    // If we don't transform data from cache
    if (!this.data.transform) {
      // Do any transform processing
      if (this.data.fetch && isFunction(this.options.transform)) {
        this.data.transform = bind(this.options.transform, this)(
          this.data.fetch
        );
      }

      // Cache transform
      if (this.data.transform && this.option('cachePoint') === 'transform') {
        this.setCache('transform');
      }
    }

    return this.data.transform || this.data.fetch;
  }

  /**
   * Transform after all packages have been fetched and transformed.  This should
   * be passed the full supply package
   *
   * @param {Object} supplyPackage The full supply package object of transformed
   *   packages.
   * @return {Object} The bundled (or fetched or transformed) data.
   */
  bundle(supplyPackage) {
    // If cache point is set to transform, but there
    // is no transform hook
    if (
      this.option('cachePoint') === 'bundle' &&
      !isFunction(this.options.bundle)
    ) {
      throw new Error(
        `Package "${
          this.options.key
        }" has cachePoint set to "bundle" but there is no "bundle" function set.`
      );
    }

    // Do any bundle processing
    if (
      (this.data.fetch || this.data.transform) &&
      isFunction(this.options.bundle)
    ) {
      this.data.bundle = bind(this.options.bundle, this)(
        this.data.transform || this.data.fetch,
        supplyPackage
      );
    }

    // Cache bundle
    if (this.data.bundle && this.option('cachePoint') === 'bundle') {
      this.setCache('bundle');
    }

    return this.data.bundle || this.data.transform || this.data.fetch;
  }

  /**
   * Wrapper to get an option, and if a function, calling that
   * with context of this instance.
   *
   * @param {String} optionName The name of the option in the options property.
   * @return The option as is or if a function, then the output of
   *   that function.
   */
  option(optionName) {
    if (isFunction(this.options[optionName])) {
      return bind(this.options[optionName], this)();
    }

    return this.options[optionName];
  }

  /**
   * Get an ID for this package based on the `options.id` or a set
   * of properties in the `options` as defined by
   * `options.keyIdentifiers`.
   *
   * @return {Object} This instance.
   */
  createId() {
    // Can provide a specific id if needed
    if (this.option('id')) {
      this.id = this.option('id');
      return;
    }

    let keyObject = pick(this.options, this.options.keyIdentifiers);
    this.id = objectHash(keyObject);

    return this;
  }

  /**
   * Setup the cache.  Will create the cache directory and setup places
   * for each cache point.  Should be run in constructor.  Will create
   * the followig properties:
   *   - `this.cachePath`
   *   - `this.cacheFiles`
   *   - `this.cacheData`
   *
   * @return {Object} This instance.
   */
  setupCache() {
    // Cache paths
    this.cachePath = join(
      this.option('cachePath'),
      'packages',
      kebabCase(
        isFunction(this.options.type) && this.options.type.name
          ? this.options.type.name
          : this.options.type
      ),
      this.id
    );

    // Cache files based on cachePoints
    this.cacheFiles = {
      meta: join(this.cachePath, 'meta.json')
    };
    this.cachePoints.forEach(p => {
      this.cacheFiles[p] = join(this.cachePath, `data.${p}`);
    });

    // Make sure directory is there
    try {
      fs.mkdirpSync(this.cachePath);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to create cache directory "${
          this.cachePath
        }".  Use DEBUG=airsupply:* for more information.`
      );
    }

    // Setup cache data
    this.cacheData = {
      options: this.options
    };

    // Setup data
    this.data = {};

    // Get cache data
    // TODO: Is there any reason to get all data, or should
    // we only get the cachePoint data
    this.getCache(this.options.cachePoint);

    return this;
  }

  /**
   * Sets cache data to `this.cacheData` then saves the data in the file
   * defined in `this.cacheFiles`.
   *
   * @param {String} cachePoint The name of the cache point.  Should be one of
   *   `fetch`, `transform`, or `bundle`
   * @return {Object} This instance.
   */
  setCache(cachePoint) {
    // If no cache, ignore
    if (this.options.noCache) {
      return;
    }

    // If we don't have data, then no reason to do anything
    if (!this.data || !this.data[cachePoint]) {
      return;
    }

    // Easy reference
    let d = this.data[cachePoint];

    // Determine data format
    // TODO: Handle different types of data
    let format = isObject(d) || isArray(d) ? 'json' : 'string';

    // Update cache data
    this.cacheData[cachePoint] = {
      created: new Date().toUTCString(),
      file: this.cacheFiles[cachePoint],
      format
    };

    // Format data for saving
    let formatted = format === 'json' ? json.stringify(d) : d.toString();

    // Save data
    try {
      fs.writeFileSync(this.cacheFiles[cachePoint], formatted);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to save data to file: ${this.cacheFiles[cachePoint]}`
      );
    }

    // Save meta
    try {
      fs.writeFileSync(this.cacheFiles.meta, json.stringify(this.cacheData));
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to save cache meta data to file "${
          this.cacheFiles.meta
        }".  Use DEBUG=airsupply:* to see more information.`
      );
    }

    return this;
  }

  /**
   * Gets cache for a specific cache point.  Specifically sets data
   * in `this.cacheData` if the cache data is still valid.
   *
   * @param {String} cachePoint The name of the cache point.  Should be one of
   *   `fetch`, `transform`, or `bundle`
   * @return {Object} This instance.
   */
  getCache(cachePoint) {
    // If no cache, ignore
    if (this.options.noCache) {
      return;
    }

    // Get meta data
    try {
      fs.statSync(this.cacheFiles.meta);
      this.cacheData = json.parse(
        fs.readFileSync(this.cacheFiles.meta, 'utf-8')
      );
    }
    catch (e) {
      debug(e);
      return;
    }

    // Allow to not define cachePoint and get all
    (cachePoint ? [cachePoint] : this.cachePoints).forEach(c => {
      // Only get data that we have meta data for
      if (this.cacheData[c]) {
        try {
          fs.statSync(this.cacheFiles[c]);
        }
        catch (e) {
          debug(e);
          this.data[c] == false;
          return;
        }

        // Check times
        let now = new Date();
        let then = new Date(this.cacheData[c].created);
        if (now - then >= this.options.ttl) {
          this.data[c] == false;
          return;
        }

        // Read
        // TODO: Abstract out and handle different file types (specifically binary)
        let parser = this.cacheData[c].format === 'json' ? json.parse : d => d;
        this.data[c] = parser(fs.readFileSync(this.cacheFiles[c], 'utf-8'));
      }
    });

    return this;
  }

  /**
   * Deletes specific cache directory for this package.  Probably unnecessary
   * to call this directly.
   *
   * @param {Boolean} silent Whether to throw an error when there was a problem.
   * @return {Object} This instance.
   */
  removeCache(silent = false) {
    try {
      fs.removeSync(this.cachePath);
    }
    catch (e) {
      debug(e);
      if (!silent) {
        throw new Error(
          `Unable to remove directory (might not exist yet) "${
            this.cachePath
          }".  Use DEBUG=airsupply:* to see more information.`
        );
      }
    }

    return this;
  }
}
