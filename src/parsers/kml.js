/**
 * @ignore
 * KML parser, uses [togeojson](https://github.com/mapbox/togeojson).
 */

const isString = require('lodash/isString');
const { kml } = require('@mapbox/togeojson');
const { DOMParser } = require('xmldom');

/**
 * KML parser.  Uses [togeojson](https://github.com/mapbox/togeojson) module.
 *
 * @name kml
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Object} [options] Options, see [togeojson](https://github.com/mapbox/togeojson) for details.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, ...args) => {
  input = isString(input) ? input : input.toString('utf-8');
  let parsed = new DOMParser().parseFromString(input);

  return kml(parsed, ...args);
};
