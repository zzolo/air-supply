/**
 * Test KML parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const kmlParser = require('../../src/parsers/kml');

// json
describe('kml parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/data-simple.kml')
    );

    let geojson = kmlParser(buf);
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBeGreaterThanOrEqual(1);
  });
});
