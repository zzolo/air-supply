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
 * @param {Buffer} data Buffer to parse; should be either a .zip file or a .shp file.
 * @param {Object} [options] Options object.
 * @param {Buffer|String} [options.dbf] An optional specific .dbf file to use.  Useful
 *   if providing shapefile as .shp file.  This should be a buffer or file path.
 *
 * @return {Object} Parsed data.
 */
module.exports = async (data, options = {}) => {
  const AdmZip = require('adm-zip');

  // Check that we are
  if (!Buffer.isBuffer(data)) {
    throw new Error(
      'Data given to shapefile parser was not a buffer.  Some Packages in Air Supply require you to set the type of data to "buffer" explicitly.'
    );
  }

  // Try to do zip first
  try {
    let zip = new AdmZip(data);
    let entries = zip.getEntries();
    return await parseZipShapefile(zip, entries);
  }
  catch (e) {
    debug(e);

    // Try to do file
    try {
      return await parseShpFile(data, options);
    }
    catch (e) {
      debug(e);
      throw new Error(
        'Air Supply Shapefile parser was unable to parse the input.'
      );
    }
  }
};

// Parse a shapefile
async function parseShpFile(data, options) {
  const shapefile = require('shapefile');

  // Get reader
  let shpReader = await shapefile.open(data, options.dbf);

  // Start geojson
  let g = {
    type: 'FeatureCollection',
    bbox: shpReader.bbox,
    features: []
  };

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

  return g;
}

// Parse a zip file
async function parseZipShapefile(zip, entries) {
  const shapefile = require('shapefile');

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
}
