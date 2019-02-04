/**
 * Test File class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module

// Get module
const yamlParser = require('../../src/parsers/yaml.mjs').default;

// json
describe('yaml parser', () => {
  test('can parse', () => {
    expect(yamlParser('a: 12')).toEqual({ a: 12 });
    expect(yamlParser('a:\n  - 1\n  - 2')).toEqual({ a: [1, 2] });
  });
});
