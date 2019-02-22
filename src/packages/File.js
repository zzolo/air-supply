/**
 * @ignore
 * File package class module.  Gets data from local
 * file system.
 *
 * @module air-supply/src/packages/File
 */

// Dependencies
const BasePackage = require('./BasePackage');
const fs = require('fs-extra');

// Debug
const debug = require('debug')('airsupply:file');

/**
 * File package type.  Gets data from local files.
 *
 * @export
 * @class File
 * @extends BasePackage
 *
 * @example
 * import File from 'air-supply/src/packages/File';
 * let f = new File({ source: 'file.json' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The path to the file.
 * @param {Boolean} [options.noCache=true] Defaults to no caching, since
 *   caching is essentially the same.  Might be useful to turn on
 *   if there is a lot of transforming.
 * @param {Object|String} [options.fetchOptions='utf-8'] Options given to
 *   [readFileSync](https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options)
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<File>} The new File object.
 */
class File extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      type: 'file',
      // Default to no caching.
      noCache: true,
      // Default, assume string data
      fetchOptions: 'utf-8'
    });
  }

  /**
   * Fetch implementation.  Utilizes readFileSync.
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    // Get the source.  Source can be a function, so, use the
    // this.option method.
    let source = this.option('source');

    // Check for source
    try {
      fs.statSync(source);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to find or read file from package "${
          this.options.key
        }": ${source} (use the DEBUG option to see more info)`
      );
    }

    // Get file contents
    return fs.readFileSync(source, this.options.fetchOptions);
  }
}

// Export
module.exports = File;
