/**
 * @ignore
 * TopoJSON parser, uses [topojson](https://github.com/topojson/topojson).
 */

const isString = require('lodash/isString');
const merge = require('lodash/merge');
const topojson = require('topojson');

/**
 * Converts GeoJSON to TopoJSON.  Uses [topojson](https://github.com/topojson/topojson) module.
 *
 * @name topojson
 * @export
 *
 * @param {Object|String|Buffer!} input Geojson input.
 * @param {Object} [options] Options to pass to the parser
 * @param {String} [options.name='geojson'] Name/key for the geojson data.  This
 *   is the key to refer to when access the topology, like `topojson.objects.KEY`.
 * @param {Number} [options.quantization=100000] Quantization value.  See
 *   [topojson.quantize](https://github.com/topojson/topojson-client/blob/master/README.md#quantize).
 *   Use `false` to not do quantization.
 * @param {Number} [options.simplifyQuantile=0.85] Will simplofy the topojson based on
 *  [topojson.quantile](https://github.com/topojson/topojson-simplify/blob/master/README.md#quantile).
 *   Should be a number between 0 and 1 that represents quantile of weighted points.  So, 1 would be
 *   no simplification (keeping 100%), while 0 is complete simplification (keeping 0% detail).
 *   Use instead of `options.simplify`.  Use `false` to do not do simplification.
 * @param {Number} [options.simplify] If provided, will pass
 *   topology to [topojson.simplify](https://github.com/topojson/topojson-simplify#simplify).
 *   Should be a minimum number value, depends on the values, but something like
 *   0.01 will really simplify the topology, while something like 0.00000000001 will
 *   not simplify it much.  Use instead of `options.simplifyQuantile`.
 *
 * @return {Object} Parsed data.
 */
module.exports = (input, options = {}) => {
  options = merge(
    {},
    {
      name: 'geojson',
      quantization: 100000,
      simplifyQuantile: 0.85
    },
    options
  );

  // Support multiple inputs
  input = Buffer.isBuffer(input)
    ? JSON.parse(input.toString('utf-8'))
    : isString(input)
      ? JSON.parse(input)
      : input;

  // Turn to topojson
  let objects = {
    [options.name]: input
  };
  let t = topojson.topology(objects);

  // Simplify
  if (options.simplifyQuantile) {
    t = topojson.presimplify(t);
    let weight = topojson.quantile(t, options.simplifyQuantile);
    t = topojson.simplify(t, weight);
  }
  else if (options.simplify) {
    t = topojson.presimplify(t);
    t = topojson.simplify(t, options.simplify);
  }

  // Quantization
  if (options.quantization) {
    t = topojson.quantize(t, options.quantization);
  }

  return t;
};
