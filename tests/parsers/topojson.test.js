/**
 * Test Topojson parser
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const topojsonParser = require('../../src/parsers/topojson.mjs').default;

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
