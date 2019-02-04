/**
 * @ignore
 * Data package class module.  Just passes through "source" property.
 *
 * @module air-supply/src/packages/Data
 *
 * @example
 * import Data from 'air-supply/src/packages/Data';
 * let f = new Data({ source: [1, 2, 3] });
 * let data = f.cachedFetch();
 */

// Dependencies
import BasePackage from './BasePackage';

/**
 * Data package type.  Just passes through "source" property.
 *
 * @export
 * @class File
 * @extends BasePackage
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The data that will come through.
 * @param {Boolean?} [options.noCache=true] Turn caching off or leave on.
 * @param {Boolean|String|Function?} [options.parser=false] Explicitly turns
 *   parsing off by default.
 *
 * @return {<Data>} The new File object.
 */
export default class File extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Default to no caching.
      noCache: true,
      // Default, assume no parsing is needed
      parser: false
    });
  }

  /**
   * Fetch implementation.  Just passes source through.
   *
   * @async
   * @return {Object} The source data.
   */
  async fetch() {
    return this.option('source');
  }
}
