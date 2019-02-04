/**
 * Test File class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module

// Get module
const csvParser = require('../../src/parsers/csv.mjs').default;

// json
describe('csv parser', () => {
  test('can parse', () => {
    expect(csvParser('a,b,c\n1,2,3')).toEqual([{ a: 1, b: 2, c: 3 }]);
    expect(csvParser('a,b,c\n"1",2,3')).toEqual([{ a: 1, b: 2, c: 3 }]);
  });
});
