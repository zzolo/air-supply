/**
 * Main AirSupply class
 */

// Dependencies
import merge from 'lodash/merge';
import { join } from 'path';

// AirSupply class
class AirSupply {
  constructor(options = {}) {
    this.options = merge(
      {
        ttl: 60,
        cachePath: join(process.cwd(), '.air-supply')
      },
      options
    );
  }
}

// Export
export default AirSupply;
