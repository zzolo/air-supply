/**
 * @ignore
 * FTP package class module.  Gets data from an ftp source.
 *
 * @module air-supply/src/packages/Ftp
 */

// Dependencies
const { parse: parseUrl } = require('url');
const merge = require('lodash/merge');
const BasePackage = require('./BasePackage');

// Debug
const debug = require('debug')('airsupply:ftp');

/**
 * Ftp package type.  Gets data from an "ftp://" source via [ftp](https://www.npmjs.com/package/ftp) module.
 *
 * @export
 * @class Ftp
 * @extends BasePackage
 *
 * @example
 * import Ftp from 'air-supply/src/packages/Ftp';
 * let f = new Ftp({ source: 'ftp://example.com/data.json' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source The URI to the file to read data from.
 *   Something like
 *   `ftp://username:pass@ftp.example.com/path/to/file.json`
 * @param {Object} [options.fetchOptions] `ftp` connection options,
 *   overriding anything determined from the `source`.
 * @param {String} [options.fetchOptions.type='string'] Custom option to
 *   handle what kind of response we want from the fetch, can be either
 *   `buffer` or `string`; defaults to `string`.
 * @param {String} [options.fetchOptions.path] Custom option for the
 *   path to get from the FTP server, if not used in the `source` URI.
 * @param {Object|Function} [options.Ftp=require('ftp')] The
 *   [ftp](https://www.npmjs.com/package/ftp) module is not
 *   installed by default.  You can either install it normally,
 *   i.e. `npm install ftp`, or you can provided the module with
 *   this option if you need some sort of customization.
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Ftp>} The new Ftp object.
 */
class Ftp extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {});

    // Attach dependency
    try {
      this.Ftp = this.options.Ftp || require('ftp');
    }
    catch (e) {
      debug(e);
      throw new Error(
        'The Air Supply Airtable package was not provided an "options.Airtable" dependency, or could not find the "airtable" module itself.  Trying installing the "airtable" module: `npm install airtable`'
      );
    }
  }

  /**
   * Fetch implementation.  Utilizes the [ftp](https://www.npmjs.com/package/ftp) module
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let options = this.option('fetchOptions') || {};

    // Determine options from source
    let urlParts = parseUrl(source);
    let parsedOptions = {
      host: urlParts.host,
      port: urlParts.port || 21,
      user: urlParts.auth ? urlParts.auth.split(':')[0] : undefined,
      password: urlParts.auth ? urlParts.auth.split(':')[1] : undefined
    };
    let getPath = urlParts.path;

    // Put together options
    options = merge(
      {},
      options,
      parsedOptions,
      { path: getPath },
      {
        connTimeout: 20000,
        pasvTimeout: 20000,
        keepalive: 5000
      }
    );

    // Wrap in Promise
    return new Promise((resolve, reject) => {
      const client = new this.Ftp();

      // When connected
      client.on('ready', () => {
        // Get file
        client.get(options.path, (error, stream) => {
          if (error) {
            return reject(error);
          }

          // Turn into buffer
          let data = [];
          stream.on('data', d => data.push(d));
          stream.on('error', reject);
          stream.once('close', function() {
            let b = Buffer.concat(data);
            client.end();
            resolve(options.type === 'buffer' ? b : b.toString());
          });
        });
      });

      // Connect
      client.connect(options);

      // On error
      client.on('error', reject);
    });
  }
}

// Export
module.exports = Ftp;
