/**
 * Test Sql class
 */

// Dependencies for testing.
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Sql = require('../../src/packages/Sql');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-sql-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Sql package
describe('Sql class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Sql({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Sql({
      cachePath: defaultCachePath,
      source: `sqlite://${path.join(
        __dirname,
        '../_test-files/simple.sqlite'
      )}`,
      query: 'SELECT * FROM data ORDER BY id;'
    });

    let data = await f.fetch();
    expect(data[0]).toEqual({ id: 1, data: 'a' });
  });
});
