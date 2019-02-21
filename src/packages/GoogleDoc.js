/**
 * @ignore
 * Google Doc package class module.  Gets html output from
 * a Google Doc.
 *
 * @module air-supply/src/packages/GoogleDoc
 */

// Dependencies
const url = require('url');
const merge = require('lodash/merge');
const BasePackage = require('./BasePackage');
const googleAuthenticate = require('../auth/google');
const { AllHtmlEntities } = require('html-entities');
const htmlparser = require('htmlparser2');

// Debug
const debug = require('debug')('airsupply:google-doc');

/**
 * GoogleDoc package type.  Gets data from a Google Doc source via
 * [googleapis](https://www.npmjs.com/package/googleapis) module.
 * Defaults parser to ArchieML, but if no parser, it will return HTML.
 * The `googleapis` module is not installed by default, if you need
 * this package, install separately:
 *
 * ```sh
 * npm install googleapis
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install `googleapis` globally:
 *
 * ```sh
 * npm install -g googleapis
 * ```
 *
 * @export
 * @class GoogleDoc
 * @extends BasePackage
 *
 * @example
 * // Ensure googleapis module is installed: `npm install googleapis`
 * import GoogleDoc from 'air-supply/src/packages/GoogleDoc';
 * let f = new GoogleDoc({ source: 'GOOGLE-DOC-ID' });
 * let data = f.cachedFetch();
 *
 * @param {Object!} options Options for package that will override
 *   any defaults from the <AirSupply> or <BasePackage>.
 * @param {String!} options.source For authenticated requests, simply provide
 *   the Google Doc ID (can be found in the URL).  For un-authenticated requests
 *   via the "Published to the Web" version, provide the full URL.
 * @param {String} [options.parsers='archieml'] Defaults to use ArchieML parser.
 * @param {Object} [options.authOptions] Options to pass to the Google authentication
 *   function.
 * @param {Object|Function} [options.googleapis=require('googleapis')] The
 *   [googleapis](https://www.npmjs.com/package/googleapis) module is not
 *   installed by default.  You can either install it normally,
 *   i.e. `npm install googleapis`, or you can provide the module with
 *   this option if you need some sort of customization.
 * @param {Object|Function} [options.nodeFetch=require('node-fetch')] The
 *   [node-fetch](https://www.npmjs.com/package/node-fetch) module is
 *   installed by default, but you may want to use a specific version
 *   or otherwise customize it.
 * @param {Object<AirSupply>} [airSupply] The AirSupply object useful for
 *   referencial purposes.
 *
 * @return {<GoogleDoc>} The new GoogleDoc object.
 */
class GoogleDoc extends BasePackage {
  constructor(options, airSupply) {
    super(options, airSupply, {
      parsers: 'archieml'
    });

    // Attach dependencies
    try {
      this.googleapis = this.options.googleapis || require('googleapis');
    }
    catch (e) {
      debug(e);
      throw new Error(
        'The Air Supply GoogleDoc package was not provided an "options.googleapis" dependency, or could not find the "googleapis" module itself.  Trying installing the "googleapis" module: `npm install googleapis`'
      );
    }

    try {
      this.nodeFetch = this.options.nodeFetch || require('node-fetch');
    }
    catch (e) {
      debug(e);
      throw new Error(
        'The Air Supply GoogleDoc package was not provided an "options.nodeFetch" dependency, or could not find the "node-fetch" module itself.'
      );
    }
  }

  /**
   * Fetch implementation.  Uses [googleapis](https://www.npmjs.com/package/googleapis) module
   *
   * @async
   * @return {Object} The fetched data.
   */
  async fetch() {
    let source = this.option('source');
    let authOptions = merge({}, this.option('authOptions') || {}, {
      googleapis: this.googleapis
    });

    // Get the HTML content
    let contents = await this.getHTMLContents(source, authOptions);

    // Parse HTML
    return await this.htmlParser(contents);
  }

  /**
   * Get raw HTML contents from a Google Doc.
   *
   * @async
   *
   * @param {String} source Source can be a Google Doc ID if it needs
   *   to be an authenticated request, or a URL to a "Published to Web"
   *   version of a Google Doc.
   *
   * @return {String} HTML content.
   */
  async getHTMLContents(source, authOptions = {}) {
    if (!source) {
      throw new Error(
        'Document/file id not provided to getHTMLContents method in Google Docs package.'
      );
    }

    // Check if source is a URL (published to the web)
    if (source.match(/^http/i)) {
      return await this.getPublishedToWebContent(source);
    }

    // Authenticate to Google
    let auth = await googleAuthenticate(authOptions);

    // Get file contests as HTML
    let drive = this.googleapis.google.drive('v3');
    return await drive.files
      .export({
        fileId: source,
        mimeType: 'text/html',
        auth
      })
      .then(r => r.data);
  }

  /**
   * Get contents via "Published to Web", which doesn't require
   * any authentication.
   *
   * @async
   *
   * @param {String} url URL to "Published to Web" Google Doc.
   *
   * @return {String} HTML content.
   */
  async getPublishedToWebContent(url) {
    if (!url || !url.match(/^http/i)) {
      throw new Error(
        'URL provided to getPublishedToWebContent method in Google Docs package does not start with "http"'
      );
    }

    // Fetch
    let r;
    try {
      r = await this.nodeFetch(url);
    }
    catch (e) {
      debug(e);
      throw new Error(
        `Issue fetching Goole Doc "${
          this.options.key
        }" with source "${url}".  Use the DEBUG option to see more info.`
      );
    }

    if (!r.ok) {
      throw new Error(
        `Status "${r.status}" not OK when fetching resource "${
          this.options.key
        }" with source "${url}".`
      );
    }

    return await r.text();
  }

  /**
   * HTML parser
   * From: https://github.com/bradoyler/googledoc-to-json/blob/master/index.js
   *
   * @async
   *
   * @param {String} text HTML test to parse
   *
   * @return {String} Parsed content.
   */
  async htmlParser(text) {
    return new Promise((resolve, reject) => {
      const handler = new htmlparser.DomHandler((error, dom) => {
        if (error) {
          return reject(error);
        }

        const tagHandlers = {
          _base: tag => {
            let str = '';
            tag.children.forEach(function(child) {
              const transform = tagHandlers[child.name || child.type];
              if (transform) {
                str += transform(child);
              }
            });
            return str;
          },
          text: textTag => {
            return textTag.data;
          },
          div: divTag => {
            return tagHandlers._base(divTag);
          },
          span: spanTag => {
            return tagHandlers._base(spanTag);
          },
          p: pTag => {
            return tagHandlers._base(pTag) + '\n';
          },
          a: aTag => {
            let { href } = aTag.attribs;
            if (href === undefined) return '';
            // extract real URLs from Google's tracking
            // from: http://www.google.com/url?q=http%3A%2F%2Fwww.nytimes.com...
            // to: http://www.nytimes.com...
            if (
              aTag.attribs.href &&
              url.parse(aTag.attribs.href, true).query &&
              url.parse(aTag.attribs.href, true).query.q
            ) {
              href = url.parse(aTag.attribs.href, true).query.q;
            }

            let str = '<a href="' + href + '">';
            str += tagHandlers._base(aTag);
            str += '</a>';
            return str;
          },
          li: tag => {
            return '* ' + tagHandlers._base(tag) + '\n';
          }
        };

        const listTags = ['ul', 'ol'];
        listTags.forEach(tag => {
          tagHandlers[tag] = tagHandlers.span;
        });

        const hTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        hTags.forEach(tag => {
          tagHandlers[tag] = tagHandlers.p;
        });

        // Published contents have a slightly different structure
        // TODO: Is there a way to do this that isn't so brittle
        const body =
          dom[0].type === 'directive'
            ? dom[1].children[1].children[1]
            : dom[0].children[1];
        const parsedText = tagHandlers._base(body);

        // Convert html entities into the characters as they exist in the google doc
        const entities = new AllHtmlEntities();
        const decodedText = entities.decode(parsedText);

        // Remove smart quotes from inside tags
        const cleanText = decodedText.replace(/<[^<>]*>/g, match => {
          return match.replace(/”|“/g, '"').replace(/‘|’/g, '\'');
        });

        resolve(cleanText);
      });

      const parser = new htmlparser.Parser(handler);
      parser.write(text);
      parser.done();
    });
  }
}

// Export
module.exports = GoogleDoc;
