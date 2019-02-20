/**
 * @ignore
 * Default parser object.
 *
 * @module air-supply/src/parsers/default
 *
 * @example
 * import parsers from 'air-supply/src/parsers/default';
 */

// Get parsers
const jsonParser = require('./json');
const csvParser = require('./csv');
const yamlParser = require('./yaml');
const archiemlParser = require('./archieml');
const zipParser = require('./zip');
const xlsxParser = require('./xlsx');
const shapefileParser = require('./shapefile');
const kmlParser = require('./kml');
const gpxParser = require('./gpx');
const topojsonParser = require('./topojson');
const reprojectParser = require('./reproject');

/**
 * @ignore
 * Parsers are simple functions that transform input used for parsing data
 * in packages from source data.
 *
 * @typedef {Function} parser
 * @param input Data to parse.
 * @param {Array|Object} options Options to pass to the parser function,
 *   if an array, it will pass as arguments.
 * @return Parsed data
 */

/**
 * @ignore
 * Parser config is an object describing how to match and parse
 * specific types of data.
 *
 * @typedef {Object} parserConfig
 * @property {RegExp} match Regular expression to test against a source.
 * @property {parser} parser Parser function.
 */

/**
 * @ignore
 * An index of parser configs, keyed by type for overridding.
 *
 * @typedef {Object.<String, parserConfig>} parserConfigs
 *
 * @example
 * {
 *   json: {
 *     match: /.json$/i,
 *     parser: JSON.parse
 *   }
 * }
 */

// Export default
module.exports = {
  json: {
    match: /json5?$/i,
    parser: jsonParser
  },
  csv: {
    match: /csv$/i,
    parser: csvParser
  },
  yaml: {
    match: /(yml|yaml)$/i,
    parser: yamlParser
  },
  archieml: {
    match: /aml$/i,
    parser: archiemlParser
  },
  zip: {
    match: /zip$/i,
    parser: zipParser
  },
  // Shapefiles are essentially zip
  shapefile: {
    match: /(shp.*zip|shp)$/i,
    parser: shapefileParser
  },
  xlsx: {
    match: /(xlsx|xls|dbf|ods)$/i,
    parser: xlsxParser
  },
  kml: {
    match: /kml$/i,
    parser: kmlParser
  },
  gpx: {
    match: /gpx$/i,
    parser: gpxParser
  },
  topojson: {
    match: /geo.?json$/i,
    parser: topojsonParser
  },
  reproject: {
    // This is not really a parse, and doesn't really have
    // a file type match
    match: /no-match----$/i,
    parser: reprojectParser
  }
};
