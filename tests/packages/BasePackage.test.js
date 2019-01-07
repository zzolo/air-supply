/**
 * Test BasePackage class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing
const path = require('path');

// Get module
const BasePackage = require('../../src/packages/BasePackage.mjs').default;

// Default cache path
const defaultCachePath = path.join(__dirname, '../.test-air-supply-cache');

// AirSupply
describe('BasePackage class', () => {
  test('can instantiate', () => {
    new BasePackage({
      cachePath: defaultCachePath
    });
  });
});
