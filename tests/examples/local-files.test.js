/**
 * Test integrations with local files
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const { AirSupply } = require('../../index.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-local-files-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test with local files', () => {
  test('loads data', async () => {
    let a = new AirSupply({
      cachePath: defaultCachePath,
      packages: {
        jsonData: {
          source: path.join(__dirname, '../_test-files/data-simple.json')
        },
        xlsData: {
          source: path.join(__dirname, '../_test-files/data-simple.xls'),
          fetchOptions: null
        },
        zipData: {
          source: path.join(__dirname, '../_test-files/zip-files.zip'),
          fetchOptions: null,
          parsers: ['zip', { multiSource: true }]
        }
      }
    });

    let data = await a.supply();
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.jsonData).toBe('object');
    expect(typeof data.xlsData).toBe('object');
    expect(typeof data.zipData).toBe('object');
    expect(typeof data.zipData['data-json.json']).toBe('object');
  });
});
