/**
 * @ignore
 * Google Sheet package class module.
 *
 * @module air-supply/src/packages/GoogleSheet
 */

// Dependencies
const find = require('lodash/find');
const isString = require('lodash/isString');
const isEmpty = require('lodash/isEmpty');
const merge = require('lodash/merge');
const BasePackage = require('./BasePackage');
const googleAuthenticate = require('../auth/google');

// Debug
const debug = require('debug')('airsupply:google-sheet');

/**
 * GoogleSheet package type.  Gets data from a Google Sheet source via
 * [googleapis](https://www.npmjs.com/package/googleapis) module.
 *
 * If you want to get the published CSV version, use the <Http> package
 * along with the <csv> parser.
 *
 * Note that the `googleapis` module is not installed by default, if you need
 * this package, install separately:
 *
 * ```sh
 * npm install googleapis
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install `googleapis` globally:
 *
 * ```sh
 * npm install -g googleapis
 * ```
 *
 * @export
 * @class GoogleSheet
 * @extends BasePackage
 *
 * @example
 * // Ensure googleapis module is installed: `npm install googleapis`
 * const GoogleSheet = require('air-supply/src/packages/GoogleSheet';
 * let f = new GoogleSheet({ source: 'GOOGLE-SHEET-ID' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The Google Doc ID (can be found in the URL).
 * @param {Object} [options.fetchOptions] Options for getting sheet data.
 * @param {Boolean} [options.fetchOptions.headers=true] Assumes
 *   first row is headers and converts data to object instead of array.
 * @param {Boolean} [options.fetchOptions.filterEmpty=true] Filters
 *   any rows that are all empty (null or undefined).
 * @param {String|Boolean} [options.fetchOptions.sheet=false] The ID of the
 *   specific sheet in the Google Sheet.  False to use the first/default.
 * @param {String} [options.fetchOptions.fieldType='userEnteredValue']
 *   The type of value to get from each field; can be `userEnteredValue`,
 *   `effectiveValue`, or `formattedValue`
 * @param {Object} [options.authOptions] Options to pass to the Google authentication
 *   function.
 * @param {String|Boolean} [options.parsers=false] Defaults to not use
 *   a parser.
 * @param {Object|Function} [options.googleapis=require('googleapis')] The
 *   [googleapis](https://www.npmjs.com/package/googleapis) module is not
 *   installed by default.  You can either install it normally,
 *   i.e. `npm install googleapis`, or you can provide the module with
 *   this option if you need some sort of customization.
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<GoogleSheet>} The new GoogleSheet object.
 */
class GoogleSheet extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      parsers: false,
      fetchOptions: {
        headers: true,
        sheet: false,
        filterEmpty: true
      }
    });

    // Attach dependencies
    try {
      this.googleapis = this.options.googleapis || require('googleapis');
    }
    catch (e) {
      debug(e);
      throw new Error(
        'The Air Supply GoogleSheet package was not provided an "options.googleapis" dependency, or could not find the "googleapis" module itself.  Trying installing the "googleapis" module: `npm install googleapis`'
      );
    }
  }

  /**
   * Fetch implementation.  Uses [googleapis](https://www.npmjs.com/package/googleapis) module
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let options = this.option('fetchOptions') || {};
    let authOptions = merge({}, this.option('authOptions') || {}, {
      googleapis: this.googleapis
    });

    // Get basic grid
    let grid = await this.getRawGrid(
      source,
      options.sheet,
      options.fieldType,
      authOptions
    );

    // Filter empty
    if (options.filterEmpty) {
      grid = grid.filter(g => {
        return find(g, c => !isEmpty(c));
      });
    }

    // If headers
    if (options.headers) {
      let headers = grid.shift();
      return grid.map(d => {
        let row = {};

        // Use headers for keys
        d.forEach((c, ci) => {
          row[headers[ci]] = isString(c) ? c.trim() : c;
        });

        return row;
      });
    }

    return grid;
  }

  /**
   * Get the basic grid content from the sheet.
   * Reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#SheetProperties
   *
   * @async
   *
   * @param {String} source The Google Sheet ID.
   * @param {String|Boolean} [sheet=false] The sheet ID, false for the default.
   * @param {String} [fieldType='userEnteredValue'] The type of value to
   *   get from each field; can be `userEnteredValue`, `effectiveValue`,
   *   or `formattedValue`.
   *
   * @return {Object} Sheet content.
   */
  async getRawGrid(
    source,
    sheet = false,
    fieldType = 'userEnteredValue',
    authOptions = {}
  ) {
    if (!source) {
      throw new Error('Spreadsheet/file id not provided to getRawGrid method');
    }

    // Authenticate
    let auth = await googleAuthenticate(authOptions);

    // Get data
    let sheets = this.googleapis.google.sheets('v4');
    let response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId: source,
      includeGridData: true
    });

    // Get specific sheet
    let s = response.data.sheets[0];
    if (sheet) {
      s = find(response.sheets, sheet => {
        return sheet.properties.sheetId === sheet;
      });
    }

    // Check for sheet
    if (!s) {
      throw new Error(`Unable to locate sheet from ID: ${sheet}`);
    }

    // Get data into simple format
    let data = [];
    if (s.data && s.data[0] && s.data[0].rowData) {
      s.data[0].rowData.forEach(r => {
        let row = [];
        r.values.forEach(c => {
          row.push(
            fieldType === 'formattedValue'
              ? c[fieldType]
              : c[fieldType]
                ? c[fieldType].stringValue ||
                c[fieldType].numberValue ||
                c[fieldType].boolValue ||
                c[fieldType].formulaValue
                : null
          );
        });

        data.push(row);
      });
    }

    // TODO: Remove any empty rows

    return data;
  }
}

// Export
module.exports = GoogleSheet;
