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
import jsonParser from './json';
import csvParser from './csv';
import yamlParser from './yaml';
import archiemlParser from './archieml';
import zipParser from './zip';

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
export default {
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
  }
};
