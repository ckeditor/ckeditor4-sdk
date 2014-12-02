/* jshint node: true */

var Path = require( '../lib/Path' ),
	_ = require( 'lodash-node' ),
	path = require( 'path' ),
	ncp = require( 'ncp' ),
	nodefn = require( 'when/node' ),
	call = nodefn.call,

	// @TODO: copy paste.
	PATHS = {
		SAMPLES: '../../samples',
		RELEASE: '../ckeditor_sdk',
		BASE: path.resolve( '../..' ),
		MATHJAX: path.resolve( path.resolve( '../..' ) + '/vendor/mathjax' )
	};

var copy = {};

copy.BLACKLISTS = {
	TEMPLATE: {
		common: [
			'template/theme/sass'
		],
		online: [
			'template/theme/fonts',
			'template/theme/css/fonts.css',
			'template/robots.txt'
		]
	}
};

copy.prepareBlacklist = function( list, version ) {
	var blacklist = ( list.common ? list.common.slice() : [] );

	if ( version === 'offline' ) {
		blacklist = blacklist.concat( list.offline ? list.offline : [] );
	}

	if ( version === 'online' ) {
		blacklist = blacklist.concat( list.online ? list.online : [] );
	}

	return blacklist;
};

// return function, option.filter of ncp.
copy.createNcpBlacklistFilter = function( blacklist ) {
	return function( name ) {
		var currPath = new Path( name );

		return !_.some( blacklist, function( path ) {
			var match = currPath.matchLeft( new Path( path ) );

			return match;
		} );
	};
};


copy.curryCopy = function( list, source, destination, message ) {
	return function( PATHS, version ) {
		console.log( message );

		var blacklist = copy.prepareBlacklist( list, version ),
			options = {
				filter: copy.createNcpBlacklistFilter( blacklist )
			};

		return call( ncp, source, destination, options );
	};
};

copy.copyTemplate = copy.curryCopy( copy.BLACKLISTS.TEMPLATE, '../../template', PATHS.RELEASE, 'Copying template files' );

module.exports = copy;