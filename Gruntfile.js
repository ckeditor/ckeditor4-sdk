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
						'./app.js',
						'--version=' + ( grunt.option( 'sdk-version' ) || 'offline' ),
						grunt.option( 'sdk-pack' ) ? '--pack=true' : '',
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
					config: 'compass_config.rb'
				}
			},
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

	grunt.registerTask( 'build-css', [
		'compass:sdk-build-css',
	] );

	grunt.registerTask( 'validatelinks', [
		'shell:sdk-validatelinks'
	] );
};