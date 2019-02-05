/**
 * Test Http class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Http = require('../../src/packages/Http.mjs').default;
const parsers = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-http-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Http package
describe('Http class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Http({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Http({
      cachePath: defaultCachePath,
      source: 'http://example.com'
    });

    let data = await f.fetch();
    expect(data).toMatch(/html/i);
  });

  test('can fetch a URL as buffer', async () => {
    let f = new Http({
      cachePath: defaultCachePath,
      source: 'http://example.com',
      fetchOptions: {
        type: 'buffer'
      }
    });

    let data = await f.fetch();
    expect(Buffer.isBuffer(data)).toBe(true);
  });

  test('throws on bad domain', async () => {
    let f = new Http({
      cachePath: defaultCachePath,
      source: 'http://invalid.domain'
    });

    expect(async () => {
      await f.fetch();
    }).toThrow;
  });
});

describe('cachedFetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Http({
      cachePath: defaultCachePath,
      source: 'https://httpbin.org/json',
      parsers
    });

    let data = await f.cachedFetch();
    expect(typeof data).toBe('object');
  });
});
