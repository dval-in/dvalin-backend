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
	}
};

export default config;
