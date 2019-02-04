/**
 * Test Airtable class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const Airtable = require('../../src/packages/Airtable.mjs').default;
const parsers = require('../../src/parsers/default-parsers.mjs').default;

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-airtable-package-air-supply-cache'
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
describe('Airtable class', () => {
  test('can instantiate', () => {
    expect(() => {
      new Airtable({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });
});

describe('fetch method', () => {
  // This doesn't apply in beforeAll
  require('dotenv').load();

  if (
    process.env.AIRTABLE_API_KEY &&
    process.env.AIRTABLE_BASE &&
    process.env.AIRTABLE_TABLE
  ) {
    test('will fetch', async () => {
      let f = new Airtable({
        cachePath: defaultCachePath,
        source: process.env.AIRTABLE_BASE,
        table: process.env.AIRTABLE_TABLE,
        airtableKey: process.env.AIRTABLE_API_KEY
      });

      let data = await f.fetch();
      await expect(data).toBeTruthy();
      await expect(data.length).toBeGreaterThanOrEqual(1);
    });
  }
  else {
    console.warn(
      'Airtable package not fully tested, requires the following environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE, AIRTABLE_TABLE.'
    );
  }
});
