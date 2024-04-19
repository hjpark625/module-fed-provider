const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ModuleFederationPlugin } = require('webpack').container
const TerserPlugin = require('terser-webpack-plugin')
const deps = require('./package.json').dependencies
const path = require('path')

module.exports = (env, args) => {
  const isProduction = args.mode === 'production'
  return {
    mode: args.mode,
    entry: './src/index.ts',
    output: {
      publicPath: 'auto',
      filename: 'static/js/[name].[contenthash:8].js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        filename: 'index.html'
      }),
      new ModuleFederationPlugin({
        name: 'provider',
        filename: 'remoteEntry.js',
        exposes: {
          './Button': path.resolve(__dirname, 'src/components/Button')
        },
        shared: {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom']
          }
        }
      }),
      isProduction ? new MiniCssExtractPlugin({ filename: 'static/css/[name].[contenthash:8].css' }) : undefined
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            },
            output: {
              comments: !isProduction
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'async', // Provider에서 all로 설정하면 consumer에서 remoteEntry.js를 찾지 못하는 에러 표출
        minSize: 20000, // 최소 20KB가 넘는 모듈만 분리
        minChunks: 1, // 모듈이 최소 1개의 청크에서 사용될 때 분리
        maxAsyncRequests: 30, // 비동기 요청 청크 최대 수
        maxInitialRequests: 30, // 초기 로딩 청크 최대 수
        automaticNameDelimiter: '~', // 이름 구분자
        cacheGroups: {
          defaultVendors: {
            test: /[\\/\]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true // 이미 분리된 청크 재사용 여부
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript'
              ]
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'postcss-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, '/src')
      }
    },
    devServer: {
      port: 3000,
      hot: true,
      open: false,
      compress: true,
      historyApiFallback: true, // SPA 라우팅 지원을 위한 설정
      static: {
        directory: path.resolve(__dirname, 'dist')
      }
    }
  }
}
