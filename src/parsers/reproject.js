/**
 * @ignore
 * Reproject, uses [reproject](https://github.com/perliedman/reproject).
 *
 * This isn't really a parser...
 */

const isString = require('lodash/isString');
const merge = require('lodash/merge');

/**
 * Reproject GeoJSON.  Uses
 * [reproject](https://www.npmjs.com/package/reproject) module.
 * The Reproject and EPSG modules are not installed by default, if
 * you need this parser, install separately:
 *
 * ```sh
 * npm install reproject epsg
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install Reproject and EPSG globally:
 *
 * ```sh
 * npm install -g reproject epsg
 * ```
 *
 * @name reproject
 * @export
 *
 * @param {Object|String|Buffer} input Geojson input.
 * @param {Object} [options] Options to pass to the parser
 * @param {String} [options.sourceCrs] Target CRS as EPSG definition.  Will try to find in
 *   geojson, but this is often not set.
 *   See [epsg module defs](https://github.com/stevage/epsg/blob/master/crs-defs.json) for
 *   reference.
 * @param {String} [options.targetCrs='EPSG:426'] Source CRS as EPSG definition.
 *   See [epsg module defs](https://github.com/stevage/epsg/blob/master/crs-defs.json) for
 *   reference.
 * @param {Object} [epsgSet=require('epsg')] An object of EPSG lookups, in the format:
 *
 * ```js
 * {
 *   'EPSG:4326': 'proj4 def ...'
 * }
 * ```
 *
 * @return {Object} Reprojected geojson.
 */
module.exports = (input, options = {}) => {
  const { reproject } = require('reproject');
  const epsg = options.epsgSet || require('epsg');

  options = merge(
    {},
    {
      targetCrs: 'EPSG:4326'
    },
    options
  );

  // Support multiple inputs
  input = Buffer.isBuffer(input)
    ? JSON.parse(input.toString('utf-8'))
    : isString(input)
      ? JSON.parse(input)
      : input;

  // Need source, try to get from geojson
  if (!options.sourceCrs) {
    try {
      options.sourceCrs = reproject.detectCrs(input, epsg);
    }
    catch (e) {
      throw new Error(
        'Reproject parser not given "sourceCrs" option, or unable to determine from geojson input; should be something like "EPSG:1234".'
      );
    }
  }

  // Check to see if EPSG
  if (!epsg[options.sourceCrs]) {
    throw new Error(
      `In reproject parser, unable to find the "sourceCrs" option "${
        options.sourceCrs
      }" in the EPSG set.  Try using a different EPSG code, such as "EPSG:4326", or using a custom EPSG set with the "epsgSet" option.`
    );
  }
  if (!epsg[options.targetCrs]) {
    throw new Error(
      `In reproject parser, unable to find the "targetCrs" option "${
        options.targetCrs
      }" in the EPSG set.  Try using a different EPSG code, such as "EPSG:4326", or using a custom EPSG set with the "epsgSet" option.`
    );
  }

  return reproject(input, options.sourceCrs, options.targetCrs, epsg);
};
