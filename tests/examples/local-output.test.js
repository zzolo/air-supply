/**
 * Test locally save processed output
 */

// Dependencies for testing
const { readFileSync, existsSync, removeSync } = require('fs-extra');
const path = require('path');

// Get module
const { AirSupply } = require('../../index');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-local-output-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('AirSupply integration test with local output', () => {
  const testOutputFile = path.join(__dirname, 'test-local-output.test-file');

  afterEach(() => {
    removeSync(testOutputFile);
  });

  test('loads data', async () => {
    let a = new AirSupply({
      cachePath: defaultCachePath,
      packages: {
        jsonData: {
          source: path.join(__dirname, '../_test-files/data-simple.json'),
          output: testOutputFile
        }
      }
    });

    let data = await a.supply();
    expect(a.options.packages).toBeTruthy();
    expect(typeof data).toBe('object');
    expect(typeof data.jsonData).toBe('object');

    expect(existsSync(testOutputFile)).toBeTruthy();
    expect(JSON.parse(readFileSync(testOutputFile, 'utf-8'))).toEqual(
      data.jsonData
    );
  });
});
