/**
 * Test Shapefile parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const shapefileParser = require('../../src/parsers/shapefile');

// json
describe('shapefile parser', () => {
  test('can parse', async () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/natural_earth_ocean.zip')
    );

    let geojson = await shapefileParser(buf);
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBeGreaterThanOrEqual(1);
  });
});
