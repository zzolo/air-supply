/**
 * Main AirSupply class
 */

// Dependencies
import { statSync } from 'fs';
import { join } from 'path';
import { parse as parseUrl } from 'url';
import merge from 'lodash/merge';
import size from 'lodash/size';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import * as debugWrapper from 'debug';
import * as packageTypes from './packages';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply');

// AirSupply class
class AirSupply {
  constructor(options = {}) {
    this.options = merge(
      {
        ttl: 60 * 1000,
        cachePath: join(process.cwd(), '.air-supply')
      },
      options
    );
  }

  // Main function get data
  async supply(packages = {}) {
    // Combine instance packages with method packages
    try {
      packages = merge({}, this.options.packages || {}, packages);
    }
    catch (e) {
      debug(e);
      throw new Error(
        'Packages provided to AirSupply object or supply method were invalid; use DEBUG=airsupply:* to see more information.'
      );
    }

    // Check for packages
    if (!packages || !isPlainObject(packages) || !size(packages)) {
      throw new Error(
        'No packages provided to AirSupply or packages is not a valid object.'
      );
    }

    // Setup objects to collect data and packages
    this.supplyPackages = {};
    this.packages = {};

    // Go through packages
    for (let si in packages) {
      if (packages.hasOwnProperty(si)) {
        packages[si].key = si;

        // Create instance
        this.packages[si] = await this.package(packages[si]);

        // Do fetch (wtih transform)
        this.supplyPackages[si] = await this.packages[si].cachedFetched();
      }
    }

    // Do any bundle processing
    for (let si in packages) {
      if (packages.hasOwnProperty(si)) {
        this.supplyPackages[si] = await this.packages[si].bundle(
          this.supplyPackages
        );
      }
    }

    // Return supply package
    return this.supplyPackages;
  }

  // Get a specific package
  async package(config) {
    // Check that the config is an object or string
    if (!isString(config) || !isPlainObject(config)) {
      throw new Error(
        `AirSupply package "${config.key}" provided was not a string or object.`
      );
    }

    // If string, make into an object
    if (isString(config)) {
      config = {
        source: config
      };
    }

    // Make sure we have a source
    if (config.source !== 0 && !config.source) {
      throw new Error(
        `AirSupply package "${
          config.key
        }" does not have a necessary "source" property.`
      );
    }

    // If not type, try to determine what type it is
    if (!config.type) {
      config = this.guessPackageType(config);
    }

    // Try to match up a string type
    if (
      isString(config.type) &&
      packageTypes[upperFirst(camelCase(config.type))]
    ) {
      config.type = packageTypes[upperFirst(camelCase(config.type))];
    }

    // Look for type. Not a real way to test for Classes
    if (!isFunction(config.type)) {
      throw new Error(
        `AirSupply package "${
          config.key
        }" does not have a known "type" or is not provided a package Class.`
      );
    }

    return new config.type(config, this);
  }

  // Try to guess the package type
  guessPackageType(config) {
    // If function, then we can't guess
    if (isFunction(config.source)) {
      throw new Error(
        `AirSupply package "${
          config.key
        }" did not have a "type" property defined, but provided a "source" function.  This is confusing; if you want to have the "source" be a function, make sure to provided a "type".`
      );
    }

    // If source is not a string or a function, then assume raw data
    if (!isString(config.source)) {
      config.type = 'raw-data';
      return config;
    }

    // Try file system
    try {
      statSync(config.source);
      config.type = 'file';
    }
    catch (e) {
      // Keep going
    }

    // Try to parse URL
    try {
      let p = parseUrl(config.source);
      if (p && p.protocol) {
        // The : comes through protocol parsing
        config.type = `remote-${p.protocol.replace(/[^a-z-]/gi, '')}`;
      }
    }
    catch (e) {
      // Keep going
    }

    // No more guesses
    if (!config.type) {
      throw new Error(
        `Unable to guess type of AirSupply source "${
          config.key
        }".  If this is a file, make sure that it exists first.  Source provided: ${
          config.source
        }`
      );
    }

    return config;
  }
}

// Export
export default AirSupply;
