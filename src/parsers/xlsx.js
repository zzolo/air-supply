/**
 * @ignore
 * XLSX (and other) parser, uses [xlsx](https://github.com/sheetjs/js-xlsx),
 * which supports multiple formats.
 */

/**
 * XLSX (MS Excel) (and other format) parser.  Uses [xlsx](https://github.com/sheetjs/js-xlsx) module.
 *
 * Supports other formats:
 * https://docs.sheetjs.com/#file-formats
 *
 * Reading options reference:
 * https://docs.sheetjs.com/#parsing-options
 *
 * XLSX module is not installed
 * by default, if you need this parser, install separately:
 *
 * ```sh
 * npm install xlsx
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install XLSX globally:
 *
 * ```sh
 * npm install -g xlsx
 * ```
 *
 * @name xlsx
 * @export
 *
 * @param {Buffer} input Data to parse.
 * @param {Object} [options] Options, see [parsing options](https://docs.sheetjs.com/#parsing-options) for details, though
 *   some options are defaulted differently here.
 * @param {Boolean} [options.sheet] Custom option to get a specific
 * @param {Boolean} [options.jsonOptions] Options to pass to the
 *   [xlsx json parsing](https://docs.sheetjs.com/#json).
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, options = {}) => {
  const xlsx = require('xlsx');

  // Connect to worksheet
  const workSheet = xlsx.read(input, options);

  // Specific sheet
  if (options.sheet && workSheet.Sheets[options.sheet]) {
    return xlsx.utils.sheet_to_json(
      workSheet.Sheets[options.sheet],
      options.jsonOptions
    );
  }
  else if (options.sheet && !workSheet.Sheets[options.sheet]) {
    throw new Error(
      `Trying to get a specific worksheet, but unable to find worksheet: "${
        options.sheet
      }"`
    );
  }

  // Go through each worksheet
  let data = {};
  Object.keys(workSheet.Sheets).map(s => {
    data[s] = xlsx.utils.sheet_to_json(
      workSheet.Sheets[s],
      options.jsonOptions
    );
  });

  return data;
};
