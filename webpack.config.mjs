import CopyWebpackPlugin from 'copy-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

const { NoEmitOnErrorsPlugin, ProvidePlugin } = webpack;

import development from './webpack.development.mjs';
import production from './webpack.production.mjs';

const config = {
  entry: path.resolve('src/index.ts'),
  target: 'web',
  stats: 'errors-only',
  bail: true,
  output: {
    crossOriginLoading: 'anonymous',
    filename: '[name].js',
    path: path.resolve('dist'),
    sourceMapFilename: '[file].map',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream'
          }
        }
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: 'file-loader'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml'
          }
        }
      },
      {
        test: /\.(ico|png|jpg|jpeg|gif|webp|env|glb|stl)$/i,
        use: [{
            loader: 'url-loader',
            options: {
                limit: 8192,
            },
        }, ],
      },
      {
        test: /\.pug$/,
        use: 'pug-loader'
      }
    ]
  },
  performance: {
    hints: false
  },
  plugins: [
    new FriendlyErrorsWebpackPlugin({
      clearConsole: false
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets' }
      ]
    }),
    new NoEmitOnErrorsPlugin(),
    new ProvidePlugin({
      CANNON: 'cannon'
    }),
    new HtmlWebpackPlugin({
      title: 'WebXR Demo',
      template: path.resolve('public/index.pug'),
      // favicon: path.resolve(environment.paths.source, 'images', 'favicon.ico'),
    }),
  ]
};

export default function (env) {
  if (env.production) {
    return merge(config, production);
  } else if (env.development) {
    return merge(config, development);
  } else {
    throw new Error('Unrecognized environment');
  }
};
