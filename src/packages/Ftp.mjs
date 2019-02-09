/**
 * @ignore
 * FTP package class module.  Gets data from an ftp source.
 *
 * @module air-supply/src/packages/Ftp
 */

// Dependencies
import { parse as parseUrl } from 'url';
import merge from 'lodash/merge';
import BasePackage from './BasePackage';
import * as ftpWrapper from 'ftp';
//import * as debugWrapper from 'debug';

// Debug
//const debug = (debugWrapper.default || debugWrapper)('airsupply:ftp');

// Deal with import defaults
const FtpClient = ftpWrapper.default || ftpWrapper;

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
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<Ftp>} The new Ftp object.
 */
export default class Ftp extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {});
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
      const client = new FtpClient();

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
