/**
 * Test GPX parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const gpxParser = require('../../src/parsers/gpx');

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
