/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin, NormalModuleReplacementPlugin } = require('webpack');
const HookShellScriptPlugin = require('hook-shell-script-webpack-plugin');

const shimJS = path.resolve(__dirname, 'src', 'empty.js');
function shim(regExp) {
  return new NormalModuleReplacementPlugin(regExp, shimJS);
}

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    usedExports: true,
  },
  entry: {
    app: './src/index.ts',
  },
  plugins: [
    shim(/\.(svg|ttf|eot|woff2|woff)/),
    new DefinePlugin({ 'process.env': {} }),
    new webpack.ProvidePlugin({
      currentScript: 'current-script-polyfill',
    }),
    new HookShellScriptPlugin({
      afterEmit: ['node bin/stubContentsApi.js'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '../pypi/*.whl',
          to: 'pypi',
          context: path.dirname(require.resolve('@jupyterlite/pyodide-kernel')),
        },
      ],
    }),
  ],
  output: {
    filename: 'thebe-lite.min.js',
    path: path.resolve(__dirname, 'dist', 'lib'),
    publicPath: 'auto',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /pypi\/.*/,
        type: 'asset/resource',
        generator: {
          filename: 'pypi/[name][ext][query]',
        },
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
