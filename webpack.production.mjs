/* eslint-disable import/no-extraneous-dependencies */
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CompressionWebpackPlugin from 'compression-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
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
      }),
      new CssMinimizerPlugin(),
    ],
    //usedExports: true,
  },

  /*
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  */

  module: {
    rules: [
      {
        test: /global\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /^((?!global).)*\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { modules: true } }
        ]
      },
    ]
  },

  /* Additional plugins configuration */
  plugins: [
    new EnvironmentPlugin({
      NODE_ENV: 'production'
    }),
    new CompressionWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
  ],
};
