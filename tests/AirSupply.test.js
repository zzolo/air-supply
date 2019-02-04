/**
 * Test core AirSupply class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing
// NOTE: there is a problem if you use the same require here and in the ESM module
const path = require('path');

// Get module
const { AirSupply, airSupply } = require('../index.mjs').default;

// AirSupply
describe('AirSupply class', () => {
  test('can instantiate without options', () => {
    expect(() => {
      new AirSupply({});
    }).not.toThrow();
  });

  test('can override defaults', () => {
    let a = new AirSupply({ ttl: 100 });
    expect(a.options.ttl).toBe(100);
  });
});

// airSupply
describe('airSupply function', () => {
  test('can run without options', () => {
    expect(() => {
      airSupply({});
    }).not.toThrow();
  });

  test('can override defaults', () => {
    let a = airSupply({ ttl: 100 });
    expect(a.options.ttl).toBe(100);
  });
});

// Guess types
describe('guessPackageType method', () => {
  let a = airSupply({});

  test('throws on function', () => {
    expect(() => {
      a.guessPackageType({
        source: () => {
          return 1;
        }
      });
    }).toThrow();
  });

  test('guesses data', () => {
    expect(a.guessPackageType({ source: 0 })).toMatchObject({
      type: 'data'
    });
    expect(a.guessPackageType({ source: 1 })).toMatchObject({
      type: 'data'
    });
    expect(a.guessPackageType({ source: null })).toMatchObject({
      type: 'data'
    });
    expect(a.guessPackageType({ source: [1, 2] })).toMatchObject({
      type: 'data'
    });
    expect(a.guessPackageType({ source: { a: 1 } })).toMatchObject({
      type: 'data'
    });
  });

  test('guesses valid files', () => {
    expect(
      a.guessPackageType({
        source: path.join(__dirname, './AirSupply.test.js')
      })
    ).toMatchObject({
      type: 'file'
    });
  });

  test('guesses HTTP URL', () => {
    expect(
      a.guessPackageType({ source: 'http://example.com/path' })
    ).toMatchObject({
      type: 'remote-http'
    });
  });

  test('guesses FTP URL', () => {
    expect(
      a.guessPackageType({ source: 'ftp://example.com/path' })
    ).toMatchObject({
      type: 'remote-ftp'
    });
  });

  test('throws on invalid file path', () => {
    expect(() => {
      a.guessPackageType({
        source: '/should-not-exist-file-path'
      });
    }).toThrow();
  });
});
