import AirSupply from './src/AirSupply';

export default {
  AirSupply,
  // Create a wrapper function
  airSupply: options => {
    return new AirSupply(options);
  }
};
