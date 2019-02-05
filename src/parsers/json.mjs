/**
 * @ignore
 * JSON parser, just use json5.
 */

import json from 'json5';

/**
 * JSON parser.  Uses [json5](https://www.npmjs.com/package/json5) module.
 *
 * @name json
 * @export
 *
 * @param {String!} input Data to parse.
 * @param {Function} [options] Options, see [parse](https://www.npmjs.com/package/json5#json5parse) method for details.
 *
 * @return {Object} Parsed data.
 */
export default json.parse;
