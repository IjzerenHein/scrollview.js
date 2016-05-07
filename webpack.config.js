/*global module process*/
var isDemo = process.argv.join('').indexOf('demo') > -1;
var minify = process.argv.join('').indexOf('minimize') > -1;

var babelJSLoader = {
	test: /\.js$/,
	exclude: /node_modules/,
	loader: 'babel',
	query: {
		presets: ['react-native']
	}
};

var libConfig = {
	entry: './src/index.js',
	output: {
		path: './dist/',
		filename: minify ? 'scrollview.min.js' : 'scrollview.js',
		library: ['scrollview'],
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		loaders: [
			babelJSLoader
		]
	}
};

var demoConfig = {
	entry: './demo/index.js',
	output: {
		path: './www/',
		filename: 'index.js'
	},
	devServer: {
		inline: true,
		port: 8080
	},
	module: {
		loaders: [
			babelJSLoader,
			{test: /\.css$/, loader: 'style!css-loader'},
			{test: /\.(jpe?g|png|gif)$/, loader: 'url?name=[path][name].[ext]'}
		]
	}
};

module.exports = isDemo ? demoConfig : libConfig;