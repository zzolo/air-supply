/**
 * Test xlsx parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const xlsxParser = require('../../src/parsers/xlsx');

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
