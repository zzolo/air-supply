/**
 * @ignore
 * Directory package class module.  Gets data from local
 * directory.
 *
 * @module air-supply/src/packages/Directory
 *
 * @example
 * import Directory from 'air-supply/src/packages/Directory';
 * let f = new Directory({ source: 'directory/*.csv' });
 * let data = f.cachedFetch();
 */

// Dependencies
import BasePackage from './BasePackage';
import mapValues from 'lodash/mapValues';
import find from 'lodash/find';
import merge from 'lodash/merge';
import { statSync, readFileSync } from 'fs';
import { relative } from 'path';
import * as globWrapper from 'glob';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:directory');

// Deal with import defaults
const glob = globWrapper.default || globWrapper;

/**
 * Directory package type.  Gets data from local files in a directory
 * using [glob](https://github.com/isaacs/node-glob).
 *
 * @export
 * @class Directory
 * @extends BasePackage
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The glob path to a directory; for instance to get
 *   all files in a directory: `directory/*.*`.
 * @param {Boolean?} [options.noCache=true] Defaults to no caching, since caching is done
 *   with local files.
 * @param {Object?} [options.fetchOptions] Options given to [glob](https://github.com/isaacs/node-glob#options)
 *
 * @return {<Directory>} The new Directory object.
 */
export default class Directory extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Default to no caching.
      noCache: true
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

  // Override parse function to parse each file separately
  parse() {
    // Guess parser
    const findParser = file => {
      let parser = find(this.options.parsers, p => {
        return p.match && file && file.match(p.match);
      });

      return parser ? parser.parser : d => d;
    };

    // Go through each file
    return mapValues(this.data.fetch, (data, file) => {
      return findParser(file)(data);
    });
  }
}
