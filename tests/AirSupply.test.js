/**
 * Test core AirSupply class
 */

// Allow ESM support
require = require('esm')(module);

// Get module
const { AirSupply, airSupply } = require('../index.mjs').default;

// AirSupply
describe('AirSupply class', () => {
  test('can instantiate without options', () => {
    new AirSupply({});
  });

  test('can override defaults', () => {
    let a = new AirSupply({ ttl: 100 });
    expect(a.options.ttl).toBe(100);
  });
});

// airSupply
describe('airSupply function', () => {
  test('can run without options', () => {
    airSupply({});
  });

  test('can override defaults', () => {
    let a = airSupply({ ttl: 100 });
    expect(a.options.ttl).toBe(100);
  });
});
