/**
 * Test core AirSupply class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing
// NOTE: there is a problem if you use the same require here and in the ESM module
const path = require('path');

// Get module
const { AirSupply } = require('../../index.mjs').default;

// AirSupply
describe('AirSupply class with config file', () => {
  test('loads config', () => {
    let a = new AirSupply({
      config: path.join(__dirname, '.air-supplyrc.json5')
    });
    expect(a.options.packages).toBeTruthy();

    console.log(a.supply());
  });
});
