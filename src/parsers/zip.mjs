/**
 * @ignore
 * Zip archive parser.
 */

import AdmZip from 'adm-zip';
import * as debugWrapper from 'debug';

// Debug
const debug = (debugWrapper.default || debugWrapper)('airsupply:zip');

/**
 * Zip archiver.  Uses [adm-zip](https://www.npmjs.com/package/adm-zip) module.  Produces
 * an object, where each key is the file in the archive and each value is the text of
 * that file.
 *
 * @name zip
 * @export
 *
 * @param {Buffer!} input Input buffer data.
 *
 * @return {Object} Parsed data.
 */
export default input => {
  let entries;
  let zip;

  try {
    zip = new AdmZip(input);
    entries = zip.getEntries();
  }
  catch (e) {
    debug(e);
    throw new Error(
      'Unable to read zip data.  Use DEBUG for more information.'
    );
  }

  // Check data
  if (!entries || !entries.length) {
    debug('Zip data did not have any entries.');
    return [];
  }

  // Turn into information
  let data = {};
  entries.map(z => {
    data[z.entryName] = zip.readAsText(z);
  });

  return data;
};
