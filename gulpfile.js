var gulp = require('gulp');
var rollup = require('rollup-stream');

var	path = require("path");

var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');
var replace = require('rollup-plugin-replace');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var babel = require('rollup-plugin-babel');

var baseLibraryDir = 'build/baseLibrary/';
var talentCoreDir = 'build/talentCore/';

var includePaths = require('rollup-plugin-includepaths');
var inject = require('rollup-plugin-inject');

var alias = require('rollup-plugin-alias');

var ignore = require('rollup-plugin-ignore');

var defOptions = function(opts) {

	var plugins = [
		includePaths({
			// include: {
			// 	react: './build/baseLibrary/react.js',
			// 	redux: './build/baseLibrary/redux.js'
			// },
			external: [
				// path.resolve('./build/baseLibrary/react.js'),
				// path.resolve('./build/baseLibrary/redux.js')

				// path.resolve('./node_modules/react/lib/React.js'),
				path.resolve('./node_modules/react/react.js'),
				path.resolve('./node_modules/redux/lib/index.js'),
				path.resolve('./node_modules/object-assign/index.js'),
				path.resolve('./node_modules/react/node_modules/object-assign/index.js'),
				path.resolve('./node_modules/invariant/invariant.js'),
				path.resolve('./node_modules/hoist-non-react-statics/index.js'),
				path.resolve('./node_modules/lodash/isPlainObject.js'),
				path.resolve('./node_modules/symbol-observable/index.js'),
			]
		}),
		// alias({
		// 	'react': path.resolve('./build/baseLibrary/react.js'),
		// 	'redux': path.resolve('./build/baseLibrary/redux.js')
		// }),
		nodeResolve({ jsnext: false, main: true, browser: true }),
		commonjs(),
		replace({
		  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
		})
	];
	
	if(opts.plugins) for(var i=0; i<opts.plugins.length; i++) plugins.push(opts.plugins[i]);
	
	var config = {
		entry: opts.entry,
		format: 'es',
		plugins: plugins
	}

	return config;
}

gulp.task('react', function() {
	return rollup(defOptions({
       entry: './node_modules/react/react.js'
    }))
    .pipe(source('react.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('redux', function() {
	return rollup(defOptions({
      entry: 'node_modules/redux/lib/index.js'
    }))
    .pipe(source('redux.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('reactDom', function() {
	return rollup(defOptions({
      entry: 'node_modules/react-dom/index.js'
    }))
    .pipe(source('react-dom.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('reactAddonsCssTransitionGroup', function() {
	return rollup(defOptions({
      entry: 'node_modules/react-addons-css-transition-group/index.js'
    }))
    .pipe(source('react-addons-css-transition-group.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('immutable', function() {
	return rollup(defOptions({
      entry: 'node_modules/immutable/dist/immutable.js'
    }))
    .pipe(source('immutable.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('reactRouter', function() {
	return rollup(defOptions({
      	entry: 'node_modules/react-router/lib/index.js',
    }))
    .pipe(source('react-router.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('reactRedux', function() {
	return rollup(defOptions({
      entry: 'node_modules/react-redux/lib/index.js'
    }))
    .pipe(source('react-redux.js'))
    .pipe(gulp.dest(baseLibraryDir));
});

gulp.task('baseLibrary', [
	'react',
	'redux',
	'reactDom',
	// 'reactAddonsCssTransitionGroup',
	// 'immutable',
	'reactRouter',
	'reactRedux'
]);


// gulp.start('reactRedux')