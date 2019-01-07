/**
 * Test BasePackage class
 */

// Allow ESM support
require = require('esm')(module);

// Dependencies for testing.
// NOTE: there is a problem if you use the same require here and in the ESM module
const { removeSync } = require('fs-extra/lib/remove');
const { statSync, readFileSync } = require('fs-extra/lib/fs');
const jsonParse = require('json5/lib/parse');
const path = require('path');

// Get module
const BasePackage = require('../../src/packages/BasePackage.mjs').default;

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
    expect(b.cacheFiles).toHaveProperty('post-fetch');
    expect(b.cacheFiles).toHaveProperty('post-all');
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

describe('setCache method', () => {
  test('creates data files', () => {
    let b = new BasePackage({
      cachePath: defaultCachePath,
      id: 'test-set-cache-create-files'
    });
    b.data = {
      fetch: { thing: 1 },
      'post-fetch': { thing: 2 },
      'post-all': { thing: 3 }
    };

    ['fetch', 'post-fetch', 'post-all'].forEach((p, pi) => {
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
      'post-fetch': { thing: 2 },
      'post-all': { thing: 3 }
    };

    ['fetch', 'post-fetch', 'post-all'].forEach(p => {
      b.setCache(p);
    });

    expect(() => {
      statSync(b.cacheFiles.meta);
    }).not.toThrow();

    let m = jsonParse(readFileSync(b.cacheFiles.meta, 'utf-8'));
    expect(m).toHaveProperty('fetch');
    expect(m).toHaveProperty('post-fetch');
    expect(m).toHaveProperty('post-all');
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
  test('getCache gets fetch by default', () => {
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

  test('getCache gets post-fetch if provided', () => {
    let options = {
      cachePath: defaultCachePath,
      cachePoint: 'post-fetch',
      id: 'test-get-cache-post-fetch',
      ttl: 60 * 60 * 1000
    };

    let b = new BasePackage(options);
    b.data = {
      'post-fetch': { thing: 2 }
    };
    b.setCache('post-fetch');

    let c = new BasePackage(options);

    expect(c.data).toHaveProperty('post-fetch');
    expect(c.data['post-fetch']).toEqual({ thing: 2 });
  });
});
