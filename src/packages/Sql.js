/**
 * @ignore
 * SQL package class module.  Gets data from an SQL database.
 *
 * @module air-supply/src/packages/Sql
 */

// Dependencies
const BasePackage = require('./BasePackage');

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
 * The `sequelize` module is not installed by default, if you need
 * this package, install separately:
 *
 * ```sh
 * npm install sequelize
 * ```
 *
 * You will also need a module to connect to your database, which will
 * depend on what kind of database it is.  You will need one of the
 * following:
 *   - `npm install pg pg-hstore`
 *   - `npm install mysql2`
 *   - `npm install sqlite3`
 *   - `npm install tedious` (MSSQL)
 *
 * @export
 * @class Sql
 * @extends BasePackage
 *
 * @example
 * // Ensure that the "sequelize" module is installed: npm install sequelize
 * // and at your appropriate database module, for instance: npm install mysql2
 * import Sql from 'air-supply/src/packages/Sql';
 * let f = new Sql({
 *   source: 'mysql://user:name@host/database',
 *   query: 'SELECT * FROM table'
 * });
 * let data = f.cachedFetch();
 *
 * @param {Object} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String} options.source The URI to the the database.
 * @param {String} options.query The SQL select query to run, such
 *   as: "SELECT * FROM table".
 * @param {Boolean} [options.parsers=false] Turn parsing off by default.
 * @param {Object} [options.fetchOptions] `sequelize` connection options.
 * @param {Object|Function} [options.Sequelize=require('sequelize')] The
 *   [sequelize](https://www.npmjs.com/package/sequelize) module is not
 *   installed by default.  You can either install it normally,
 *   i.e. `npm install sequelize`, or you can provide the module with
 *   this option if you need some sort of customization.
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

    // Attach dependencies
    try {
      this.Sequelize = this.options.Sequelize || require('sequelize');
    }
    catch (e) {
      debug(e);
      throw new Error(
        'The Air Supply Sql package was not provided an "options.Sequelize" dependency, or could not find the "sequelize" module itself.  Trying installing the "sequelize" module: `npm install sequelize`'
      );
    }
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
    let connection = new this.Sequelize(source, options);

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
