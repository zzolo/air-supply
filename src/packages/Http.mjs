/**
 * @ignore
 * HTTP package class module.  Gets data from an http source.
 *
 * @module air-supply/src/packages/Http
 *
 * @example
 * import Http from 'air-supply/src/packages/Http';
 * let f = new Http({ source: 'http://example.com/data.json' });
 * let data = f.cachedFetch();
 */

// Depenencies
import BasePackage from './BasePackage';
import * as fetchWrapper from 'node-fetch';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:http');

// Deal with import defaults
const fetch = fetchWrapper.default || fetchWrapper;

/**
 * Http package type.  Gets data from an "http://" source via [node-fetch](https://www.npmjs.com/package/node-fetch).
 *
 * @export
 * @class Http
 * @extends BasePackage
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The URI to the file to read data from.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Http>} The new Http object.
 */
export default class Http extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {});
  }

  /**
   * Fetch implementation.
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let r;

    try {
      r = await fetch(source, this.option('fetchOptions'));
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

    return await r.text();
  }
}
