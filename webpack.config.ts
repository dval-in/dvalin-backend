import webpack from 'webpack';

const config: webpack.Configuration = {
	entry: './src/main.ts',
	mode: 'production',
	target: 'node',
	output: {
		filename: 'main.js'
	},

	resolve: {
		extensions: ['.ts', '.js']
	},

	module: {
		rules: [{ test: /\.ts$/, use: ['ts-loader'] }]
	},
	node: {
		__dirname: true
	}
};

export default config;
