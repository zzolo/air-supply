/**
 * Test File class
 */

// Dependencies for testing.

// Get module
const jsonParser = require('../../src/parsers/json');

// json
describe('json parser', () => {
  test('can parse', () => {
    expect(jsonParser('{ thing: 1 }')).toEqual({ thing: 1 });
    expect(jsonParser('[1, 2]')).toEqual([1, 2]);
    expect(() => {
      jsonParser('abc');
    }).toThrow();
  });
});
