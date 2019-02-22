/**
 * @ignore
 * Data package class module.  Just passes through "source" property.
 *
 * @module air-supply/src/packages/Data
 */

// Dependencies
const BasePackage = require('./BasePackage');

/**
 * Data package type.  Just passes through "source" property.
 *
 * @export
 * @class Data
 * @extends BasePackage
 *
 * @example
 * import Data from 'air-supply/src/packages/Data';
 * let f = new Data({ source: [1, 2, 3] });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The data that will come through.
 * @param {Boolean|String|Function|Array|Object} [options.parsers=false]
 *   Explicitly turns parsing off by default.
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Data>} The new Data object.
 */
class Data extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      type: 'data',
      // Default, assume no parsing is needed
      parsers: false
    });
  }

  /**
   * Fetch implementation.  Just passes source through.
   *
   * @async
   * @return {Object} The source data.
   */
  async fetch() {
    return await this.option('source');
  }
}

// Export
module.exports = Data;
