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
const BasePackage = require('./BasePackage');
const googleAuthenticate = require('../auth/google');
const { google } = require('googleapis');

// Debug
//const debug = require('debug')('airsupply:google-doc'));

/**
 * GoogleSheet package type.  Gets data = require(a Google Sheet source via
 * [googleapis](https://www.npmjs.com/package/googleapis) module.
 *
 * If you want to get the published CSV version, use the HTTP package
 * with the CSV parser.
 *
 * @export
 * @class GoogleSheet
 * @extends BasePackage
 *
 * @example
 * const GoogleSheet = require('air-supply/src/packages/GoogleSheet';
 * let f = new GoogleSheet({ source: 'GOOGLE-SHEET-ID' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults = require(the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The Google Doc ID (can be found in the URL).
 * @param {Object} [options.fetchOptions] Options for getting sheet data.
 * @param {Boolean} [options.fetchOptions.headers=true] Assumes
 *   first row is headers and converts data to object instead of array.
 * @param {Boolean} [options.fetchOptions.filterEmpty=true] Filters
 *   any rows that are all empty (null or undefined).
 * @param {String|Boolean} [options.fetchOptions.sheet=false] The ID of the
 *   specific sheet in the Google Sheet.  False to use the first/default.
 * @param {String} [options.fetchOptions.fieldType='userEnteredValue']
 *   The type of value to get = require(each field); can be `userEnteredValue`,
 *   `effectiveValue`, or `formattedValue`
 * @param {Object} [options.authOptions] Options to pass to the Google authentication
 *   function.
 * @param {String|Boolean} [options.parsers=false] Defaults to not use
 *   a parser.
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
    let authOptions = this.option('authOptions') || {};

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
   * Get the basic grid content = require(the sheet.
   * Reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#SheetProperties
   *
   * @async
   *
   * @param {String} source The Google Sheet ID.
   * @param {String|Boolean} [sheet=false] The sheet ID, false for the default.
   * @param {String} [fieldType='userEnteredValue'] The type of value to
   *   get = require(each field); can be `userEnteredValue`, `effectiveValue`,
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
    let sheets = google.sheets('v4');
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
      throw new Error(`Unable to locate sheet = require(ID: ${sheet}`);
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

    // Remove any empty rows

    return data;
  }
}

// Export
module.exports = GoogleSheet;
