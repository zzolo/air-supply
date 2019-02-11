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
import * as debugWrapper from 'debug';
import path from 'path';
import os from 'os';
import url from 'url';
import http from 'http';
import fsWrapper from 'fs-extra';
import googleapisWrapper from 'googleapis';
import opnWrapper from 'opn';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:auth:google');

// Deal with import defaults
const fs = fsWrapper.default || fsWrapper;
const { google } = googleapisWrapper.default || googleapisWrapper;
const opn = opnWrapper.default || opnWrapper;

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
 * @param {Array} [options.consumerSecret=['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/spreadsheets']]
 *   The scope of the autentication.
 * @param {Number} [options.localPort=48080] Port for local server.
 * @param {String} [options.tokenLocation=~/.air-supply/google-auth.json] Where
 *   to save the authentication token.
 * @param {Boolean} [options.forceReAuth=false] Force authentication even
 *   if tokens are available.
 * @param {Number} [options.timeout=300000] Timeout (currently doen't work)
 * @param {String} [options.authenticatedMessage='..[[[LOCATION]]]..'] The message
 *   to send to the browser when successfully authenticated.
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
    timeout: 1000 * 60 * 5,
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

    // TODO: Check if valid still?

    return auth;
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

  // Get new tokens
  return new Promise((resolve, reject) => {
    // Create auth Url
    let authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: options.scope.join(' '),
      prompt: 'consent'
    });

    // Weird way to close the local server "forcefully"
    // https://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately
    let sockets = {};

    // Destroy sockets
    function destroySockets() {
      for (let s in sockets) {
        sockets[s].destroy();
      }
    }

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        destroySockets();
        reject(
          new Error(
            'Google authentication timeout reached; if this happens too quickly, update the "timeout" option.'
          )
        );
      }, options.timeout);
    }

    // Local server
    let localServer;

    // Handle authentication response
    const onAuthenticated = async (request, response) => {
      // Parse out query paramters
      let requestUrl =
        request.url[0] == '/'
          ? `localhost:${options.localPort}${request.url}`
          : request.url;
      let query = new url.URL(requestUrl).searchParams;
      let code = query.get('code');

      // No code.
      // TODO: Is this an error-able thing?
      if (!code) {
        destroySockets();
        return;
      }

      try {
        // Get tokens
        let token = await auth.getToken(code);
        var tokens = token.tokens;

        // Write tokens
        fs.writeFileSync(options.tokenLocation, JSON.stringify(tokens));
        response.end(
          options.authenticatedMessage.replace(
            '[[[LOCATION]]]',
            options.tokenLocation
          )
        );

        // Close server, kind of hacky, but not better way
        localServer.close(error => {
          if (error) {
            destroySockets();
            return reject(error);
          }

          localServer.unref();
          destroySockets();
          process.nextTick(() => {
            resolve(auth);
          });
        });
      }
      catch (e) {
        destroySockets();
        response.end(e.message);
        reject(e);
      }
    };

    // Handle request of local server
    const onRequest = (request, response) => {
      response.setHeader('Connection', 'close');

      if (request.url.indexOf('authenticate') > -1) {
        return onAuthenticated(request, response);
      }
      else if (request.url.indexOf('authorize') > -1) {
        response.setHeader('Location', authUrl);
        response.writeHead(302);
      }
      else {
        response.writeHead(404);
      }

      response.end();
    };

    // Start local server
    localServer = http.createServer(onRequest);
    localServer.listen(options.localPort, () =>
      opn(`http://localhost:${options.localPort}/authorize`)
    );

    // Track sockets
    let nextSocketId = 0;
    localServer.on('connection', socket => {
      // Add a newly connected socket
      let thisSocketId = nextSocketId++;
      sockets[thisSocketId] = socket;

      // Remove the socket when it closes
      socket.on('close', function() {
        delete sockets[thisSocketId];
      });
    });
  });
}
