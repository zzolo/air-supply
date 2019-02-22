/**
 * Test BasePackage class
 */

// Dependencies for testing.
const { statSync, readFileSync, existsSync, removeSync } = require('fs-extra');
const jsonParse = require('json5/lib/parse');
const path = require('path');

// Get module
const BasePackage = require('../../src/packages/BasePackage');
const parserMethods = require('../../src/parsers/default-parsers');

// Default cache path
const defaultCachePath = path.join(
  __dirname,
  './.test-base-package-air-supply-cache'
);

// After all are done, remove directory
afterAll(() => {
  removeSync(defaultCachePath);
});

// AirSupply
describe('BasePackage class', () => {
  test('can instantiate', () => {
    expect(() => {
      new BasePackage({
        cachePath: defaultCachePath
      });
    }).not.toThrow();
  });

  test('creates id', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath
    });
    expect(b.id).toBeTruthy();
  });

  test('can provide id', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      id: 'test-custom-id'
    });
    expect(b.id).toBe('test-custom-id');
  });

  test('sets up cache', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath
    });
    expect(b.cacheFiles).toHaveProperty('fetch');
    expect(b.cacheFiles).toHaveProperty('transform');
    expect(b.cacheFiles).toHaveProperty('bundle');
  });

  test('creates cache directory', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath
    });
    expect(() => {
      statSync(b.cachePath);
    }).not.toThrow();
  });
});

describe('parse method', () => {
  test('returns blank when empty', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath
    });

    expect(b.parse(null)).toBe(undefined);
  });

  test('handle parser function', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath
    });

    expect(b.parse('a', { parser: a => a + 'a' })).toBe('aa');
  });

  test('handle match', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      parserMethods
    });

    expect(b.parse('{ a: 1 }', { source: 'file.json' })).toEqual({ a: 1 });
  });

  test('multi parse', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      parserMethods
    });

    expect(
      b.parse('{ a: 1 }', [{ parser: () => 'a' }, { parser: () => 'b' }])
    ).toEqual('b');
  });

  test('specific parser', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      parserMethods
    });

    expect(b.parse('{ a: 1 }', 'json')).toEqual({ a: 1 });
  });

  test('mixed', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      parserMethods
    });

    expect(
      b.parse('{ a: 1 }', [
        'json',
        undefined,
        {
          parser: a => {
            a.a = 3;
            return a;
          }
        }
      ])
    ).toEqual({ a: 3 });
  });

  test('multiSource', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      parserMethods
    });

    expect(
      b.parse(
        {
          'file.json': '{ a: 1 }',
          csv: 'a,b\n1,2'
        },
        {
          multiSource: true
        }
      )
    ).toEqual({ 'file.json': { a: 1 }, csv: [{ a: 1, b: 2 }] });
  });
});

describe('setCache method', () => {
  test('creates data files', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      id: 'test-set-cache-create-files'
    });
    b.data = {
      fetch: { thing: 1 },
      transform: { thing: 2 },
      bundle: { thing: 3 }
    };

    ['fetch', 'transform', 'bundle'].forEach((p, pi) => {
      b.setCache(p);
      expect(() => {
        statSync(b.cacheFiles[p]);
      }).not.toThrow();
      expect(jsonParse(readFileSync(b.cacheFiles[p], 'utf-8'))).toEqual({
        thing: pi + 1
      });
    });
  });

  test('creates meta file', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      id: 'test-set-cache-create-meta'
    });
    b.data = {
      fetch: { thing: 1 },
      transform: { thing: 2 },
      bundle: { thing: 3 }
    };

    ['fetch', 'transform', 'bundle'].forEach(p => {
      b.setCache(p);
    });

    expect(() => {
      statSync(b.cacheFiles.meta);
    }).not.toThrow();

    let m = jsonParse(readFileSync(b.cacheFiles.meta, 'utf-8'));
    expect(m).toHaveProperty('fetch');
    expect(m).toHaveProperty('transform');
    expect(m).toHaveProperty('bundle');
    expect(m.fetch.format).toBe('json');
  });
});

describe('removeCache method', () => {
  test('removes files', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      id: 'test-remove-cache-removes-files'
    });
    b.data = {
      fetch: { thing: 1 }
    };
    b.setCache('fetch');

    expect(() => {
      b.removeCache();
    }).not.toThrow();

    expect(() => {
      statSync(b.cacheFiles.fetch);
    }).toThrow();
  });
});

describe('getCache method', () => {
  test('gets fetch by default', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-get-cache-fetch',
      ttl: 60 * 60 * 1000
    };

    let b = new BasePackage(options);
    b.data = {
      fetch: { thing: 1 }
    };
    b.setCache('fetch');

    let c = new BasePackage(options);

    expect(c.data).toHaveProperty('fetch');
    expect(c.data.fetch).toEqual({ thing: 1 });
  });

  test('gets transform if provided', () => {
    let options = {
      cachePath: defaultCachePath,
      cachePoint: 'transform',
      id: 'test-get-cache-transform',
      ttl: 60 * 60 * 1000
    };

    let b = new BasePackage(options);
    b.data = {
      transform: { thing: 2 }
    };
    b.setCache('transform');

    let c = new BasePackage(options);

    expect(c.data).toHaveProperty('transform');
    expect(c.data['transform']).toEqual({ thing: 2 });
  });
});

// TODO
// describe('cachedFetch method', () => {
//   test('should throw', async () => {
//     let options = {
//       cachePath: defaultCachePath,
//       id: 'test-cached-fetch'
//     };

//     let b = new BasePackage(options);
//     expect(async () => {
//       await b.cachedFetch();
//     }).toThrow();
//   });
// });

describe('transform method', () => {
  test('should not change fetch', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-transform-co-change'
    };

    let b = new BasePackage(options);
    b.data.fetch = { thing: 1 };
    b.transform();
    expect(b.data.fetch).toEqual({ thing: 1 });
  });

  test('should not have transform', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-no-transform-no-post'
    };

    let b = new BasePackage(options);
    b.data.fetch = { thing: 1 };
    b.transform();
    expect(b.data['transform']).toEqual(undefined);
  });

  test('should update data', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-no-transform-update',
      transform: () => {
        return { thing: 2 };
      }
    };

    let b = new BasePackage(options);
    b.data.fetch = { thing: 1 };
    b.transform();
    expect(b.data.fetch).toEqual({ thing: 1 });
    expect(b.data['transform']).toEqual({ thing: 2 });
  });

  test('should throw if no transform provided and cachePoint set', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-no-transform-no-transform',
      cachePoint: 'transform'
    };

    let b = new BasePackage(options);
    b.data.fetch = { thing: 1 };
    expect(() => {
      b.transform();
    }).toThrow();
  });
});

describe('output method', () => {
  const testOutputFile = path.join(__dirname, 'output.test-file');

  afterEach(() => {
    removeSync(testOutputFile);
  });

  test('should save output locally', () => {
    let options = {
      cachePath: defaultCachePath,
      id: 'test-local-output',
      output: testOutputFile
    };

    let b = new BasePackage(options);
    b.data.fetch = { thing: 1 };
    b.output();
    expect(existsSync(testOutputFile)).toBeTruthy();
    expect(JSON.parse(readFileSync(testOutputFile, 'utf-8'))).toEqual({
      thing: 1
    });
  });
});
