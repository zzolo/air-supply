/**
 * @ignore
 * HTTP package class module.  Gets data from an http source.
 *
 * @module air-supply/src/packages/Http
 */

// Dependencies
const BasePackage = require('./BasePackage');
const fetch = require('node-fetch');

// Debug
const debug = require('debug')('airsupply:http');

/**
 * Http package type.  Gets data from an "http://" source via [node-fetch](https://www.npmjs.com/package/node-fetch).
 *
 * @export
 * @class Http
 * @extends BasePackage
 *
 * @example
 * import Http from 'air-supply/src/packages/Http';
 * let f = new Http({ source: 'http://example.com/data.json' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The URI to the file to read data from.
 * @param {Object} [options.fetchOptions] `node-fetch` options.
 * @param {String} [options.fetchOptions.type='string'] Custom option to
 *   handle what kind of response we want from the fetch, can be
 *   either `buffer`, `json`, or `string`; defaults to `string`.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Http>} The new Http object.
 */
class Http extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {});
  }

  /**
   * Fetch implementation.  Utilizes [node-fetch](https://www.npmjs.com/package/node-fetch).
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let r;
    let options = this.option('fetchOptions') || {};

    try {
      r = await fetch(source, options);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Issue fetching resource "${
          this.options.key
        }" with source "${source}".  Use the DEBUG option to see more info.`
      );
    }

    if (!r.ok) {
      throw new Error(
        `Status "${r.status}" not OK when fetching resource "${
          this.options.key
        }" with source "${source}".`
      );
    }

    return await (options.type === 'buffer'
      ? r.buffer()
      : options.type === 'json'
        ? r.json()
        : r.text());
  }
}

// Export
module.exports = Http;
