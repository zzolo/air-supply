/**
 * @ignore
 * ArchieML parser, just use archieml.
 */

const isString = require('lodash/isString');
const archieml = require('archieml');

/**
 * ArchieML parser.  Uses [archieml](https://www.npmjs.com/package/archieml) module.
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
  input = isString(input) ? input : input.toString('utf-8');
  return archieml.load(input, ...args);
};
