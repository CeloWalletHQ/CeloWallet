const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const common = require('./common');
const config = require('./config');

const HTTP_PORT = 5000;
const IS_ELECTRON = !!process.env.BUILD_ELECTRON;

module.exports =  merge.smart(common, {
  mode: 'development',

  devtool: 'cheap-module-eval-source-map',

  devServer: {
    historyApiFallback: true,
    progress: false,
    hot: true,
    https: !IS_ELECTRON,
    port: HTTP_PORT,
    clientLogLevel: 'warning', // Silence [WDS] && [HMR] output in console
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    },
    stats: 'errors-only'
  },

  output: {
    filename: '[name].js'
  },

  resolve: {
    alias: { 'react-dom': '@hot-loader/react-dom' }
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: [
          path.join(config.path.src, 'vendor'),
          path.join(config.path.root, 'node_modules/typeface-lato'),
          path.join(config.path.root, 'node_modules/rc-steps')
        ]
      },

      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              prependData: `$is-electron: ${IS_ELECTRON};`
            }
          }
        ]
      }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    child_process: 'empty'
  },

  plugins: [
    new FriendlyErrorsPlugin({
      clearConsole: false
    }),

    new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),

    new webpack.HotModuleReplacementPlugin(),

    // Analyse webpack bundle. Available at: http://localhost:8888
    // https://www.npmjs.com/package/webpack-bundle-analyzer
    new BundleAnalyzerPlugin({ openAnalyzer: false })
  ],

  performance: {
    hints: false
  }
});
