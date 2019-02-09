/**
 * Test Directory class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Directory = require('../../src/packages/Directory.mjs').default;
const parserMethods = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-directory-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Directory package
describe('Directory class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Directory({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('will throw on no file', async () => {
    expect.assertions(1);

    let f = new Directory({
      cachePath: defaultCachePath,
      source: path.join(__dirname, 'no-file-exists')
    });

    await expect(f.fetch()).rejects.toBeTruthy();
  });

  test('can fetch a directory without glob', async () => {
    expect.assertions(1);

    let f = new Directory({
      cachePath: defaultCachePath,
      source: path.join(__dirname, '../_test-files/directory-package')
    });

    let data = await f.fetch();
    expect(data['data-json.json']).toBeTruthy();
  });
});

describe('cachedFetch method', () => {
  // For some reason, the cwd is not consistent
  process.chdir(path.join(__dirname, '../../'));

  test('can fetch a directory and parse each file', async () => {
    expect.assertions(1);

    let f = new Directory({
      cachePath: defaultCachePath,
      source: path.join(__dirname, '../_test-files/directory-package/**/*'),
      parserMethods
    });

    let data = await f.cachedFetch();
    expect(data['tests/_test-files/directory-package/data-json.json']).toEqual({
      data: 'json'
    });
  });
});
