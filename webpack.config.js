module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    path: 'lib/',
    filename: 'index.js',
    library: 'redux-action-tools',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }]
  }
};
