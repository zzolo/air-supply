/**
 * @ignore
 * Shapefile .zip parsing with shpjs
 */

const shp = require('shpjs');

/**
 * Shapefile parser.  Uses [shpjs](https://github.com/calvinmetcalf/shapefile-js) module
 * as it supports using a .zip source.
 *
 * @name shapefile
 * @export
 *
 * @param {String|Buffer} input Buffer or filename to parse.
 * @param {Object} [options] Options...
 *
 * @return {Object} Parsed data.
 */
module.exports = shp;
