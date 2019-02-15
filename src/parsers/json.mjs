/**
 * @ignore
 * JSON parser, just use json5.
 */

import isString from 'lodash/isString';
import json from 'json5';

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
export default (input, ...args) => {
  input = isString(input) ? input : input.toString('utf-8');
  return json.parse(input, ...args);
};
