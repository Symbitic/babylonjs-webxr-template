/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';

const { EnvironmentPlugin, HotModuleReplacementPlugin } = webpack;

// App directory
const appDirectory = fs.realpathSync(process.cwd());

const PORT = process.env.PORT || 8080;

export default {
  mode: 'development',

  /* Manage source maps generation process */
  //devtool: 'eval-source-map',
  devtool: 'inline-source-map',

  /* Development Server Configuration */
  devServer: {
    contentBase: path.resolve(appDirectory),
    watchContentBase: true,
    publicPath: '/',
    open: true,
    historyApiFallback: true,
    compress: true,
    overlay: true,
    hot: true,
    disableHostCheck: true,
    watchOptions: {
      poll: 300,
    },

    // enable to access from other devices on the network
    useLocalIp: true,
    host: '0.0.0.0',

    // if you aren’t using ngrok, and want to connect locally, webxr requires https
    // https: true,
  },

  watchOptions: {
    aggregateTimeout: 300,
    poll: 300,
    ignored: /node_modules/,
  },

  module: {
    rules: [
      {
        test: /global\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /^((?!global).)*\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { modules: true } }
        ]
      }
    ]
  },

  plugins: [
    new EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new HotModuleReplacementPlugin()
  ],
  devServer: {
    disableHostCheck : true,
    quiet: true,
    port: PORT,
    publicPath: `http://localhost:${PORT}`,
    compress: true,
    noInfo: true,
    stats: 'errors-only',
    inline: true,
    lazy: false,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
};
