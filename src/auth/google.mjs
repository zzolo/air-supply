/**
 * @ignore
 * Method to authenticate to Google's APIs via the command line.
 *
 * Code and inspiration taken from:
 * https://github.com/nprapps/google-login
 *
 * @module air-supply/src/auth/google
 *
 * @example
 * import googleAuth from 'air-supply/src/auth/google';
 * let auth = await googleAuth();
 */

// Depenendencies
import merge from 'lodash/merge';
import path from 'path';
import os from 'os';
import fsWrapper from 'fs-extra';
import find from 'lodash/find';
import { fork } from 'child_process';
import * as googleapisWrapper from 'googleapis';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:auth:google');

// Deal with import defaults
const fs = fsWrapper.default || fsWrapper;
const { google } = googleapisWrapper.default || googleapisWrapper;

/**
 * Authenticate to Google's API via OAuth on the command line.  Will
 * write token to `~/.air-supply/google-auth.json` by default, and supply
 * token.
 *
 * @export
 *
 * @param {Object} [options] Options to pass.
 * @param {String} [options.clientId=process.env.GOOGLE_OAUTH_CLIENT_ID] The
 *   Google auth client ID; defaults to the environment variable:
 *   `GOOGLE_OAUTH_CLIENT_ID`.
 * @param {String} [options.consumerSecret=process.env.GOOGLE_OAUTH_CONSUMER_SECRET] The
 *   Google auth consumer secret; defaults to the environment variable:
 *   `GOOGLE_OAUTH_CLIENT_ID`.
 * @param {Array} [options.scope=['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets']]
 *   The scope of the autentication.
 * @param {Number} [options.localPort=48080] Port for local server.
 * @param {String} [options.tokenLocation=~/.air-supply/google-auth.json] Where
 *   to save the authentication token.
 * @param {Boolean} [options.forceReAuth=false] Force authentication even
 *   if tokens are available.
 * @param {Number} [options.timeout=300000] Timeout (currently doen't work)
 * @param {String} [options.authenticatedMessage='..[[[LOCATION]]]..'] The message
 *   to send to the browser when successfully authenticated.
 * @param {Number} [options.openWait=1] Milliseconds to wait to open authentication
 *   browser page.
 *
 * @return {Object} Authentication object from `googleapis` module.
 */
export default async function googleAuthenticate(options = {}) {
  // Default options
  options = merge({}, options, {
    forceReAuth: false,
    tokenLocation: path.join(os.homedir(), '.air-supply', 'google-auth.json'),
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    consumerSecret: process.env.GOOGLE_OAUTH_CONSUMER_SECRET,
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
    localPort: 48080,
    timeout: 1000 * 60 * 2,
    authenticatedMessage:
      'Authenticated, saving token locally to: "[[[LOCATION]]]".  It is ok to close this window now.'
  });

  // Local URL.  Note that it is important to leave off the trailing slash
  let localUrl = `http://localhost:${options.localPort}/authenticate`;
  debug(
    `For the Google Console credentials Oauth Client, "Authorized redirect URIs" should contain: "${localUrl}"`
  );

  // Make sure we have client id
  if (!options.clientId) {
    throw new Error(
      'Google auth requires a "clientId" option; by default this is the GOOGLE_OAUTH_CLIENT_ID environment variable.'
    );
  }

  // Make sure we have the consumer secret
  if (!options.consumerSecret) {
    throw new Error(
      'Google auth requires a "consumerSecret" option; by default this is the GOOGLE_OAUTH_CONSUMER_SECRET environment variable.'
    );
  }

  // Create auth object
  let auth = new google.auth.OAuth2(
    options.clientId,
    options.consumerSecret,
    localUrl
  );

  // Token
  let token;

  // Update if they get changed
  auth.on('tokens', update => {
    token = token ? merge({}, update, token) : update;
    fs.writeFileSync(options.tokenLocation, JSON.stringify(token));
  });

  // Attempt to get existing token
  if (!options.forceReAuth && fs.existsSync(options.tokenLocation)) {
    let token = JSON.parse(fs.readFileSync(options.tokenLocation, 'utf-8'));
    auth.setCredentials(token);

    // Check auth
    if (await googleCheckAuthentication(auth, options)) {
      return auth;
    }
  }

  // Make sure the token location exists
  try {
    fs.mkdirpSync(path.dirname(options.tokenLocation));
  }
  catch (e) {
    debug(e);
    throw new Error(
      `When trying to authenticate with Google, unable to create the directory for the token at: "${
        options.tokenLocation
      }"`
    );
  }

  // Async
  return new Promise((resolve, reject) => {
    // Using sub process so that we can very-forcefully kill it when needed
    let f = fork('./google.subprocess.js');
    f.send(options);
    f.on('message', m => {
      if (m && m.error) {
        reject(m.error);
      }
      else if (m && m.tokens) {
        // Update google auth
        auth.setCredentials(m.tokens);

        // Write tokens
        fs.writeFileSync(options.tokenLocation, JSON.stringify(m.tokens));

        // Done
        resolve(auth);

        // Kill process
        f.kill('SIGINT');
      }
    });
  });
}

// Check authentication.
// There does not seem to be a way to check the current
// tokens we have, so we make a simple call to Drive.
async function googleCheckAuthentication(auth, options = {}) {
  if (!options.scope || !find(options.scope, s => s.match(/auth\/drive/i))) {
    debug('Unable to find drive scope to check token.');
    return true;
  }

  try {
    let drive = google.drive('v3');
    let result = await drive.about.get({
      fields: ['user'],
      auth
    });

    return result && result.data && result.data.user;
  }
  catch (e) {
    debug(e);
    return false;
  }
}
