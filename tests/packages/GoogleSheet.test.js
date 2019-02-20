/**
 * Test GoogleSheet class
 */

// Dependencies for testing.
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const GoogleSheet = require('../../src/packages/GoogleSheet');
//const parserMethods = require('../../src/parsers/default-parsers');

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
    expect.assertions(1);

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
      expect.assertions(2);

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
