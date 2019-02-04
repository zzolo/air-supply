/**
 * Test File class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module

// Get module
const jsonParser = require('../../src/parsers/json.mjs').default;

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
