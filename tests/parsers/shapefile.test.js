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
  test('can parse .zip shapefile', async () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/natural_earth_ocean.zip')
    );

    let geojson = await shapefileParser(buf);
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBeGreaterThanOrEqual(1);
  });

  test('can parse .shp shapefile', async () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/us_states_20m/us_states_20m.shp')
    );

    let geojson = await shapefileParser(buf);
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBe(52);
    expect(geojson.features[0].properties).toEqual({});
  });

  test('can parse .shp shapefile with dbf', async () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/us_states_20m/us_states_20m.shp')
    );

    let geojson = await shapefileParser(buf, {
      dbf: path.join(
        __dirname,
        '../_test-files/us_states_20m/us_states_20m.dbf'
      )
    });
    expect(geojson).toBeTruthy();
    expect(geojson.features).toBeTruthy();
    expect(geojson.features.length).toBe(52);
    expect(geojson.features[0].properties.NAME).toEqual('Alaska');
  });
});
