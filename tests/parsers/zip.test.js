/**
 * Test Zip parser
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { readFileSync } = require('fs');
const path = require('path');

// Get module
const zipParser = require('../../src/parsers/zip.mjs').default;

// json
describe('zip parser', () => {
  test('can parse', () => {
    let buf = readFileSync(
      path.join(__dirname, '../_test-files/zip-files.zip')
    );
    expect(zipParser(buf)).toEqual([{ a: 1, b: 2, c: 3 }]);
  });
});
