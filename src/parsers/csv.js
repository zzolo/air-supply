/**
 * @ignore
 * CSV parser, use [csv-parse](https://csv.js.org/parse/),
 * as it has many options.
 */

const isString = require('lodash/isString');
const merge = require('lodash/merge');
const parse = require('csv-parse/lib/sync');

/**
 * CSV (or any delimiter) parser.  Uses [csv-parse](https://www.npmjs.com/package/csv-parse) module,
 * specifically the `sync` method.
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
