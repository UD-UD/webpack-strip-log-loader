const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
var WebpackStrip = require('strip-loader');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'node',
  entry: {
    "index": './src/index.ts',
    "index.min": './src/index.ts',
  },
  output: {
    filename: 'dist/[name].js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /(\.jsx?)|(\.tsx?)$/, loader: WebpackStrip.loader('debug', 'console.log') },
      { test: /\.js$/, loader: 'babel-loader' },
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'babel-loader!ts-loader' },
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'demo/index.html', to: 'dist/' }
    ])
  ],
  watchOptions: {
    poll: true
  }
}