/**
 * @ignore
 * Directory package class module.  Gets data from local
 * directory.
 *
 * @module air-supply/src/packages/Directory
 */

// Dependencies
const BasePackage = require('./BasePackage');
const merge = require('lodash/merge');
const { statSync, readFileSync } = require('fs');
const { relative } = require('path');
const glob = require('glob');

// Debug
//const debug = require('debug')('airsupply:directory');

/**
 * Directory package type.  Gets data from local files in a directory
 * using [glob](https://github.com/isaacs/node-glob).
 *
 * @export
 * @class Directory
 * @extends BasePackage
 *
 * @example
 * import Directory from 'air-supply/src/packages/Directory';
 * let f = new Directory({ source: 'directory/*.csv' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The glob path to a directory;
 *   for instance to get all files in a directory: `directory/*.*`.
 * @param {Boolean} [options.noCache=true] Defaults to no caching, since
 *   caching is essentially the same.  Might be useful to turn on
 *   if there is a lot of transforming.
 * @param {Object} [options.parsers={ multiSource: true }] Parser
 *   options to default to multiple sources.
 * @param {Object} [options.fetchOptions] Options given to
 *   [glob](https://github.com/isaacs/node-glob#options)
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Directory>} The new Directory object.
 */
class Directory extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      type: 'directory',
      // Default to no caching.
      noCache: true,
      // Will be an multi-source object
      parsers: {
        multiSource: true
      }
    });
  }

  /**
   * Fetch implementation.  Utilizes [glob](https://github.com/isaacs/node-glob)
   * to search directory.
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    // Get the source.  Source can be a function, so, use the
    // this.option method.
    let source = this.option('source');
    let cwd = process.cwd();

    // Check to see if source is just a directory with no globbing
    let isDirectory = false;
    try {
      let stat = statSync(source);
      isDirectory = stat.isDirectory();
    }
    catch (e) {
      // Do nothing
    }

    // Add default glob
    if (isDirectory) {
      cwd = source;
      source = `${source}/**/*`;
    }

    // Glob
    let globs = glob.sync(
      source,
      merge(
        {
          // For some reason, the cwd handling is not consistent,
          // at least in the tests
          absolute: true,
          cwd
        },
        this.options.fetchOptions
      )
    );
    if (!globs || !globs.length) {
      throw new Error(
        `Package "${
          this.options.key
        }" did not find any files matching the source: "${source}"`
      );
    }

    // Go through each file
    let files = {};
    globs.forEach(file => {
      files[relative(cwd, file)] = readFileSync(file, 'utf-8');
    });

    // Return files
    return files;
  }
}

// Export
module.exports = Directory;
