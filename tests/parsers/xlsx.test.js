/**
 * Test xlsx parser
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const xlsxParser = require('../../src/parsers/xlsx.mjs').default;

// xlsx
describe('xlsx parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/data-simple.xls')
    );

    expect(typeof xlsxParser(buf)).toEqual('object');
    expect(xlsxParser(buf, { sheet: 'Sheet1' }).length).toBeGreaterThan(1);
  });
});
