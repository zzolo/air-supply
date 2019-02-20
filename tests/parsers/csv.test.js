/**
 * Test File class
 */

// Dependencies for testing.

// Get module
const csvParser = require('../../src/parsers/csv');

// json
describe('csv parser', () => {
  test('can parse', () => {
    expect(csvParser('a,b,c\n1,2,3')).toEqual([{ a: 1, b: 2, c: 3 }]);
    expect(csvParser('a,b,c\n"1",2,3')).toEqual([{ a: 1, b: 2, c: 3 }]);
  });
});
