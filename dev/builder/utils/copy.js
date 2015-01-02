/* jshint node: true */

var Path = require( '../lib/Path' ),
	_ = require( 'lodash-node' ),
	path = require( 'path' ),
	ncp = require( 'ncp' ),
	fs = require( 'fs' ),
	nodefn = require( 'when/node' ),
	call = nodefn.call,

	// @TODO: This code is copy pasted from app.js file.
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
	},
	SAMPLES: {
		offline: [
			path.join( PATHS.BASE, 'samples/*.php' )
		]
	},
	VENDOR: {
		common: [
			path.join( PATHS.BASE, 'vendor/mathjax' )
		],
		online: [
			path.join( PATHS.BASE, 'vendor/ckeditor' )
		]
	}
};

copy.WHITELISTS = {
	MATHJAX: {
		common: [

		]
	}
};

copy.prepareFilterlist = function( list, version ) {
	debugger;
	var list = ( list.common ? list.common.slice() : [] );

	if ( version === 'offline' ) {
		list = list.concat( list.offline ? list.offline : [] );
	}

	if ( version === 'online' ) {
		list = list.concat( list.online ? list.online : [] );
	}

	return list;
};

// return function, option.filter of ncp.
copy.createNcpBlacklistFilter = function( blacklist ) {
	return function( name ) {
		var currPath = new Path( name );

		return !_.some( blacklist, function( path ) {
			var match;

			if ( typeof path === 'string' ) {
				match = currPath.matchLeft( new Path( path ) )
			} else if ( typeof path === 'function' ) {
				match = path( name );
			}

			return match;
		} );
	};
};

copy.createNcpListFilter = function( list, version ) {
	if ( list.black ) {
		var blackListFilter = copy.createNcpBlacklistFilter( copy.prepareFilterlist( list.black, version ) );
	}

	if ( list.white ) {
		var whiteListFilter = copy.createNcpBlacklistFilter( copy.prepareFilterlist( list.white, version ) );
	}

	return function( name ) {
		var whiteListFilterResult = ( typeof whiteListFilter == 'function' ? whiteListFilter( name ) : true );
		var blackListFilterResult = ( typeof blackListFilter == 'function' ? blackListFilter( name ) : true );
		var preventCopy = whiteListFilterResult && !blackListFilterResult;

		return !preventCopy;
	}
};

copy.curryCopy = function( list, source, destination, message, newDir ) {
	return function( PATHS, version ) {
		console.log( message );

		if ( typeof newDir == 'string' ) {
			fs.mkdirSync( newDir );
		}

		var blacklist = copy.prepareFilterlist( list.black, version ),
			options = {
				filter: copy.createNcpListFilter( list )/*,
				filter: copy.createNcpBlacklistFilter( blacklist )*/
			};

		return call( ncp, source, destination, options );
	};
};

copy.copyVendor = copy.curryCopy(
	{
		black: copy.BLACKLISTS.VENDOR
	},
	'../../vendor',
	path.join( PATHS.RELEASE, 'vendor' ),
	'Copying vendor files'
);

copy.copySamples = copy.curryCopy(
	{
		black: copy.BLACKLISTS.SAMPLES
	},
	'../../samples',
	path.join( PATHS.RELEASE, 'samples' ),
	'Copying samples files'
);

copy.copyTemplate = copy.curryCopy(
	{
		black: copy.BLACKLISTS.TEMPLATE
	},
	'../../template',
	PATHS.RELEASE,
	'Copying template files'
);

module.exports = copy;