module.exports = {
    entry: './src/main.ts',
    mode: process.env.NODE_ENV || 'production',
    target: 'node',
    output: {
        filename: 'main.js'
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