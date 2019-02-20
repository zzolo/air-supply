/**
 * Test File class
 */

// Dependencies for testing.

// Get module
const yamlParser = require('../../src/parsers/yaml');

// json
describe('yaml parser', () => {
  test('can parse', () => {
    expect(yamlParser('a: 12')).toEqual({ a: 12 });
    expect(yamlParser('a:\n  - 1\n  - 2')).toEqual({ a: [1, 2] });
  });
});
