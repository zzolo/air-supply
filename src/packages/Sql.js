/**
 * @ignore
 * SQL package class module.  Gets data from an SQL database.
 *
 * @module air-supply/src/packages/Sql
 */

// Dependencies
const BasePackage = require('./BasePackage');
const Sequelize = require('sequelize');

// Debug
const debug = require('debug')('airsupply:sql');

/**
 * SQL package type.  Gets data from an SQL database source via [sequelize](http://docs.sequelizejs.com/).
 *
 * Use an URI method to connect to a database.
 *   - `protocol://user:name@host:port/database`
 *   - `sqlite://./my-new-db.sql`
 *   - `mysql://username:password@localhost/my-database`
 *   - `postgres://username:@localhost:1234/my-database`
 *
 * Requires installing the database specific module.
 *   - `npm install --save pg pg-hstore`
 *   - `npm install --save mysql2`
 *   - `npm install --save sqlite3`
 *   - `npm install --save tedious`
 *
 * @export
 * @class Sql
 * @extends BasePackage
 *
 * @example
 * import Sql from 'air-supply/src/packages/Sql';
 * let f = new Sql({
 *   source: 'mysql://user:name@host/database',
 *   query: 'SELECT * FROM table'
 * });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The URI to the the database.
 * @param {Boolean} [options.parsers=false] Turn parsing off by default.
 * @param {Object} [options.fetchOptions] `sequelize` connection options.
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Sql>} The new Sql object.
 */
class Sql extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Don't need parser
      parsers: false
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

    // Create connection
    let connection = new Sequelize(source, options);

    // Check authentication
    try {
      await connection.authenticate();
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Unable to connect to database for "${
          this.options.key
        }" package.  Use DEBUG for more information.`
      );
    }

    // Make sure we have a query
    if (!this.options.query) {
      throw new Error('The "query" option is needed for an Sql package.');
    }

    try {
      return await connection.query(this.options.query, {
        type: connection.QueryTypes.SELECT
      });
    }
    catch (e) {
      debug(e);
      throw new Error(
        `There was an error running the query: "${
          this.options.query
        }".  Use DEBUG for more information.`
      );
    }
  }
}

// Export
module.exports = Sql;
