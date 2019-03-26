/**
 * Test integrations with just data
 */

// Dependencies for testing
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const { AirSupply } = require('../../index');

// Default cache path
const defaultCachePath = path.join(__dirname, './.test-data-air-supply-cache');

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test with raw data', () => {
  test('loads data', async () => {
    let rawData = {
      some: 'data',
      other: [1, 2, 3]
    };

    let a = new AirSupply({
      cachePath: defaultCachePath,
      packages: {
        rawData: {
          source: rawData,
          type: 'data'
        },
        noTypeRawData: {
          source: rawData
        }
      }
    });

    let data = await a.supply();
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(data.rawData).toEqual(rawData);
    expect(data.noTypeRawData).toEqual(rawData);
  });
});
