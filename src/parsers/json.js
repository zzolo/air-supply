/**
 * @ignore
 * JSON parser, just use json5.
 */

const isString = require('lodash/isString');
const { parse } = require('json5');

/**
 * JSON parser.  Uses [json5](https://www.npmjs.com/package/json5) module.
 *
 * @name json
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Function} [options] Options, see [parse](https://www.npmjs.com/package/json5#json5parse) method for details.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, ...args) => {
  input = isString(input) ? input : input.toString('utf-8');
  return parse(input, ...args);
};
