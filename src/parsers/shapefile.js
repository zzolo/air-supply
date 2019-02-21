/**
 * @ignore
 * Shapefile .zip parsing with shpjs
 */

/**
 * Shapefile parser.  Uses
 * [shpjs](https://github.com/calvinmetcalf/shapefile-js) module
 * as it supports using a .zip source.  ShpJS module is not installed
 * by default, if you need this parser, install separately:
 *
 * ```sh
 * npm install shpjs
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install ShpJS globally:
 *
 * ```sh
 * npm install -g shpjs
 * ```
 *
 * @name shapefile
 * @export
 *
 * @param {String|Buffer} input Buffer or filename to parse.
 * @param {Object} [options] Options...
 *
 * @return {Object} Parsed data.
 */
module.exports = (...args) => {
  const shp = require('shpjs');
  return shp(...args);
};
