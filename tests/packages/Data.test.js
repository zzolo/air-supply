/**
 * Test Data class
 */

// Dependencies for testing.
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Data = require('../../src/packages/Data');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-data-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Data package
describe('Data class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Data({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('can fetch data', async () => {
    let f = new Data({
      cachePath: defaultCachePath,
      source: [1, 2, 3]
    });

    let data = await f.fetch();
    expect(data).toEqual([1, 2, 3]);
  });
});

describe('cachedFetch method', () => {
  test('can fetch data', async () => {
    let f = new Data({
      cachePath: defaultCachePath,
      source: 123
    });

    let data = await f.cachedFetch();
    expect(data).toEqual(123);
  });
});
