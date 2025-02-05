var HTMLWebpackPlugin = require('html-webpack-plugin');
// var NpmInstallPlugin = require('npm-install-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
    javascript: './src/index.js',
    // html: './src/index.html'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
    publicPath: '/paideia/static/react-source/dist/'
    // publicPath: '/'
  },
  mode: 'development',
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {test: /\.(png|jpg|gif|svg)$/,
       use: [{loader: 'file-loader', options: {outputPath: 'images'}}],
      },
      {test: /\.(eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?$/,
       use: [{loader: 'file-loader',
              options: {outputPath: 'fonts',
                        name: '[name].[ext]'}
            }],
      },
      {test: /\.(js|jsx)$/, exclude: /node_modules/,
       use: [
         {loader: 'babel-loader',
          options: {presets: ['@babel/react']}
          }
       ]
      },
      {test: /\.css$/, use: ['style-loader', 'css-loader']},
      {test: /\.scss$/,
       use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      // { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  resolve: {extensions: ['.js', '.jsx']},
  // node: {
  //   fs: 'empty',
  //   console: true,
  //   net: 'empty',
  //   tls: 'empty'
  // },
  devServer: {
    historyApiFallback: true,
    // contentBase: './'
  },
  plugins: [
    new HTMLWebpackPlugin({
        template: "./src/index.html",
        filename: "./index.html"
    }),
  ]
  // watch: true
}
