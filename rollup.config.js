import resolve from '@rollup/plugin-node-resolve';

export default {
  input: "index.js",
  output: {
    file: 'dist/spect.js',
    format: 'esm',
    sourcemap: true,
    compact: true
  },
  plugins: [resolve()]
};
