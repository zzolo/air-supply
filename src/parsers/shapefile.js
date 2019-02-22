/**
 * @ignore
 * Shapefile .zip parsing with shpjs
 */

// Dependencies
const map = require('lodash/map');
const size = require('lodash/size');
const filter = require('lodash/filter');
// Debug
const debug = require('debug')('airsupply:shapefile');

/**
 * Shapefile parser.  Will look for any .shp files in a zip
 * file.  If multiple .shp files are found, then it will return
 * an object where the key is
 * Uses
 * [shapefile](https://github.com/calvinmetcalf/shapefile-js) and
 * [adm-zip](https://github.com/calvinmetcalf/shapefile-js) modules;
 * these not installed by default, if you need this parser,
 * install separately:
 *
 * ```sh
 * npm install shapefile adm-zip
 * ```
 *
 * If you are using Air Supply via the command line, it may make
 * sense to install these modules globally:
 *
 * ```sh
 * npm install -g shapefile adm-zip
 * ```
 *
 * @name shapefile
 * @export
 *
 * @param {String|Buffer} input Buffer or filename to parse.
 *
 * @return {Object} Parsed data.
 */
module.exports = async data => {
  const AdmZip = require('adm-zip');
  const shapefile = require('shapefile');

  // setup places to put entries and zips
  let entries;
  let zip;

  try {
    zip = new AdmZip(data);
    entries = zip.getEntries();
  }
  catch (e) {
    debug(e);
    throw new Error(
      'In Shapefile parser, unable to read zip data.  Use DEBUG for more information.'
    );
  }

  // Check data
  if (!entries || !entries.length) {
    debug('Zip data did not have any entries.');
    return [];
  }

  // Find any .shp files
  let shpFiles = filter(entries, z => {
    return z.entryName.match(/.shp$/i);
  });

  // For each shapefile
  let parsed = {};
  for (let shpFile of shpFiles) {
    let shpData = zip.readFile(shpFile.entryName);

    // DBF file is optional
    let dbfData;
    try {
      dbfData = zip.readFile(shpFile.entryName.replace(/.shp$/i, '.dbf'));
    }
    catch (e) {
      // Ignore
    }

    // Get reader
    let shpReader = await shapefile.open(shpData, dbfData);

    // Start geojson
    let g = (parsed[shpFile.entryName] = {
      type: 'FeatureCollection',
      bbox: shpReader.bbox,
      features: []
    });

    // Go through each property
    let hasFeatures = true;
    while (hasFeatures) {
      let feature = await shpReader.read();
      if (feature.done) {
        hasFeatures = false;
        continue;
      }

      g.features.push(feature.value);
    }
  }

  // If only one .shp, just return that.
  return size(parsed) === 1 ? map(parsed, p => p)[0] : parsed;
};
