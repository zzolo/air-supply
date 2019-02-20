/**
 * @ignore
 * YAML parser, just use js-yaml safeLoad.
 */

const isString = require('lodash/isString');
const { safeLoad } = require('js-yaml');

/**
 * YAML parser.  Uses [js-yaml](https://www.npmjs.com/package/js-yaml) module.
 *
 * @name yaml
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Function} [options] Options, see [safeLoad](https://www.npmjs.com/package/js-yaml#safeload-string---options-) method for details.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, ...args) => {
  input = isString(input) ? input : input.toString('utf-8');
  return safeLoad(input, ...args);
};