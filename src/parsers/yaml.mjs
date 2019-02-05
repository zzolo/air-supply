/**
 * @ignore
 * YAML parser, just use js-yaml safeLoad.
 */

import yaml from 'js-yaml';

/**
 * YAML parser.  Uses [js-yaml](https://www.npmjs.com/package/js-yaml) module.
 *
 * @name yaml
 * @export
 *
 * @param {String!} input Data to parse.
 * @param {Function} [options] Options, see [safeLoad](https://www.npmjs.com/package/js-yaml#safeload-string---options-) method for details.
 *
 * @return {Object} Parsed data.
 */
export default yaml.safeLoad;
