import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';

import pkg from './package.json' assert { type: 'json' };

const EXTENSIONS = ['.ts', '.js'];

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
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
        file: pkg.browser,
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
