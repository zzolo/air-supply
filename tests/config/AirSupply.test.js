/**
 * Test core AirSupply class
 */

// Dependencies for testing
const { removeSync } = require('fs-extra/lib/remove');
const path = require('path');

// Get module
const { AirSupply } = require('../../index');

// After all are done, remove directory
afterAll(() => {
  removeSync(path.join(__dirname, '.air-supply'));
});

// AirSupply
describe('AirSupply class explicit config file', () => {
  test('loads config', () => {
    let a = new AirSupply({
      config: path.join(__dirname, '.air-supply.json5')
    });
    expect(a.options.packages).toBeTruthy();
  });
});

describe('AirSupply class implicit config file', () => {
  test('loads config', () => {
    process.chdir(__dirname);
    let a = new AirSupply();
    expect(a.options.packages).toBeTruthy();
  });
});
