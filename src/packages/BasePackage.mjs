/**
 * BasePackage type.  This should only be extended
 */

// Dependencies
import { join } from 'path';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import isArray from 'lodash/pick';
import isObject from 'lodash/pick';
import kebabCase from 'lodash/kebabCase';
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

// Class
class BasePackage {
  constructor(options = {}, airSupply, packageDefaults) {
    // 1. AirSupply class default options,
    // 2. Default options for package, and
    // 3. The actual options sent through
    this.options = merge(
      airSupply ? omit(airSupply.options, ['packages']) : {},
      packageDefaults || {
        // What properties in the options to use as the key
        // for caching
        keyIdentifiers: ['key', 'source'],
        // When to cache: [fetch, post-fetch, post-all]
        cachePoint: 'fetch',
        // To make sure it's defined
        type: 'base-no-fetch'
      },
      options
    );

    // Attach airsupply
    this.airSupply = airSupply;

    // Cache points
    this.cachePoints = ['fetch', 'post-fetch', 'post-all'];

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

  // Default post fetch method.  This can be called immiedately after
  // a fetch.
  postFetch() {
    // Cache fetch data
    if (this.data.fetch && this.option('cachePoint') === 'fetch') {
      this.setCache('fetch');
    }

    // Do any post fetch processing
    if (this.data.fetch && isFunction(this.options.postFetch)) {
      this.data['post-fetch'] = bind(this.options.postFetch, this)(
        this.data.fetch
      );
    }

    // Cache post fetch
    if (this.data['post-fetch'] && this.option('cachePoint') === 'post-fetch') {
      this.setCache('post-fetch');
    }

    return this.data['post-fetch'] || this.data.fetch;
  }

  // Post all function.  This gets called after all fetches and shoudl be passed the full
  // supply package
  postAll(supplyPackage) {
    // Do any post all processing
    if (
      (this.data.fetch || this.data['post-fetch']) &&
      isFunction(this.options.postAll)
    ) {
      this.data['post-all'] = bind(this.options.postAll, this)(
        this.data['post-fetch'] || this.data.fetch,
        supplyPackage
      );
    }

    // Cache post all
    if (this.data['post-all'] && this.option('cachePoint') === 'post-all') {
      this.setCache('post-all');
    }

    return this.data['post-all'] || this.data['post-fetch'] || this.data.fetch;
  }

  // Wrapper to get option from options to support functions
  option(o) {
    if (isFunction(this.options[o])) {
      return bind(this.options[o], this)();
    }

    return this.options[o];
  }

  // Create an id from specific options
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

  // Setup cache
  setupCache() {
    // Cache paths
    this.cachePath = join(
      this.option('cachePath'),
      'packages',
      kebabCase(this.options.type),
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

  // Set cache
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

  // Get cache
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

  // Remove cache (deletes directory and contents)
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

// Export
export default BasePackage;
