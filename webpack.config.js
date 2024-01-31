const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',

    entry: './src/js/default.js',

    devtool: 'inline-source-map',

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, 
    },
    resolve: {
        fallback: {
            "util": false,
            "net": false,
            "tls": false,
            "url": false,
            "assert": false,
            "path": false,
            "fs": false,
            "http": false,
            "https": false,
            "stream": false,
            "zlib": false,
            "os": false,
            "child_process": false,
            "buffer": false
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(ttf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[hash][ext][query]'
                }
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html' 
        }),
    ],

    devServer: {
        static: './dist',
    },
};