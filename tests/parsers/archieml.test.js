/**
 * Test File class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module

// Get module
const archiemlParser = require('../../src/parsers/archieml.mjs').default;

// json
describe('archieml parser', () => {
  test('can parse', () => {
    expect(archiemlParser('a: 12')).toEqual({ a: '12' });
  });
});
