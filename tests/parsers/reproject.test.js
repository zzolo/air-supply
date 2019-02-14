/**
 * Test Reproject parser
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const reprojectParser = require('../../src/parsers/reproject.mjs').default;

// json
describe('topojson parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/natural_earth_disputed.geo.json')
    );

    let reprojected = reprojectParser(buf, {
      sourceCrs: 'EPSG:4326',
      targetCrs: 'EPSG:900913'
    });

    expect(reprojected).toBeTruthy();
    expect(reprojected.features).toBeTruthy();
    expect(reprojected.features.length).toBeGreaterThanOrEqual(1);
    expect(
      Math.abs(reprojected.features[0].geometry.coordinates[0][0][0])
    ).toBeGreaterThanOrEqual(1000);
  });
});
