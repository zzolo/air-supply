/**
 * @ignore
 * CSV parser, use [csv-parse](https://csv.js.org/parse/),
 * as it has many options.
 */

const isString = require('lodash/isString');
const merge = require('lodash/merge');

/**
 * CSV (or any delimiter) parser.  Uses
 * [csv-parse](https://www.npmjs.com/package/csv-parse) module,
 * specifically the `sync` method.  CSV Parse module is not
 * installed by default, if you need this parser, install separately:
 *
 * ```sh
 * npm install csv-parse
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install CSV Parse globally:
 *
 * ```sh
 * npm install -g csv-parse
 * ```
 *
 * @name csv
 * @export
 *
 * @param {String|Buffer} input Data to parse.
 * @param {Object} [options] Options, see [csv-parse](https://csv.js.org/parse/options/) for details, though
 *   some options are defaulted differently here.
 * @param {Boolean} [options.cast=true] Defaults to true.
 * @param {Boolean} [options.columns=true] Defaults to true.
 * @param {Boolean} [options.trim=true] Defaults to true.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, options = {}) => {
  // Load parser here so that it can be on-demand
  const parse = require('csv-parse/lib/sync');

  // Handle input
  input = isString(input) ? input : input.toString('utf-8');

  // Default options
  options = merge(
    {},
    {
      cast: true,
      columns: true,
      trim: true
    },
    options
  );

  return parse(input, options);
};
