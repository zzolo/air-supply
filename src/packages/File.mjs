/**
 * Local file
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

// Main class
class File extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Default to no caching.
      noCache: true
    });
  }

  // Main fetch
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

// Export
export default File;
