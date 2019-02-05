/**
 * @ignore
 * ArchieML parser, just use archieml.
 */

import archieml from 'archieml';

/**
 * ArchieML parser.  Uses [archieml](https://www.npmjs.com/package/archieml) module.
 *
 * @name archieml
 * @export
 *
 * @param {String!} input Data to parse.
 * @param {Object} [options] Options, see [archieml](https://www.npmjs.com/package/archieml) module for details.
 *
 * @return {Object} Parsed data.
 */
export default archieml.load;
