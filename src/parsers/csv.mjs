/**
 * @ignore
 * CSV parser, use [csv-parse](https://csv.js.org/parse/),
 * as it has many options.
 */

import merge from 'lodash/merge';
import parse from 'csv-parse/lib/sync';

export default (input, options = {}) => {
  options = merge({}, options, {
    cast: true,
    columns: true,
    trim: true
  });

  return parse(input, options);
};
