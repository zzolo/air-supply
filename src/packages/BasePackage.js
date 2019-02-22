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
const { join } = require('path');
const merge = require('lodash/merge');
const omit = require('lodash/omit');
const pick = require('lodash/pick');
const find = require('lodash/find');
const kebabCase = require('lodash/kebabCase');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const isPlainObject = require('lodash/isPlainObject');
const isString = require('lodash/isString');
const isFunction = require('lodash/isFunction');
const bind = require('lodash/bind');
const fs = require('fs-extra');
const objectHash = require('object-hash');
const json = require('json5');

// Debug
const debug = require('debug')('airsupply:basepackage');

/**
 * The base Package class that is meant to be extended
 * for each Package type class.
 *
 * Do not use this class directly.
 *
 * @export
 * @class BasePackage
 *
 * @param {Object} [options={}] Options for this package.  These options are true for every
 *   Package type, though a Package defaults may override these defaults.
 *
 *   More options defaults come in from the AirSupply object, for example `options.ttl`.
 *   See {@link AirSupply}.
 * @param {Array} [options.keyIdentifiers=['key', 'source']] An array of properties in the options
 *   that will get used to create the cache key.
 * @param {String} [options.cachePoint='fetch'] A string the defines when caching will happen;
 *   the options are:
 *     - fetch: Caching happens after fetch
 *     - transform: Caching happens after the transform function is performed
 *     - bundle: Caching happens after bundle function is preformed
 * @param {Function} [options.transform] A function to transform data after
 *   it has been fetched and parsed.  The only argument is the data, and `this`
 *   will refer to this package instance.  Should return the altered data.
 * @param {Function} [options.bundle] A function to alter the data once all
 *   packages have been transformed.  This is useful if data should be altered
 *   based on other packages.  The only argument is all transformed
 *   package data (not just this one) in the Air Supply bundle, and `this`
 *   will refer to this package instance.  Should return only this package data.
 * @param {String} [options.output] A file path to save the package data locally.
 *   This is the data after any transform or bundle.  This is useful if you need
 *   your data an asynchronous client call or something.
 * @param {Function|String} [options.outputJsonStringify=JSON.stringify] The
 *   JSON stringify function to use if the output will be treated like JSON.
 *   Defaults to Node's implementation, otherwise a function can be passed, or
 *   `'json5'` which will use the json5 module's stringify function.
 * @param {String} [type] This describes the type of package and used in
 *   creating the cache path.  This is also automatically set by each
 *   Package type and should not need to be set manually.  For instance
 *   the GoogleSheet Package uses `'google-sheet'`.
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes and defining defaults.
 * @param {Object} [packageDefaults] This is used for classes that extend this class, so
 *   that they can provid default options.
 *
 * @return {<BasePackage>} The new BasePackage object.
 */
class BasePackage {
  // Constructor
  constructor(options = {}, airSupply, packageDefaults) {
    // 1. AirSupply class default options,
    // 2. Default options from BasePackage, and
    // 3. Default options for package, and
    // 4. The actual options sent through
    this.options = merge(
      {},
      airSupply ? omit(airSupply.options, ['packages']) : {},
      {
        // What properties in the options to use as the key
        // for caching
        keyIdentifiers: ['key', 'source'],
        // When to cache: ['fetch', 'transform', 'bundle']
        cachePoint: 'fetch',
        outputJsonStringify: JSON.stringify,
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
      if (isPlainObject(this.options.parsers)) {
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
      this.data.fetch = await this.parse(this.data.fetch, this.options.parsers);

      // Cache fetch data
      if (this.data.fetch && this.option('cachePoint') === 'fetch') {
        this.setCache('fetch');
      }
    }

    return this.data.fetch;
  }

  /**
   * Run data through multiple parsers.
   *
   * @param data The data to parse.
   * @param {Array|Object|String|Boolean} [options] The options for each
   *   parser.  Can be a number of things:
   *
   *   - `undefined`: The package will try to determine which parser to
   *      use by looking at the source.
   *   - `false`: No parsing will happen.
   *   - `{String}`: Example 'csv'. It will use that parser with any
   *      default options.
   *   - `{Function}`: It will simply run the data through that function.
   *   - `{Object}`: Should have a "parser" key which is the is one of
   *      the above options, and optionally a "parserOptions" that will
   *      get passed the parser function. Or it can just be
   *      `{ multiSource: true }` which will assume the data coming in is
   *      an object where each key is a source.
   *      See {@link BasePackage#parseObject}
   *   - `{Array}`: For multiple parsers, use an array with any
   *       of the above options.
   *
   * @return The parsed data.
   */
  async parse(data, options) {
    options = isArray(options) ? options : [options];

    // Go through each parser
    let parsed = data;
    for (let oi in options) {
      parsed = await this.parseData(parsed, options[oi]);
    }

    return parsed;
  }

  /**
   * Run data through single parser
   *
   * @param data The data to parse.
   * @param {Array|Object|String|Boolean} [options] The options for each
   *   parser.  Can be a number of things.  See: {@link BasePackage#parse}
   *
   * @return The parsed data.
   */
  async parseData(data, options = {}) {
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
      return await this.parseObject(data, options);
    }

    // For parser options, we will spread if an array
    options.parserOptions = isArray(options.parserOptions)
      ? options.parserOptions
      : [options.parserOptions];

    // Function
    if (isFunction(options.parser)) {
      return await options.parser(data, ...options.parserOptions);
    }

    // Parser methods
    let parserMethods = options.parserMethods || this.options.parserMethods;

    // Specific parsing
    if (isString(options.parser) && parserMethods[options.parser]) {
      return await parserMethods[options.parser].parser(
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
      return await matched.parser(data, ...options.parserOptions);
    }

    debug('Unable to determine how to parse.', options);
    return data;
  }

  /**
   * Goes through an object and runs `this.parse` on each one, using the
   * key as the `source` property.
   *
   * @param {Object} data The to parse; should be an Object.
   * @param {Object} [options] An object where each key matches the
   *   key from the data, and the value is passed to `this.parse`.
   *   See: {@link BasePackage#parse}
   *
   * @example
   * parseObject({
   *   'yaml-file.yaml': 'yaml: "data"',
   *   'json-file.json': '{ "yaml": "data" }'
   * }, {
   *   'yaml-file.yaml': "yaml",
   *   'json-file.json': ["json", customParserFunction]
   * });
   *
   * @return The parsed data.
   */
  async parseObject(data, options = {}) {
    // Check for object
    if (!isObject(data)) {
      throw new Error('Data passed to "parseObject" is not an object.');
    }

    for (let di in data) {
      if (data.hasOwnProperty(di)) {
        let o =
          options && options[di]
            ? merge(options[di], { source: di })
            : { source: di };
        data[di] = await this.parse(data[di], o);
      }
    }

    return data;
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
   * Save fully bundle(d) output to disk if `options.output`
   * is provided.
   *
   * @return Self
   */
  output() {
    if (!this.options.output) {
      return this;
    }

    // If function, simply call function
    if (isFunction(this.options.output)) {
      bind(this.options.output, this)();
      return this;
    }

    // If string
    if (isString(this.options.output)) {
      this.writeFile(
        this.options.output,
        this.data.bundle || this.data.transform || this.data.fetch,
        undefined,
        this.options.outputJsonStringify === 'json5'
          ? json.stringify
          : isFunction(this.options.outputJsonStringify)
            ? this.options.outputJsonStringify
            : JSON.stringify
      );
    }

    return this;
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
    // if (this.options.noCache) {
    //   return;
    // }

    // If we don't have data, then no reason to do anything
    if (!this.data || !this.data[cachePoint]) {
      return;
    }

    // Easy reference
    let d = this.data[cachePoint];

    // Determine data format
    let format = this.dataFileEncoding(d);

    // Update cache data
    this.cacheData[cachePoint] = {
      created: new Date().toUTCString(),
      file: this.cacheFiles[cachePoint],
      format
    };

    // Save data
    try {
      this.writeFile(this.cacheFiles[cachePoint], d, format);
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

  /**
   * Determines data type for writing to the file system.
   *
   * @param data Data to look at
   *
   * @return {String|Boolean} Returns `'buffer'` if is a buffer,
   *   `'json'` if it is an Object or Array, `'string'` for things
   *   that have a `toString()` method, and `false` for undefined
   *   or null and everything else.
   */
  dataFileEncoding(data) {
    if (data === undefined || data === null) {
      return false;
    }
    else if (Buffer.isBuffer(data)) {
      return 'buffer';
    }
    else if (isArray(data) || isPlainObject(data)) {
      return 'json';
    }
    else if (data && data.toString) {
      return 'string';
    }

    return false;
  }

  /**
   * Wrapper around writeFileSync that looks at what
   * kind of data it is and sets appropriately.
   *
   * @param {String} filePath The path to the file
   * @param data Data to save
   * @param {String} [fileEncoding] Specific string to determine
   *   how to encode this data.  Will use `dataFileEncoding` if
   *   not specified.
   *   See {@link BasePackage#dataFileEncoding}
   * @param {Function} [jsonStringify=json5.stringify] Function
   *   to use when encoding json data.  Defaults to json5 module.
   *
   * @return {String} The type of formatting that was used,
   *   can be `string`, `json`, or `buffer`
   */
  writeFile(filePath, data, fileEncoding, jsonStringify = json.stringify) {
    if (!fileEncoding) {
      fileEncoding = this.dataFileEncoding(data);
    }

    // TODO: What to do if fileEncoding is false?

    // Write file
    fs.writeFileSync(
      filePath,
      fileEncoding === 'buffer'
        ? data
        : fileEncoding === 'json'
          ? jsonStringify(data)
          : data && data.toString
            ? data.toString()
            : data
    );
  }
}

// Export
module.exports = BasePackage;
