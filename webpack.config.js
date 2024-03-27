const path = require('path');

module.exports = {
    entry: './src/index.ts',
    mode: process.env.NODE_ENV || 'production',
    target: 'node',
    output: {
        filename: 'index.js'
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            { test: /\.ts$/, use: [ 'ts-loader'] }
        ]
    },
};