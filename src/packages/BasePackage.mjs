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

    // Create id based on options
    this.createId();

    // Setup cache
    this.setupCache();

    return this;
  }

  // Create an id from specific options
  createId() {
    // Can provide a specific id if needed
    if (this.options.id) {
      this.id = this.options.id;
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
      this.options.cachePath,
      'packages',
      kebabCase(this.options.type),
      this.id
    );

    // Cache files based on when/hooks
    this.cacheFiles = {
      fetch: join(this.cachePath, 'data.fetch'),
      'post-fetch': join(this.cachePath, 'data.post-fetch'),
      'post-all': join(this.cachePath, 'data.post-all'),
      meta: join(this.cachePath, 'meta.json')
    };

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
    this.cacheData = {};

    return this;
  }

  // Set cache
  setCache(cachePoint) {
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
      options: this.options,
      created: new Date().toUTCString(),
      format
    };

    // Format data for saving
    let formatted = format === 'json' ? json.parse(d) : d.toString();

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
      fs.writeFileSync(this.cacheFiles.meta, json.format(this.cacheData));
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
