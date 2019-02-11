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
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.directory).toBe('object');
    expect(typeof data.directory['tests/_test-files/data-simple.json']).toBe(
      'object'
    );
  });
});
