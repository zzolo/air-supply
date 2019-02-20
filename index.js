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

const AirSupply = require('./src/AirSupply');

// Exports
module.exports = {
  AirSupply,
  // Create a wrapper function
  airSupply: options => {
    return new AirSupply(options);
  }
};
