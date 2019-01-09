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
import merge from 'lodash/merge';
import * as ioWrapper from 'indian-ocean';
import * as fsWrapper from 'fs-extra';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:file');

// Deal with import defaults
const fs = fsWrapper.default || fsWrapper;
const io = ioWrapper.default || ioWrapper;

/**
 * File package type.  Gets data from local files.  Utilizes [indian-ocean](https://mhkeller.github.io/indian-ocean/)
 * to read multiple types of files and directories.
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
 * @param {Object?} options.fetchOptions Options object sent to [`re  adDataSync`](https://mhkeller.github.io/indian-ocean/#readDataSync) or [`readdirFilterSync`](https://mhkeller.github.io/indian-ocean/#readdirFilterSync) if a directory.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<File>} The new BasePackage object.
 */
export default class File extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Default to no caching.
      noCache: true
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
    let stat;
    // Get the source.  Source can be a function, so, use the
    // this.option method.
    let source = this.option('source');

    // Check for source
    try {
      stat = fs.statSync(source);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to find or read file from package "${
          this.options.key
        }": ${this.option('source')}`
      );
    }

    // Read file or directory
    // TODO: The directory read doesn't pass options to readData
    return stat.isDirectory()
      ? io
        .readdirFilterSync(
          source,
          merge({ fullPath: true }, this.options.fetchOptions || {})
        )
        .map(io.readDataSync)
      : io.readDataSync(source, this.options.fetchOptions || {});
  }
}
