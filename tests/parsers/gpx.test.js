/**
 * Test GPX parser
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const gpxParser = require('../../src/parsers/gpx.mjs').default;

// json
describe('gpx parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/data-simple.gpx')
    );

    let geojson = gpxParser(buf);
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBeGreaterThanOrEqual(1);
  });
});
