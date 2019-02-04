/**
 * @ignore
 * File package class module.  Gets data from local
 * file system.
 *
 * @module air-supply/src/packages/File
 *
 * @example
 * import File from 'air-supply/src/packages/File';
 * let f = new File({ source: 'file.json' });
 * let data = f.cachedFetch();
 */

// Depenencies
import BasePackage from './BasePackage';
import * as fsWrapper from 'fs-extra';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:file');

// Deal with import defaults
const fs = fsWrapper.default || fsWrapper;

/**
 * File package type.  Gets data from local files.
 *
 * @export
 * @class File
 * @extends BasePackage
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The path to the file or directory to read data from.
 * @param {Boolean?} [options.noCache=true] Turn caching off or leave on.
 * @param {Object?} [options.fetchOptions='utf-8'] Options given to [readFileSync](https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options)
 *
 * @return {<File>} The new File object.
 */
export default class File extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Default to no caching.
      noCache: true,
      // Default, assume string data
      fetchOptions: 'utf-8'
    });
  }

  /**
   * Fetch implementation.  Utilizes [indian-ocean](https://mhkeller.github.io/indian-ocean/)
   * to read multiple types of files and directories.
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
