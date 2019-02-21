/**
 * @ignore
 * YAML parser, just use js-yaml safeLoad.
 */

const isString = require('lodash/isString');

/**
 * YAML parser.  Uses [js-yaml](https://www.npmjs.com/package/js-yaml) module.
 * YAML module is not installed by default, if you need this parser,
 * install separately:
 *
 * ```sh
 * npm install js-yaml
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install YAML globally:
 *
 * ```sh
 * npm install -g js-yaml
 * ```
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
  const { safeLoad } = require('js-yaml');
  input = isString(input) ? input : input.toString('utf-8');
  return safeLoad(input, ...args);
};
