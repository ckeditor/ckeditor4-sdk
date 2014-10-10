'use strict';

module.exports = function( grunt ) {
	var BUILDER_DIR = 'dev/builder';

	grunt.loadNpmTasks( 'grunt-shell' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );

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
					cssDir: 'dev/release/theme/css',
					imagesDir: 'dev/release/theme/img',
					fontsDir: 'dev/release/theme/fonts',

					outputStyle: 'expanded'
				}
			}
		}
	} );

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