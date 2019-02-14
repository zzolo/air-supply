/**
 * Test GoogleDoc class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const GoogleDoc = require('../../src/packages/GoogleDoc.mjs').default;
const parserMethods = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-googledoc-package-air-supply-cache'
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
      new GoogleDoc({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch unauthenticated method', () => {
  test('will fetch', async () => {
    expect.assertions(2);

    let f = new GoogleDoc({
      cachePath: defaultCachePath,
      source:
        'https://docs.google.com/document/d/e/2PACX-1vQMzrElN1kUoqwErJpiQmoEBjGovZvBfv4Cnk1fE3OPtXw9MrbFe12Wvx-fgjwk8yckCgkmVqwqNL8a/pub'
    });

    let data = await f.fetch();
    expect(data).toMatch(/headline/i);
    expect(data).not.toMatch(/docs.google.com/i);
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

      let f = new GoogleDoc({
        cachePath: defaultCachePath,
        source: '1VgXHKKpykKSLF6adx9tRbkwX0hpdfZvtt9oPQHLpyrs'
      });

      let data = await f.fetch();
      expect(data).toMatch(/headline/i);
      expect(data).not.toMatch(/docs.google.com/i);
    });
  }
  else {
    console.warn(
      'GoogleDoc package not fully tested, requires the following environment variables: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CONSUMER_SECRET.'
    );
  }
});

describe('cachedFetch unauthenticated method', () => {
  test('will fetch', async () => {
    expect.assertions(2);

    let f = new GoogleDoc({
      cachePath: defaultCachePath,
      source:
        'https://docs.google.com/document/d/e/2PACX-1vQMzrElN1kUoqwErJpiQmoEBjGovZvBfv4Cnk1fE3OPtXw9MrbFe12Wvx-fgjwk8yckCgkmVqwqNL8a/pub',
      parserMethods
    });

    let data = await f.cachedFetch();
    expect(typeof data).toBe('object');
    expect(data.Headline).toBeTruthy();
  });
});

describe('cachedFetch authenticated method', () => {
  jest.setTimeout(1000 * 60 * 10);

  // This doesn't apply in beforeAll
  require('dotenv').load();

  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CONSUMER_SECRET
  ) {
    test('will fetch', async () => {
      expect.assertions(2);

      let f = new GoogleDoc({
        cachePath: defaultCachePath,
        source: '1VgXHKKpykKSLF6adx9tRbkwX0hpdfZvtt9oPQHLpyrs',
        parserMethods
      });

      let data = await f.cachedFetch();
      expect(typeof data).toBe('object');
      expect(data.Headline).toBeTruthy();
    });
  }
  else {
    console.warn(
      'GoogleDoc package not fully tested, requires the following environment variables: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CONSUMER_SECRET.'
    );
  }
});
