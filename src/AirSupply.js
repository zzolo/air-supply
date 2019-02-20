/**
 * @ignore
 * AirSupply class module.  Can be used directly if needed.
 *
 * @module air-supply/src/AirSupply
 *
 * @example
 * import AirSupply from 'air-supply/src/AirSupply';
 */

// Dependencies
const { statSync } = require('fs');
const { join, dirname } = require('path');
const { parse: parseUrl } = require('url');
const defaultParsers = require('./parsers/default-parsers');
const merge = require('lodash/merge');
const size = require('lodash/size');
const isString = require('lodash/isString');
const isFunction = require('lodash/isFunction');
const isPlainObject = require('lodash/isPlainObject');
const upperFirst = require('lodash/upperFirst');
const camelCase = require('lodash/camelCase');
const cosmiconfig = require('cosmiconfig');
const json = require('json5');

// Debug
const debug = require('debug')('airsupply');

/**
 * The AirSupply class is the main way
 * of collecting data via AirSupply.
 *
 * Any options given to AirSupply will be provided to packages
 * as defaults before their own default or your specific options.
 *
 * @export
 * @class AirSupply
 * @param {Object} options Options object.
 * @param {Object} options.packages The object describing each package,
 *   in format:
 * @param {Number} [options.ttl=300000] The global length of cache in milliseconds
 * @param {String} [options.cachePath='.air-supply-cache'] The location of the
 *   cache data, defaults to the .air-supply-cache/ directory in the current
 *   working path.
 * @param {String} [options.config] A specific configuration file
 * @param {Boolean} [options.noConfig = false] If true, will ensure that
 *   AirSupply will not look for or load a config file.
 * @param {Object} [options.parserMethods] The object describing available
 *   parsers.  This is the default built-in parsers by default.  To override
 *   use format:
 *     `{ parser: { match: /parser$/, parser: (data, options) => { ... }}}`
 * @param {Object} [options.sharedProtocols] The object that will map
 *   protocols to other protocols; protocols translate to package
 *   classes (i.e. http -> Http package class).  Should be similar to:
 *     `{ https: 'http'}`
 *
 * @return {<AirSupply>} The new AirSupply object.
 */
class AirSupply {
  // Constructor
  constructor(options = {}) {
    // Get configuration from a config file
    let config = this.loadConfig(options);

    // Compile options
    this.options = merge(
      {
        ttl: 5 * 60 * 1000,
        cachePath: join(process.cwd(), '.air-supply-cache'),
        // This option name is :/
        parserMethods: defaultParsers,
        sharedProtocols: {
          https: 'http',
          mysql: 'sql',
          mariadb: 'sql',
          postgres: 'sql',
          pg: 'sql',
          mssql: 'sql',
          sqlite: 'sql'
        }
      },
      config || {},
      options || {}
    );

    return this;
  }

  /**
   * Bundles all the package data.  This will use the options.packages provided to AirSupply
   * as well as any provided options.
   *
   * @async
   * @param {Object?} packages An object describing packages. This is the same
   *   as the constructor option, but will not get attached to the AirSupply object
   *   for future reference.
   *
   * @return {Promise<Object>} The compiled data.
   */
  async supply(packages = {}) {
    // Combine instance packages with method packages
    try {
      packages = merge({}, this.options.packages || {}, packages || {});
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
        // Create instance
        this.packages[si] = this.package(packages[si], si);

        // Do fetch
        this.supplyPackages[si] = await this.packages[si].cachedFetch();

        // Do transform
        this.supplyPackages[si] = await this.packages[si].transform();
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

  /**
   * Given a config, gets a package instance.
   *
   * @param {Object!} config An object for defining the package.  This will be the options
   *   passed to the package object, plus the following necessary properties.
   * @param {String|Function!} config.type This is either the package class name as a string,
   *   or directly passed the package class.
   * @param {String!} config.key The package key that helps assign the package to the
   *   bundled supply package.
   *
   * @return {Object} The instantiated package.
   */
  package(config, key) {
    // Check that the config is an object or string
    if (!isString(config) && !isPlainObject(config)) {
      throw new Error(
        `AirSupply package "${key}" provided was not a string or object.`
      );
    }

    // If string, make into an object
    if (isString(config)) {
      config = {
        source: config
      };
    }

    // Add key to config
    config.key = key;

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
    if (isString(config.type)) {
      try {
        let packageType = require(`./packages/${upperFirst(
          camelCase(config.type)
        )}`);
        config.type = packageType;
      }
      catch (e) {
        throw new Error(
          `AirSupply package "${
            config.key
          }" unable to find Package class for type "${config.type}".`
        );
      }
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

  /**
   * Given a pcakage config, guess what the type is.
   *
   * @param {Object!} config A package config.
   *
   * @return {Object} The altered package config.
   */
  guessPackageType(config = {}) {
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
      config.type = 'data';
      return config;
    }

    // Try file system
    try {
      let stat = statSync(config.source);
      config.type = stat.isDirectory() ? 'directory' : 'file';
    }
    catch (e) {
      // Keep going
    }

    // Try to parse URL
    try {
      let p = parseUrl(config.source);
      if (p && p.protocol) {
        // The : comes through protocol parsing
        let proto = p.protocol.replace(/[^a-z-]/gi, '');
        proto = this.options.sharedProtocols[proto]
          ? this.options.sharedProtocols[proto]
          : proto;
        config.type = proto;
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

  /**
   * Load config via [cosmiconfig]().
   *
   * @param {Object?} options Options passed into AirSupply, specifically using the
   *   following properties
   * @param {String} options.config Path to specific file to load for config.
   * @param {Boolean} options.noConfig Use true to skip the config check.
   */
  loadConfig(options = {}) {
    // If there's noConfig, stop
    if (options && options.noConfig === true) {
      return;
    }

    // Setup cosmiconfig
    let moduleName = 'air-supply';
    let c = cosmiconfig(moduleName, {
      // Update search places to allow for JSON5
      searchPlaces: [
        'package.json',
        `.${moduleName}`,
        `.${moduleName}.json`,
        `.${moduleName}.json5`,
        `.${moduleName}.yaml`,
        `.${moduleName}.yml`,
        `.${moduleName}.js`,
        `${moduleName}.config.js`
      ],
      loaders: {
        noExt: (filePath, content) => {
          return json.parse(content);
        },
        '.json5': (filePath, content) => {
          return json.parse(content);
        },
        '.json': (filePath, content) => {
          return json.parse(content);
        }
      }
    });

    // If we were given a specific file
    let config;
    if (options.config) {
      config = c.loadSync(options.config);
    }
    else {
      config = c.searchSync();
    }

    // If we found a config, we will update cwd
    if (config && config.filepath) {
      process.chdir(dirname(config.filepath));
      return config.config;
    }
  }
}

// Export
module.exports = AirSupply;
