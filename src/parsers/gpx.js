/**
 * @ignore
 * GPX parser, uses [togeojson](https://github.com/mapbox/togeojson).
 */

const isString = require('lodash/isString');
const { DOMParser } = require('xmldom');

/**
 * KML parser.  Uses [togeojson](https://github.com/mapbox/togeojson) module.
 * togeojson module is not installed by default, if you need this parser,
 * install separately:
 *
 * ```sh
 * npm install @mapbox/togeojson
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install togeojson globally:
 *
 * ```sh
 * npm install -g @mapbox/togeojson
 * ```
 *
 * @name gpx
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Object} [options] Options, see [togeojson](https://github.com/mapbox/togeojson) for details.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, ...args) => {
  const { gpx } = require('@mapbox/togeojson');
  input = isString(input) ? input : input.toString('utf-8');
  let parsed = new DOMParser().parseFromString(input);

  return gpx(parsed, ...args);
};
