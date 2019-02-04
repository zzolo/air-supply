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
const Https = require('../../src/packages/Https.mjs').default;
const parsers = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-https-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Https package
describe('Https class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Https({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Https({
      cachePath: defaultCachePath,
      source: 'https://example.com'
    });

    let data = await f.fetch();
    expect(data).toMatch(/html/i);
  });

  test('throws on bad domain', async () => {
    let f = new Https({
      cachePath: defaultCachePath,
      source: 'https://invalid.domain'
    });

    expect(async () => {
      await f.fetch();
    }).toThrow;
  });
});

describe('cachedFetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Https({
      cachePath: defaultCachePath,
      source: 'https://httpbin.org/json',
      parsers
    });

    let data = await f.cachedFetch();
    expect(typeof data).toBe('object');
  });
});
