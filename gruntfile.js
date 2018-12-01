/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

'use strict';

module.exports = function( grunt ) {
	var BUILDER_DIR = 'dev/builder',
		SDK_VERSION = grunt.option( 'sdk-version' ) || 'offline',
		CKE_VERSION = grunt.option( 'sdk-ckeditor-version' ) || 'master',
		webpackReactConf = require( './react/webpack.config.js' );

	grunt.loadNpmTasks( 'grunt-shell' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );
	grunt.loadNpmTasks( 'grunt-text-replace' );
	grunt.loadNpmTasks( 'grunt-mkdir' );
	grunt.loadNpmTasks( 'grunt-webpack' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );

	grunt.registerTask( 'default', 'build' );

	grunt.initConfig( {
		shell: {
			options: {
				stderr: true,
				stdout: true
			},

			'builder-setup': {
				command: [
					'git submodule update --init --recursive',
					'cd docs',
					'npm install',
					'cd ..',
					'cd ' + BUILDER_DIR,
					'npm install'
				].join( '&&' )
			},

			'sdk-build': {
				command: [
					'cd ' + BUILDER_DIR,
					[
						'node ./app.js',
						'--version=' + SDK_VERSION,
						grunt.option( 'sdk-dev' ) ? '--dev=true' : '',
						grunt.option( 'sdk-pack' ) ? '--pack=true' : '',
						grunt.option( 'sdk-verbose' ) ? '--verbose=true' : ''
					].join( ' ' )
				].join( '&&' )
			},

			'sdk-validatelinks': {
				command: [
					'cd ' + BUILDER_DIR,
					'./app.js validatelinks'
				].join( '&&' )
			},

			'sdk-update': {
				command: [
					// Update presets.
					'cd vendor/ckeditor-presets',
					'git checkout ' + CKE_VERSION,
					'git pull',
					'cd ../..',
					// Update docs.
					'cd docs',
					'git checkout ' + CKE_VERSION,
					'git pull',
					'cd ..',
					// Commit it.
					'git commit -a -m "Updated CKEditor presets and docs submodule HEADs."',
					'git submodule update --init --recursive'
				].join( '&&' )
			}
		},

		mkdir: {
			build: {
				options: {
					create: [ 'build' ]
				}
			}
		},

		compass: {
			'sdk-build-css': {
				options: {
					httpPath: '/',
					assetCacheBuster: false,
					relativeAssets: true,

					sassDir: 'template/theme/sass',
					cssDir: 'template/theme/css',
					imagesDir: 'template/theme/img',
					fontsDir: 'template/theme/fonts',

					outputStyle: 'compressed'
				}
			},
			'sdk-watch-css': {
				options: {
					httpPath: '/',
					assetCacheBuster: false,
					relativeAssets: true,

					watch: true,
					sourcemap: true,

					sassDir: 'template/theme/sass',
					cssDir: 'dev/ckeditor_sdk/theme/css',
					imagesDir: 'dev/ckeditor_sdk/theme/img',
					fontsDir: 'dev/ckeditor_sdk/theme/fonts',

					outputStyle: 'expanded'
				}
			}
		},

		webpack: {
			react: webpackReactConf( SDK_VERSION )
		}
	} );

	grunt.registerTask( 'update', [
		'shell:sdk-update'
	] );

	grunt.registerTask( 'setup', [
		'shell:builder-setup'
	] );

	grunt.registerTask( 'build', [
		'compass:sdk-build-css',
		'mkdir:build',
		'shell:sdk-build',
		'webpack:react'
	] );

	grunt.registerTask( 'watch-css', [
		'compass:sdk-watch-css'
	] );

	grunt.registerTask( 'validatelinks', [
		'shell:sdk-validatelinks'
	] );
};
