/**
 * Test File class
 */

// Dependencies for testing.
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const File = require('../../src/packages/File');
const parserMethods = require('../../src/parsers/default-parsers');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-file-package-air-supply-cache'
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
      parserMethods
    });

    let data = await f.cachedFetch();
    expect(data).toEqual({ thing: 1 });
  });

  test('can fetch a file (yml)', async () => {
    let f = new File({
      cachePath: defaultCachePath,
      source: path.join(__dirname, '../_test-files/data-simple.yml'),
      parserMethods
    });

    let data = await f.cachedFetch();
    expect(data).toEqual({ nested: [{ thing1: 2 }, { thing2: 3 }], thing: 1 });
  });
});
