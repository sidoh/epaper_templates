const path = require('path');

var HtmlWebpackPlugin = require('html-webpack-plugin')
  , HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
  , CompressionPlugin = require("compression-webpack-plugin")
  , GenerateHeaderFile = require('./util/generate-header')
  , webpack = require('webpack')
  ;

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index_bundle.js'
  },
  module: {
    rules: [
      { 
        test: /\.jsx?$/, 
        loader: 'babel-loader', 
        exclude: /node_modules/,
        query: {
          presets: ["es2016", "react"]
        }
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 50000,
          },
        }
      },
      {
        test: /\.less$/,
        loader: [ 'style-loader', 'css-loader', 'less-loader' ]
      },
      {
        test: /\.scss$/,
        use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      }
    ]
  },
  devServer: {
    contentBase: [
      path.resolve(__dirname, "dist"),
      path.resolve(__dirname, "public")
    ],
    historyApiFallback: {
      rewrites: [
        { from: /^\/templates$/, to: '/templates.json' },
        { 
          from: /^\/templates\/(.*)$/,
          to: context => (`/t/${context.match[1]}`)
        }
      ]
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new HtmlWebpackPlugin({
      title: 'E-Paper Display',
      template: 'src/index.html',
      inlineSource: '.(js|css)$' // embed all javascript and css inline
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new CompressionPlugin({
      include: /\.html$/
    }),
    new GenerateHeaderFile()
  ]
};