/**
 * Test integrations with local files
 */

// Dependencies for testing
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const { AirSupply } = require('../../index');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-shapefile-topojson-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test zip file to topojson with reproject', () => {
  test('loads data', async () => {
    let a = new AirSupply({
      cachePath: defaultCachePath,
      packages: {
        mnCounties: {
          source: path.join(__dirname, '../_test-files/mn_counties.zip'),
          type: 'file',
          fetchOptions: null,
          parsers: [
            'shapefile',
            {
              parser: 'reproject',
              parserOptions: {
                sourceCrs: 'EPSG:26915',
                targetCrs: 'EPSG:4326'
              }
            },
            {
              parser: 'topojson',
              name: 'mnCounties'
            }
          ]
        }
      }
    });

    let data = await a.supply();
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.mnCounties).toBe('object');
    expect(data.mnCounties.type).toBe('Topology');
    expect(data.mnCounties.bbox.length).toBe(4);
  });
});
