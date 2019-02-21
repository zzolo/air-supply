/**
 * @ignore
 * ArchieML parser, just use archieml.
 */

// Depenencies
const isString = require('lodash/isString');

/**
 * ArchieML parser.  Uses [archieml](https://www.npmjs.com/package/archieml)
 * module.  ArchieML module is not installed by default, if you need
 * this parser, install separately:
 *
 * ```sh
 * npm install archieml
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install ArchieML globally:
 *
 * ```sh
 * npm install -g archieml
 * ```
 *
 * @name archieml
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Object} [options] Options, see [archieml](https://www.npmjs.com/package/archieml) module for details.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, ...args) => {
  // Load parser here so that it can be on-demand
  const archieml = require('archieml');
  input = isString(input) ? input : input.toString('utf-8');
  return archieml.load(input, ...args);
};
