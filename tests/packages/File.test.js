/**
 * Test File class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const File = require('../../src/packages/File.mjs').default;
const parsers = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-base-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// File package
describe('File class', () => {
  test('can instantiate', () => {
    expect(() => {
      new File({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('will throw on no file', async () => {
    let f = new File({
      cachePath: defaultCachePath,
      source: path.join(__dirname, 'no-file-exists')
    });

    await expect(f.fetch()).rejects.toBeTruthy();
  });

  test('can fetch a file', async () => {
    let f = new File({
      cachePath: defaultCachePath,
      source: path.join(__dirname, '../_test-files/data-simple.json')
    });

    let data = await f.fetch();
    expect(JSON.parse(data)).toEqual({ thing: 1 });
  });
});

describe('cachedFetch method', () => {
  test('can fetch a file', async () => {
    let f = new File({
      cachePath: defaultCachePath,
      source: path.join(__dirname, '../_test-files/data-simple.json'),
      parsers
    });

    let data = await f.cachedFetch();
    expect(data).toEqual({ thing: 1 });
  });
});
