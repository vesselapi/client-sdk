import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';

const EXTENSIONS = ['.ts', '.js'];

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.js', format: 'cjs' },
      { file: 'dist/index.esm.js', format: 'es' },
    ],
    plugins: [
      ts(),
      resolve({
        extensions: EXTENSIONS,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: EXTENSIONS,
      }),
      terser(),
    ],
  },
  // UMD build
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'VesselSDK',
        file: 'dist/index.umd.js',
        format: 'umd',
      },
    ],
    plugins: [
      ts(),
      resolve({
        extensions: EXTENSIONS,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: EXTENSIONS,
      }),
      terser(),
    ],
  },
];
