/**
 * @ignore
 * KML parser, uses [togeojson](https://github.com/mapbox/togeojson).
 */

import isString from 'lodash/isString';
import togeojson from '@mapbox/togeojson';
import xmldom from 'xmldom';

/**
 * KML parser.  Uses [togeojson](https://github.com/mapbox/togeojson) module.
 *
 * @name kml
 * @export
 *
 * @param {String!} input Data to parse.
 * @param {Object} [options] Options, see [togeojson](https://github.com/mapbox/togeojson) for details.
 *
 * @return {Object} Parsed data.
 */
export default (input, options = {}) => {
  input = isString(input) ? input : input.toString('utf-8');
  let kml = new xmldom.DOMParser().parseFromString(input);

  return togeojson.kml(kml, options);
};
