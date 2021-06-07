/* eslint-disable import/no-extraneous-dependencies */
import TerserPlugin from 'terser-webpack-plugin';
import CompressionWebpackPlugin from 'compression-webpack-plugin';
import webpack from 'webpack';

const { EnvironmentPlugin } = webpack;

export default {
  mode: 'production',

  /* Manage source maps generation process. Refer to https://webpack.js.org/configuration/devtool/#production */
  devtool: false,
  //devtool: 'source-maps',

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        //cache: true
      })
    ]
    //usedExports: true,
  },

  /*
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  */

  /* Additional plugins configuration */
  plugins: [
    new EnvironmentPlugin({
      NODE_ENV: 'production'
    }),
    new CompressionWebpackPlugin()
  ],
};
