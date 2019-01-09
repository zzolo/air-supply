/**
 * @ignore
 * Main module entry point that provides the AirSupply class and
 * factory function.
 *
 * @example
 * const { AirSupply } = require('air-supply');
 *
 * @example
 * // Assuming native NodeJS support
 * import { AirSupply, airSupply } from 'air-supply/index';
 *
 * @module air-supply
 */

import AirSupply from './src/AirSupply';

// Exports
export default {
  AirSupply,
  // Create a wrapper function
  airSupply: options => {
    return new AirSupply(options);
  }
};
