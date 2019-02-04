/**
 * @ignore
 * HTTP package class module.  Gets data from an http source.
 *
 * @module air-supply/src/packages/File
 *
 * @example
 * import Http from 'air-supply/src/packages/Http';
 * let f = new Http({ source: 'http://example.com/data.json' });
 * let data = f.cachedFetch();
 */

// Depenencies
import BasePackage from './BasePackage';
import merge from 'lodash/merge';
import * as ioWrapper from 'indian-ocean';
import * as fsWrapper from 'fs-extra';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:http');

// Deal with import defaults
const fs = fsWrapper.default || fsWrapper;
const io = ioWrapper.default || ioWrapper;

/**
 * Http package type.  Gets data from a .
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
  async fetch() {}
}
