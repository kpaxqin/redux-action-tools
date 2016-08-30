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
