/**
 * @ignore
 * Method to do the Google OAuth authentication specifically.  This
 * is done as a separate module, so that it can be a separate
 * managed process, which is needed because the Node HTTP server
 * cannot be killed easily.  Specifically, even through modules like
 * killable, something about the oauth redirect keeps the process
 * open and thus does not allow for a method that can be ended.
 *
 * Code and inspiration taken from:
 * https://github.com/nprapps/google-login
 *
 * @module air-supply/src/auth/google
 *
 * @example
 * import { fork } from 'child_process';
 * fork('google-auth.js')
 */

// Dependencies
// TODO: googleapis dependency should be passed from the parent process, but unsure best
// way to do this.
const { google } = require('googleapis');
const url = require('url');
const express = require('express');
const killable = require('killable');
const opn = require('opn');

// Main method.  Options should be managed
async function authenticate(options = {}) {
  let localUrl = `http://localhost:${options.localPort}/authenticate`;

  // Create auth object
  let auth = new google.auth.OAuth2(
    options.clientId,
    options.consumerSecret,
    localUrl
  );

  // Local server
  let localServer;

  // Get new tokens
  return new Promise((resolve, reject) => {
    // Create auth Url
    let authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: options.scope.join(' '),
      prompt: 'consent'
    });

    // Handle authentication response
    const onAuthenticated = async (request, response, next) => {
      // Parse out query paramters
      let requestUrl =
        request.url[0] == '/'
          ? `localhost:${options.localPort}${request.url}`
          : request.url;
      let query = new url.URL(requestUrl).searchParams;
      let code = query.get('code');

      // No code.
      if (!code) {
        let e = new Error('No code provided to /authenticate request.');
        reject(e);
        return next(e);
      }

      try {
        // Get tokens
        let token = await auth.getToken(code);

        // Resolve with tokens
        resolve(token.tokens);

        // Communicate to user in browser
        // The killing of the server can't happen if use .end, so
        // we use .write
        response.send(
          options.authenticatedMessage.replace(
            '[[[LOCATION]]]',
            options.tokenLocation
          )
        );

        // Close server
        setTimeout(() => {
          localServer.kill();
        }, 250);
      }
      catch (e) {
        response.send(e.message);
        reject(e);
        next(e);

        setTimeout(() => {
          localServer.kill();
        }, 250);
      }
    };

    // Start local server
    const localApp = express();
    localApp.get('/authenticate', onAuthenticated);
    localApp.get('/authorize', (request, response) =>
      response.redirect(authUrl)
    );
    localServer = localApp.listen(options.localPort, () => {
      setTimeout(() => {
        opn(`http://localhost:${options.localPort}/authorize`);
      }, options.openWait || 1);
    });

    // Add ability to forcefully destroy sockets and close server
    killable(localServer);
  });
}

// Export if needed for some reason
module.exports = authenticate;

// Process/fork message handling
process.on('message', async options => {
  try {
    let tokens = await authenticate(options);

    process.send({
      error: false,
      tokens
    });
  }
  catch (e) {
    process.send({
      error: e
    });
  }
});
