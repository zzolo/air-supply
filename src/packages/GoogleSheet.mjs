/**
 * @ignore
 * Google Sheet package class module.
 *
 * @module air-supply/src/packages/GoogleSheet
 *
 * @example
 * import GoogleSheet from 'air-supply/src/packages/GoogleSheet';
 * let f = new GoogleSheet({ source: 'GOOGLE-SHEET-ID' });
 * let data = f.cachedFetch();
 */

// Dependencies
import find from 'lodash/find';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import BasePackage from './BasePackage';
import googleAuthenticate from '../auth/google';
import * as debugWrapper from 'debug';
import * as googleapisWrapper from 'googleapis';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:google-doc');

// Deal with import defaults
const { google } = googleapisWrapper.default || googleapisWrapper;

/**
 * GoogleSheet package type.  Gets data from a Google Sheet source via
 * [googleapis](https://www.npmjs.com/package/googleapis) module.
 *
 * If you want to get the published CSV version, use the HTTP package
 * with the CSV parser.
 *
 * @export
 * @class GoogleSheet
 * @extends BasePackage
 *
 * @param {Object} options Options object to define options for this
 *   specific package and override any defaults.  See the global AirSupply
 *   options
 * @param {String} options.source The Google Doc ID (can be found in the URL).
 * @param {Object} [options.fetchOptions] Options for getting sheet data.
 * @param {Boolean} [options.fetchOptions.headers=true] Assumes
 *   first row is headers and converts data to object instead of array.
 * @param {Boolean} [options.fetchOptions.filterEmpty=true] Filters
 *   any rows that are all empty (null or undefined).
 * @param {String|Boolean} [options.fetchOptions.sheet=false] The ID of the
 *   specific sheet in the Google Sheet.
 * @param {String} [options.fetchOptions.fieldType='userEnteredValue']
 *   The type of value to get from each field; can be `userEnteredValue`,
 *   `effectiveValue`, or `formattedValue`
 * @param {String|Boolean} [options.parser=false] Defaults to use
 *   not use a parser.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<GoogleSheet>} The new GoogleSheet object.
 */
export default class GoogleSheet extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      parser: false,
      fetchOptions: {
        headers: true,
        sheet: false,
        filterEmpty: true
      }
    });
  }

  /**
   * Fetch implementation.
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let options = this.option('fetchOptions') || {};

    // Get basic grid
    let grid = await this.getRawGrid(source, options.sheet, options.fieldType);

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
  async getRawGrid(source, sheet = false, fieldType = 'userEnteredValue') {
    if (!source) {
      throw new Error('Spreadsheet/file id not provided to getRawGrid method');
    }

    // Authenticate
    let auth = await googleAuthenticate();

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

    // Remove any empty rows

    return data;
  }
}
