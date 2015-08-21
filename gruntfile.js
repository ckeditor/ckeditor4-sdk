/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

'use strict';

module.exports = function( grunt ) {
	var BUILDER_DIR = 'dev/builder',
		CKEDITOR_VERSION = '4.0.0';

	grunt.loadNpmTasks( 'grunt-shell' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );
	grunt.loadNpmTasks( 'grunt-text-replace' );

	grunt.registerTask( 'default', 'build' );

	grunt.initConfig( {
		shell: {
			options: {
				stderr: true,
				stdout: true
			},

			'builder-setup': {
				command: [
					'cd ' + BUILDER_DIR,
					'npm install'
				].join( '&&' )
			},

			'builder-cleanup': {
				command: [
					'cd ' + BUILDER_DIR,
					'rm -rf node_modules'
				].join( '&&' )
			},

			'sdk-build': {
				command: [
					'cd ' + BUILDER_DIR,
					[
						'node ./app.js',
						'--version=' + ( grunt.option( 'sdk-version' ) || 'offline' ),
						grunt.option( 'sdk-dev' ) ? '--dev=true' : '',
						grunt.option( 'sdk-pack' ) ? '--pack=true' : '',
						grunt.option( 'sdk-verbose' ) ? '--verbose=true' : ''
					].join( ' ' )
				].join( '&&' )
			},

			'sdk-validatelinks': {
				command: [
					'cd ' + BUILDER_DIR,
					'./app.js' + ' validatelinks'
				].join( '&&' )
			},

			'sdk-update': {
				command: [
					'cd vendor/ckeditor-presets',
					'git checkout ' + ( grunt.option( 'sdk-submodule-version' ) || 'master' ),
					'git describe --tags HEAD',
					'cd ../..',
					'git submodule update --init --recursive'
				].join( '&&' ),
				options: {
					callback: function ( err, stdout, stderr, cb ) {
						CKEDITOR_VERSION =  stdout.match( /\d\.\d\.\d/ )[0] || CKEDITOR_VERSION;
						cb();
					}
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

		replace: {
			simplesample: {
				src: [ 'samples/assets/simplesample.js' ],
				dest: 'samples/assets/',
				replacements: [ {
					from: /cdn\.ckeditor\.com\/\d\.\d\.\d\/standard\-all\//,
					to: function() {
						return 'cdn.ckeditor.com/' + CKEDITOR_VERSION + '/standard-all/';
					}
				} ]
			}
		}
	} );

	grunt.registerTask( 'update', [
		'shell:sdk-update',
		'replace:simplesample'
	] );

	grunt.registerTask( 'setup', [
		'shell:builder-cleanup',
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
};