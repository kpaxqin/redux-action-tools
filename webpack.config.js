/**
 * Created by jwqin on 11/15/15.
 */

module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    path: 'lib/',
    filename: 'index.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }]
  }
};
