/**
 * Test File class
 */

// Dependencies for testing.
// Get module
const archiemlParser = require('../../src/parsers/archieml');

// json
describe('archieml parser', () => {
  test('can parse', () => {
    expect(archiemlParser('a: 12')).toEqual({ a: '12' });
  });
});
