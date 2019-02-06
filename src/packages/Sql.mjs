/**
 * @ignore
 * SQL package class module.  Gets data from an SQL database.
 *
 * @module air-supply/src/packages/Sql
 *
 * @example
 * import Sql from 'air-supply/src/packages/Sql';
 * let f = new Sql({
 *   source: 'mysql://user:name@host/database',
 *   query: 'SELECT * FROM table'
 * });
 * let data = f.cachedFetch();
 */

// Dependencies
import BasePackage from './BasePackage';
import * as sequelizeWrapper from 'sequelize';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:sql');

// Deal with import defaults
const Sequelize = sequelizeWrapper.default || sequelizeWrapper;

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
 *   `npm install --save pg pg-hstore`
 *   `npm install --save mysql2`
 *   `npm install --save sqlite3`
 *   `npm install --save tedious`
 *
 * @export
 * @class Sql
 * @extends BasePackage
 *
 * @param {Object!} options Options object to define options for this
 *   specific package adn override any defaults.  See the global AirSupply
 *   options
 * @param {String!} options.source The URI to the file to read data from.
 * @param {Boolean} [options.parser=false] Turn parsing off.
 * @param {Object!} options.fetchOptions `sequelize` connection options.
 *
 * @param {Object<AirSupply>?} airSupply The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Sql>} The new Sql object.
 */
export default class Sql extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      // Don't need parser
      parser: false
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
