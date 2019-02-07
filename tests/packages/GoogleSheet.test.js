/**
 * Test GoogleSheet class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const GoogleSheet = require('../../src/packages/GoogleSheet.mjs').default;
const parsers = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-googlesheet-package-air-supply-cache'
);

// Get authentication
beforeAll(() => {
  require('dotenv').load();
});

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// File package
describe('GoogleDoc class', () => {
  test('can instantiate', () => {
    expect(() => {
      new GoogleSheet({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch authenticated method', () => {
  jest.setTimeout(1000 * 60 * 10);

  // This doesn't apply in beforeAll
  require('dotenv').load();

  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CONSUMER_SECRET
  ) {
    test('will fetch', async () => {
      let f = new GoogleSheet({
        cachePath: defaultCachePath,
        source: '1by2j2MNyhKlAgULgysi413jptqitxWvCYZYgl-M1Ezo'
      });

      let data = await f.fetch();
      expect(typeof data).toBe('object');
      expect(data.length).toBeGreaterThan(1);
    });
  }
  else {
    console.warn(
      'GoogleSheet package not fully tested, requires the following environment variables: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CONSUMER_SECRET.'
    );
  }
});
