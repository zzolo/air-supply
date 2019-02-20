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
  './.test-directory-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test with directory', () => {
  test('loads data', async () => {
    let a = new AirSupply({
      cachePath: defaultCachePath,
      packages: {
        directory: {
          source: path.join(__dirname, '../_test-files/**/*.{json,yml,xls}'),
          type: 'directory'
        }
      }
    });

    let data = await a.supply();
    // For some reason the paths that get loaded here are inconsistent
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.directory).toBe('object');
    expect(typeof data.directory['tests/_test-files/data-simple.json']).toBe(
      'object'
    );
  });
});
