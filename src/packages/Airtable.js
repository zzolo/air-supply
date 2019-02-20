/**
 * @ignore
 * Airtable package class module.  Gets data from Airtable.
 *
 * @module air-supply/src/packages/Airtable
 */

// Dependencies
const isEmpty = require('lodash/isEmpty');
const filter = require('lodash/filter');
const omit = require('lodash/omit');
const BasePackage = require('./BasePackage');
const AirtableApi = require('airtable');

// Debug
const debug = require('debug')('airsupply:file');

/**
 * Airtable package type.  Gets data from Airtable.
 *
 * @export
 * @class Airtable
 * @extends BasePackage
 *
 * @example
 * import Airtable from 'air-supply/src/packages/Airtable';
 * let f = new Airtable({
 *   source: 'BASE-ID-XXXX',
 *   table: 'table-XXXX'
 * });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The Airtable Base ID.
 * @param {String!} options.table The table ID in the Airtable Base.
 * @param {String} [options.airtableKey=process.env.AIRTABLE_API_KEY] The
 *   Airtable API key found at [airtable.com/api](https://airtable.com/api).
 *   Uses the environment variable AIRTABLE_API_KEY by default.
 * @param {Boolean} [options.parser=false] Turns parsing off by default.
 * @param {Object} [options.fetchOptions] Options that are passed to the
 *   `list` method of the Airtable NodeJS method.  Airtable does not
 *   make this linkable, but includes options such as:
 *   `fields`, `filterByFormula`, `maxRecords`, `pageSize`, `view`,
 *   `sort` (ex. `[{field: "ID", direction: "desc"}]`), `cellFormat`
 *   (ex. `json` or `string`)
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Airtable>} The new Airtable object.
 */
class Airtable extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      parsers: false
    });
  }

  /**
   * Fetch implementation.  Utilizes the [Airtable NodeJS library](https://www.npmjs.com/package/airtable)
   * to read data from Airtable.
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    // Get the source.  Source can be a function, so, use the
    // this.option method.
    let baseId = this.option('source');
    let tableId = this.option('table');

    // Check for source and table
    if (!baseId) {
      throw new Error(
        `Airtable package, "${
          this.options.key
        }", requires a "source" option which is the Airtable Base ID.`
      );
    }
    if (!tableId) {
      throw new Error(
        `Airtable package, "${
          this.options.key
        }", requires a "table" option which is the table name in the Airtable Base.`
      );
    }

    // Get key
    let key = this.options.airtableKey || process.env.AIRTABLE_API_KEY;
    if (!key) {
      throw new Error(
        `Airtable package, "${
          this.options.key
        }", requires an API key provided as the "airtableKey" option or the AIRTABLE_API_KEY environment variable.`
      );
    }

    // Create Airtable connector
    this.airtable = new AirtableApi({
      apiKey: process.env.AIRTABLE_API_KEY
    });

    // Connect to the base
    let base = this.airtable.base(baseId);

    // Recursively go through the table
    return new Promise((resolve, reject) => {
      let all = [];

      base(tableId)
        .select(this.options.fetchOptions)
        .eachPage(
          (records, next) => {
            all = all.concat(
              records.map(r => {
                // Attach Airtable row ID to fields
                r.fields = r.fields || {};
                r.fields.airtableId = r.id;
                return r.fields;
              })
            );
            next();
          },
          error => {
            if (error) {
              debug(error);
              return reject(error);
            }

            // Filter empty rows
            all = filter(all, a => {
              return a && !isEmpty(omit(a, ['airtableId']));
            });

            resolve(all);
          }
        );
    });
  }
}

// Export
module.exports = Airtable;