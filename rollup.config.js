import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'index.mjs',
  output: {
    file: 'dist/air-supply.js',
    format: 'cjs'
  },
  plugins: [
    commonjs({
      exclude: ['node_modules/**'],
      ignoreGlobal: false,
      sourceMap: true
    })
  ]
};
