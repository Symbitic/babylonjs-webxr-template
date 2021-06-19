import CompressionWebpackPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

const {
  EnvironmentPlugin,
  HotModuleReplacementPlugin,
  NoEmitOnErrorsPlugin,
  ProvidePlugin
} = webpack;

const PORT = process.env.PORT || 8080;

export default function ({ production }) {
  const mode = production ? 'production' : 'development';
  const devtool = production ? false : 'inline-source-map';

  return {
    entry: path.resolve('src/index.ts'),
    target: 'web',
    mode,
    devtool,
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
      extensions: ['.ts', '.js']
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
          test: /\.(ico|png|jpg|jpeg|gif|webp|env|glb|stl)$/i,
          use: {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        }
      ]
    },
    performance: {
      hints: false
    },
    optimization: {
      minimize: production ? true : false
    },
    watchOptions: {
      aggregateTimeout: 300,
      poll: 300,
      ignored: /node_modules/
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'assets' }
        ]
      }),
      new NoEmitOnErrorsPlugin(),
      new EnvironmentPlugin({
        NODE_ENV: mode
      }),
      new ProvidePlugin({
        CANNON: 'cannon'
      }),
      new HtmlWebpackPlugin({
        title: 'WebXR Demo',
        template: path.resolve('public/index.html'),
        favicon: path.resolve('public/favicon.png')
      }),
      ...production ? [
        new CompressionWebpackPlugin()
      ] : [
        new HotModuleReplacementPlugin()
      ]
    ],
    devServer: {
      watchContentBase: true,
      open: true,
      quiet: true,
      port: PORT,
      publicPath: `http://localhost:${PORT}`,
      noInfo: true,
      compress: true,
      hot: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      disableHostCheck: true,
      stats: 'errors-only',
      watchOptions: {
        poll: 300
      },

      // enable to access from other devices on the network
      useLocalIp: true,
      host: '0.0.0.0',
      // host: '192.168.1.143',

      // if you aren’t using ngrok, and want to connect locally, webxr requires https
      // https: true,
    },
  };
};