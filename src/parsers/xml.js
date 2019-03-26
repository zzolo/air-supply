/**
 * @ignore
 * XML parser, use [xml2js](https://www.npmjs.com/package/xml2js),
 * as it has many options.
 */

const isString = require('lodash/isString');
const merge = require('lodash/merge');

/**
 * XML parser.  Uses
 * [xml2js](https://www.npmjs.com/package/xml2js) module.
 * The xml2js module is not
 * installed by default, if you need this parser, install separately:
 *
 * ```sh
 * npm install xml2js
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install xml2js globally:
 *
 * ```sh
 * npm install -g xml2js
 * ```
 *
 * @name xml
 * @async
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Object} [options] Options, see [xml2js](https://www.npmjs.com/package/xml2js) for details, though
 *   some options are defaulted differently here.
 * @param {Boolean} [options.normalizeTags=true] Defaults to true.
 * @param {Boolean} [options.normalize=true] Defaults to true.
 *
 * @return {Object} Parsed data.
 */
module.exports = async (input, options = {}) => {
  // Load parser here so that it can be on-demand
  const { parseString } = require('xml2js');

  // Handle input
  input = isString(input) ? input : input.toString('utf-8');

  // Default options
  options = merge(
    {},
    {
      normalizeTags: true,
      normalize: true
    },
    options
  );

  return new Promise((resolve, reject) => {
    parseString(input, options, (error, parsed) => {
      if (error) {
        return reject(error);
      }

      resolve(parsed);
    });
  });
};
