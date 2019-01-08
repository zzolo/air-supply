/**
 * Local file
 */

// Depenencies
import BasePackage from './BasePackage';
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
  fetch() {
    let stat;
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
    this.data.fetch = stat.isDirectory()
      ? io.readdirFilterSync(source, this.options.fetchOptions)
      : io.readDataSync(source, this.options.fetchOptions);

    // Do post fetch process
    this.postFetch();

    return this;
  }
}

// Export
export default File;
