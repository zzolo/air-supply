/**
 * @ignore
 * HTTPs package class module.  Simply uses HTTP package
 *
 * @module air-supply/src/packages/Https
 *
 * @example
 * import Https from 'air-supply/src/packages/Https';
 * let f = new Https({ source: 'https://example.com/data.json' });
 * let data = f.cachedFetch();
 */

// Dependencies
import Http from './Http';

/**
 * Https package type.  Just extends the Http pacakge type; mostly provided for
 * guessing convienence.
 *
 * @export
 * @class Https
 * @extends Http
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The URI to the file to read data from.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Https>} The new Http object.
 */
export default class Https extends Http {}
