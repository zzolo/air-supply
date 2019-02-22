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
  './.test-parser-overrides-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test with parserMethods overrides', () => {
  test('loads data', async () => {
    let a = new AirSupply({
      parserMethods: {
        yaml: {
          match: /(yaml|yml|custom-yml-ext)$/i
        }
      },
      cachePath: defaultCachePath,
      packages: {
        custmExtData: {
          source: path.join(
            __dirname,
            '../_test-files/data-simple.custom-yml-ext'
          )
        },
        jsonData: {
          source: path.join(__dirname, '../_test-files/data-simple.json')
        },
        ymlData: {
          source: path.join(__dirname, '../_test-files/data-simple.yml')
        }
      }
    });

    let data = await a.supply();
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.custmExtData).toBe('object');
    expect(typeof data.jsonData).toBe('object');
    expect(typeof data.ymlData).toBe('object');
  });
});
