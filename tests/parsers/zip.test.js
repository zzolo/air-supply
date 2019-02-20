/**
 * Test Zip parser
 */

// Dependencies for testing.
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const zipParser = require('../../src/parsers/zip');

// json
describe('zip parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/zip-files.zip')
    );
    expect(zipParser(buf)['data-json.json']).toBeTruthy();
  });
});
