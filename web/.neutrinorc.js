const react = require('@neutrinojs/react');
const styleMinify = require('@neutrinojs/style-minify')
const GenerateHeaderFile = require("./util/generate-cpp-asset-index")
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  options: {
    root: __dirname,
  },
  use: [
    react({
      html: {
        title: 'E-Paper Display'
      },
      style: {
        test: /\.(css|scss)$/,
        loaders: ['sass-loader']
      },
      devServer: {
        historyApiFallback: {
          rewrites: [
            { from: /^\/app\/.*$/, to: '/index.html' }
          ]
        },
        proxy: {
          '/api': "http://10.133.8.108",
          '/socket': {
            target: "ws://10.133.8.108",
            ws: true
          }
        }
      }
    }),
    styleMinify,
    (neutrino) => neutrino.config
      .plugin('compress')
      .use(CompressionPlugin, [{
        test: /\.(js|css|html)$/,

        // should in practice be <1, but use a large number to force-compress all assets.
        minRatio: 10,

        threshold: 0,
      }])
      .after('optimize-css'),
    (neutrino) => neutrino.config
      .plugin('generate-header')
      .use(GenerateHeaderFile)
      .after('compress')
  ],
};
