/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

'use strict';

module.exports = function( grunt ) {
	var BUILDER_DIR = 'dev/builder',
		SDK_VERSION = grunt.option( 'sdk-version' ) || 'offline',
		CKE_VERSION = grunt.option( 'sdk-ckeditor-version' ) || 'master';

	grunt.loadNpmTasks( 'grunt-shell' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );

	grunt.registerTask( 'default', 'build' );

	var ignoreFiles = [
		'build/**',
		'vendor/**',
		'node_modules/**',
		'docs/**',
		'dev/builder/node_modules/**'
	];

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
					'mkdir -p build',
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

		jshint: {
			options: {
				ignores: ignoreFiles
			}
		},

		jscs: {
			options: {
				excludeFiles: ignoreFiles
			}
		},
	} );

	grunt.registerTask( 'update', [
		'shell:sdk-update'
	] );

	grunt.registerTask( 'setup', [
		'shell:builder-setup'
	] );

	grunt.registerTask( 'build', [
		'compass:sdk-build-css',
		'shell:sdk-build'
	] );

	grunt.registerTask( 'watch-css', [
		'compass:sdk-watch-css'
	] );

	grunt.registerTask( 'validatelinks', [
		'shell:sdk-validatelinks'
	] );

	grunt.loadTasks( 'dev/tasks' );
};
