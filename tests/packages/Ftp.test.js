/**
 * Test Ftp class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Ftp = require('../../src/packages/Ftp.mjs').default;
const parserMethods = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-ftp-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// Ftp package
describe('Ftp class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Ftp({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Ftp({
      cachePath: defaultCachePath,
      source: 'ftp://media:results@ftp.sos.state.mn.us/20180814/attorneygen.txt'
    });

    let data = await f.fetch();
    expect(data).toMatch(/attorney/i);
  });

  test('can fetch a URL as buffer', async () => {
    let f = new Ftp({
      cachePath: defaultCachePath,
      source:
        'ftp://media:results@ftp.sos.state.mn.us/20180814/attorneygen.txt',
      fetchOptions: {
        type: 'buffer'
      }
    });

    let data = await f.fetch();
    expect(Buffer.isBuffer(data)).toBe(true);
  });
});

describe('cachedFetch method', () => {
  test('can fetch a URL', async () => {
    let f = new Ftp({
      cachePath: defaultCachePath,
      source:
        'ftp://media:results@ftp.sos.state.mn.us/20180814/attorneygen.txt',
      parserMethods,
      parser: {
        parser: 'csv',
        parserOptions: {
          delimiter: ';',
          columns: false,
          cast: false
        }
      }
    });

    let data = await f.cachedFetch();
    expect(data.length).toBeGreaterThan(1);
  });
});
