/**
 * Test Topojson parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const topojsonParser = require('../../src/parsers/topojson');

// json
describe('topojson parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/natural_earth_disputed.geo.json')
    );

    let topo = topojsonParser(buf);
    expect(topo).toBeTruthy();
    expect(topo.objects).toBeTruthy();
    expect(topo.objects.geojson).toBeTruthy();
    expect(topo.arcs.length).toBeGreaterThanOrEqual(1);
  });
});
