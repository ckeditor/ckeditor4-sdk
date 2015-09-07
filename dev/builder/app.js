#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

/* jshint node: true, es3: false, es5: true */

'use strict';

var fs = require( 'fs' ),
	ncp = require( 'ncp' ),
	StringDecoder = require( 'string_decoder' ).StringDecoder,
	spawn = require( 'child_process' ).spawn,
	archiver = require( 'archiver' ),
	nomnom = require( 'nomnom' ),
	rimraf = require( 'rimraf' ),
	path = require( 'path' ),
	Path = require( './lib/Path' ),
	nodefn = require( 'when/node' ),
	call = nodefn.call,
	cheerio = require( 'cheerio' ),
	when = require( 'when' ),
	whenFs = nodefn.liftAll( fs ),
	whenRimraf = nodefn.lift( rimraf ),
	whenKeys = require( 'when/keys' ),
	_ = require( 'lodash-node' ),

	Sample = require( './lib/Sample' ),

	SAMPLES_PATH = '../../samples',
	RELEASE_PATH,
	BASE_PATH = path.resolve( '../..' ),
	// Will be resolved later based on the --dev option.
	CKEDITOR_VERSION,
	CKEDITOR_PATH,
	CKEDITOR_PATH_DEV = '/../ckeditor-dev/',
	CKEDITOR_PATH_PRESETS = '/vendor/ckeditor-presets/',
	VENDORMATHJAX_PATH = path.resolve( BASE_PATH + '/vendor/mathjax' ),

	validCategories = JSON.parse( fs.readFileSync( './samples.json', 'utf8' ) ).categories,
	samples = [],
	index = null,
	license = null,
	categories = {},

	REGEXP = {
		LINK_FONT: /(<link\s+href=")(http:\/\/fonts[^\"]*)(")/g,
		DOCUMENT_WRITE_ARG: /(document\.write\()(.*)(\))/
	},

	VERBOSE = false;

require( 'when/monitor/console' );

nomnom.command( 'build' )
	.callback( wrapper( build ) )
	.help( 'Building release version of sdk.' )
	.option( 'version', {
		default: 'offline'
	} )
	.option( 'pack', {
		flag: true
	} );

nomnom.command( 'validatelinks' )
	.callback( wrapper( readFilesAndValidateLinks ) );

nomnom.nocommand()
	.callback( wrapper( build ) )
	.option( 'version', {
		default: 'offline'
	} );

var opts = nomnom.parse();

// sync
function selectFilesSync( filesArr ) {
	return _.filter( filesArr, function( fileName ) {
		return fileName.match( /.html$/i ) != null;
	} );
}

// return promise
function readFiles( filesArr ) {
	var filesReadPromises = _.map( filesArr, function( fileName ) {
		var promise = whenFs.readFile( SAMPLES_PATH + '/' + fileName, 'utf8' );

		return [ fileName, promise ];
	} );

	filesReadPromises = _.object( filesReadPromises );

	filesReadPromises[ 'index.html' ] = whenFs.readFile( BASE_PATH + '/template/' + 'index.html', 'utf8' );
	filesReadPromises[ 'license.html' ] = whenFs.readFile( BASE_PATH + '/template/' + 'license.html', 'utf8' );

	return whenKeys.all( filesReadPromises );
}

// return array of Sample instances
function setupSamplesSync( _samples ) {
	var zipFilename = getZipFilename();

	index = new Sample( 'index', _samples[ 'index.html' ], undefined, zipFilename, opts );
	license = new Sample( 'license', _samples[ 'license.html' ], undefined, zipFilename, opts );

	if ( !( delete _samples[ 'index.html' ] ) ) {
		throw 'Could not found "index.html" file in base directory.';
	}

	if ( !( delete _samples[ 'license.html' ] ) ) {
		throw 'Could not found "license.html" file in base directory.';
	}

	samples = _.map( _samples, function( fileContent, fileName ) {
		var sample = new Sample( fileName.split( '.' )[ 0 ], fileContent, index, zipFilename, opts );

		return sample;
	} );

	return {
		samples: samples,
		index: index,
		license: license
	};
}

// return array of categories
function parseCategoriesSync( elements ) {
	console.log( 'Parsing categories' );
	categories = JSON.parse( JSON.stringify( validCategories ) );

	_.each( elements.samples, function( sample ) {
		var found;

		// Looking for sample location in group and subgroup.
		_.each( categories, function( category ) {
			_.each( category.subcategories, function( subcategory ) {
				_.each( subcategory.samples, function( _sample, index ) {
					if ( _sample === sample.title ) {
						subcategory.samples[ index ] = sample;
						found = sample;
					}
				} );
			} );
		} );

		// Couldn't be found sample in config.
		if ( !found ) {
			throw new Error( 'Sample not found in "samples.json": "' + sample.title + '".' );
		}
	} );

	// Looking for misaligned sample files to defined ones in config.
	_.each( categories, function( category ) {
		_.each( category.subcategories, function( subcategory ) {
			_.each( subcategory.samples, function( _sample ) {
				if ( typeof _sample === 'string' ) {
					throw new Error( 'Sample defined in config, but .html file not found for: "' + _sample + '".' );
				}
			} );
		} );
	} );

	return categories;
}

// return function, option.filter of ncp.
function createNcpBlacklistFilter( blacklist ) {
	return function( name ) {
		var currPath = new Path( name );

		return !_.some( blacklist, function( path ) {
			var match = currPath.matchLeft( new Path( path ) );

			if ( match ) {
				VERBOSE && console.log( '  Omitting ' + name );
			}

			return match;
		} );
	};
}

// return promise
function copyTemplate() {
	console.log( 'Copying template files' );

	var blacklist = [
		// Omit SASS files.
		path.join( BASE_PATH, 'template/theme/sass' )
	];

	if ( opts.version === 'online' ) {
		blacklist.push(
			// Omit fonts.
			path.join( BASE_PATH, 'template/theme/fonts' ),
			path.join( BASE_PATH, 'template/theme/css/fonts.css' ),

			// Omit robots.
			path.join( BASE_PATH, 'template/robots.txt' )
		);
	}

	var options = {
		filter: createNcpBlacklistFilter( blacklist )
	};

	return call( ncp, '../../template', RELEASE_PATH, options );
}

// return promise
function copySamples() {
	console.log( 'Copying sample files' );

	var blacklist = [];

	if ( opts.version === 'offline' ) {
		blacklist.push( path.join( BASE_PATH, 'samples/*.php' ) );
	}

	var options = {
		filter: createNcpBlacklistFilter( blacklist ),
		transform: function( read, write ) {
			if ( read.path.match( /simplesample.js$/ ) ) {
				var content = '';

				read.on( 'data', function( chunk ) {
					content += chunk;
				} );

				read.on( 'end', function() {
					write.end( content.replace( /<CKEditorVersion>/g, CKEDITOR_VERSION ) );
				} );
			} else {
				read.pipe( write );
			}
		}
	};

	return call( ncp, '../../samples', path.join( RELEASE_PATH, 'samples' ), options );
}

// return promise
function copyVendor() {
	console.log( 'Copying vendor files' );

	fs.mkdirSync( path.join( RELEASE_PATH, 'vendor' ) );

	var blacklist = [
		// Omit Mathjax files.
		path.join( BASE_PATH, 'vendor/mathjax' ),
		// Omit CKEditor presets repo.
		path.join( BASE_PATH, 'vendor/ckeditor-presets' )
	];

	var options = {
		filter: createNcpBlacklistFilter( blacklist )
	};

	return call( ncp, '../../vendor', path.join( RELEASE_PATH, 'vendor' ), options );
}

function copyCKEditor() {
	console.log( 'Copying CKEditor files' );

	return call( ncp, CKEDITOR_PATH, path.join( RELEASE_PATH, 'vendor', 'ckeditor' ) );
}

function copyGuides() {
	console.log( 'Copying guides' );
	var urls = [];

	return when.promise( function( resolve, reject ) {
		call( ncp, '../../docs/guides', RELEASE_PATH + '/../guides', {
			transform: function( read, write ) {
				urls.push( read.path.match( /guides\/(.*)/ )[ 1 ] );
				read.pipe( write );
			}
		} ).done( function() {
			resolve( urls );
		}, reject );
	} );
}

function copyMathjaxFiles() {
	var options = {};

	console.log( 'Copying Mathjax files' );

	fs.mkdirSync( RELEASE_PATH + '/vendor/mathjax' );

	options.filter = function( name ) {
		var currPath = new Path( name );

		var whiteList = _.some( [
			( path.resolve( name ) === path.resolve( '../../vendor/mathjax' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/localization/en' ) )
		] );

		var blackList = _.some( [
			!!path.basename( name ).match( /^\./i ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/docs' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/extensions/MathML' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/Asana-Math' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/Gyre-Pagella' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/Gyre-Termes' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/Latin-Modern' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/Neo-Euler' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/STIX-Web' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fonts/HTML-CSS/TeX/png' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/input/MathML' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/localization/*' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/Asana-Math' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/Gyre-Pagella' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/Gyre-Termes' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/Latin-Modern' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/Neo-Euler' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/HTML-CSS/fonts/STIX-Web' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/NativeMML' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/output/SVG' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/test' ) ),
			currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/unpacked' ) )
		] );

		var preventCopy = !whiteList && blackList;

		if ( VERBOSE && preventCopy ) {
			console.log( '  Omitting ', name );
		}

		return !preventCopy;
	};

	return call( ncp, '../../vendor/mathjax', RELEASE_PATH + '/vendor/mathjax', options );
}

// sync method
function prepareSamplesFilesSync() {
	_.each( samples, function( sample ) {
		var _path;
		sample.setSidebar( categories );
		sample.activateSamplesButton();

		if ( opts.version === 'offline' ) {
			sample.preventSearchEngineRobots();
			sample.fixLinks();
			sample.fixFonts();
		} else {
			sample.fixCKEDITORVendorLinks( CKEDITOR_VERSION );
		}

		sample.cleanOtherVersionElements( opts.version );

		_path = RELEASE_PATH + '/samples/' + sample.name + '.html';
		fs.writeFileSync( _path, sample.$.html(), 'utf8' );
		VERBOSE && console.log( 'Writing sample file: ', path.resolve( _path ) );
	} );

	index.setSidebar( categories );
	index.activateSamplesButton();

	license.setSidebar( categories );
	license.activateSamplesButton();

	if ( opts.version === 'offline' ) {
		index.preventSearchEngineRobots();
		index.fixLinks( '' );
		index.fixFonts();

		license.preventSearchEngineRobots();
		license.fixLinks( '' );
		license.fixFonts();
	}

	fs.writeFileSync( RELEASE_PATH + '/index.html', index.$.html(), 'utf8' );
	VERBOSE && console.log( 'Writing sample file: ', path.resolve( RELEASE_PATH + '/index.html' ) );

	fs.writeFileSync( RELEASE_PATH + '/license.html', license.$.html(), 'utf8' );
	VERBOSE && console.log( 'Writing sample file: ', path.resolve( RELEASE_PATH + '/license.html' ) );
}

// return promise
function readSamplesDir() {
	console.log( 'Reading sample directory', path.resolve( SAMPLES_PATH ) );

	return whenFs.readdir( SAMPLES_PATH );
}

// Builds CKEditor from vendor/ckeditor-presets.
function buildCKEditor() {
	console.log( 'Building CKEditor from presets...' );

	// Skip building to speed up debugging:
	// return when.resolve();

	return curryExec( 'bash', [ BASE_PATH + CKEDITOR_PATH_PRESETS + 'build.sh', 'standard', 'all' ] )()
		.then( function() {
			console.log( 'Building CKEditor finished.' );
		} );
}

function determineCKEditorPath( dev ) {
	return function() {
		if ( dev ) {
			CKEDITOR_PATH = BASE_PATH + CKEDITOR_PATH_DEV;
		} else {
			CKEDITOR_PATH = BASE_PATH + CKEDITOR_PATH_PRESETS + 'build/' + CKEDITOR_VERSION + '/standard-all/ckeditor/';
		}

		console.log( 'CKEditor path:', CKEDITOR_PATH );
	};
}

function determineCKEditorVersion( dev ) {
	return function() {
		var content;

		if ( dev ) {
			content = fs.readFileSync( BASE_PATH + CKEDITOR_PATH_DEV + 'dev/builder/build.sh', 'utf8' );
			CKEDITOR_VERSION = content.match( /\sVERSION="([^"]+)"/ )[ 1 ];
		} else {
			content = fs.readFileSync( BASE_PATH + CKEDITOR_PATH_PRESETS + 'build.sh', 'utf8' );
			CKEDITOR_VERSION = content.match( /\sCKEDITOR_VERSION="([^"]+)"/ )[ 1 ];
		}

		// '4.5.0 beta' -> '4.5.0-beta'.
		// '4.5.0 dev' -> '4.5.0'.
		CKEDITOR_VERSION = CKEDITOR_VERSION.replace( / /g, '-' ).replace( /-dev/i, '' );

		console.log( 'CKEditor version:', CKEDITOR_VERSION );
	};
}

function getZipFilename() {
	return 'ckeditor-sdk-' + opts.version + '.zip';
}

function zipBuild() {
	console.log( 'Packing release into zip file...' );

	return when.promise( function( resolve, reject ) {
		var outputFile = getZipFilename(),
			outputPath = path.resolve( RELEASE_PATH + '/../' + outputFile ),
			output,
			archive = archiver( 'zip' );

		if ( fs.existsSync( outputPath ) ) {
			fs.unlinkSync( outputPath );
		}

		output = fs.createWriteStream( outputPath );
		output.on( 'close', function() {
			resolve();
			console.log( 'Packing done. ' + archive.pointer() + ' total bytes.' );
		} );

		archive.on( 'error', function( err ) {
			reject( err );
		} );

		archive.pipe( output );
		archive.bulk( [
			{ expand: true, cwd: RELEASE_PATH, src: [ '**' ], dest: 'ckeditor_sdk' }
		] );
		archive.finalize();
	} );
}

function readFilesAndValidateLinks() {
	return readSamplesDir()
		.then( selectFilesSync )
		.then( readFiles )
		.then( setupSamplesSync )
		.then( validateLinks );
}

function validateLinks( elements ) {
	var errors = [];
	console.log( 'Validating links in samples and index' );

	_.each( elements.samples, function( sample ) {
		sample.validateLinks( errors );
	} );
	elements.index.validateLinks( errors );

	handleFileSync( BASE_PATH + '/template/index.html', function( content ) {
		var $ = cheerio.load( content, {
			decodeEntities: false
		} );

		$( '.sdk-main-navigation a' ).each( function() {
			var result = Sample.validateLink( this.attribs.href, errors );

			if ( result instanceof Error ) {
				errors.push( {
					sample: 'index.html',
					link: this.attribs.href,
					message: result.message
				} );
			}
		} );
	} );

	if ( errors.length ) {
		console.log( 'Found errors in samples:' );
		console.log( JSON.stringify( errors, null, '  ' ) );
	}

	return {
		elements: elements,
		errors: errors
	};
}

function done() {
	process.exit( 0 );
}

function fail( e ) {
	e && console.log( e );
	e && console.log( e.stack );
	process.exit( 1 );
}

// This wrapper is needed for setup some options based on other ones.
function wrapper( cb ) {
	return function( opts ) {
		VERBOSE = ( opts.verbose === true );

		cb( opts );
	};
}

function packbuild() {
	return zipBuild().then( function() {
		return whenRimraf( RELEASE_PATH );
	} );
}

function build( opts ) {
	RELEASE_PATH = BASE_PATH + '/build/' + opts.version;

	console.log( 'Building', opts.version, 'version of CKEditor SDK.' );
	console.log( 'Removing old release directory', path.resolve( RELEASE_PATH ) );

	whenRimraf( RELEASE_PATH )
		.then( function() {
			if ( !opts.dev ) {
				return buildCKEditor();
			}
		} )
		.then( determineCKEditorVersion( opts.dev ) )
		.then( determineCKEditorPath( opts.dev ) )
		.then( copyTemplate )
		.then( copySamples )
		.then( copyVendor )
		.then( copyCKEditor )
		.then( copyMathjaxFiles )
		.then( readSamplesDir )
		.then( selectFilesSync )
		.then( readFiles )
		.then( setupSamplesSync )
		.then( validateLinks )
		.then( function( result ) {
			if ( result.errors.length ) {
				fail();
			}

			return result.elements;
		} )
		.then( parseCategoriesSync )
		.then( prepareSamplesFilesSync )
		.then( function() {
			if ( opts.version === 'offline' ) {
				fixIndexSync();

				return copyGuides()
					.then( fixGuidesLinks )
					.then( saveFiles )
					.then( fixFontsLinks )
					.then( saveFiles )
					.then( buildDocumentation( opts.dev ) )
					.then( curryExec( 'mv', [ '../../docs/build', RELEASE_PATH + '/docs' ] ) )
					.then( fixdocs )
					.then( curryExec( 'rm', [ '-rf', RELEASE_PATH + '/../guides' ] ) )
					.then( function() {
						if ( opts.pack ) {
							return packbuild();
						}
					} );
			} else {
				fixIndexSync();

				if ( opts.pack ) {
					return packbuild();
				}
			}
		} )
		.then( done )
		.catch( fail );
}

function buildDocumentation( dev ) {
	return function() {
		console.log( 'Building documentation.' );

		var args = [
			'--gruntfile', '../../docs/gruntfile.js',
			'--seo', false,
			'--guides', RELEASE_PATH + '/../guides/guides.json',
			'--path'
		];

		if ( dev ) {
			args.push( BASE_PATH + CKEDITOR_PATH_DEV );
		} else {
			args.push( BASE_PATH + CKEDITOR_PATH_PRESETS + 'ckeditor' );
		}

		return curryExec( 'grunt', args, true )();
	};
}

function curryExec( command, args, silent ) {
	silent = ( silent === true );

	return function() {
		return when.promise( function( resolve, reject ) {
			var cmd = spawn( command, args );

			VERBOSE && console.log( 'Executing: ', command, args.join( ' ' ) );

			if ( !silent ) {
				cmd.stdout.on( 'data', consoleBuffer );
				cmd.stderr.on( 'data', consoleBuffer );
			}

			function consoleBuffer( data ) {
				var decoder = new StringDecoder( 'utf8' );
				console.log( decoder.write( data ) );
			}

			cmd.on( 'exit', function( code ) {
				cmd.stdin.end();

				if ( code === 0 ) {
					resolve();
				} else {
					reject( code );
				}
			} );
		} );
	};
}

/**
 * In first param key is a file name and value is file content.
 *
 * @param {Object} data
 * @returns {Promise}
 */
function saveFiles( data ) {
	var filesReadPromises = _.map( data, function( fileContent, fileName ) {
		var promise = whenFs.writeFile( fileName, fileContent, 'utf8' );

		return [ fileName, promise ];
	} );

	filesReadPromises = _.object( filesReadPromises );

	return whenKeys.all( filesReadPromises );
}

/**
 * Replace links in guides files from absolute to relative ones.
 * First param is array of strings.
 *
 * @param {Array} urls
 * @returns {Promise}
 */
function fixGuidesLinks( urls ) {
	console.log( 'Fixing guides links' );
	var filesReadPromises = urls
		.filter( function( url ) {
			return url.match( /\.md$/ );
		} )
		.map( function( url ) {
			url = path.resolve( RELEASE_PATH + '/../guides/' + url );
			var promise = whenFs.readFile( url, 'utf8' );

			return [ url, promise ];
		} );
	filesReadPromises = _.object( filesReadPromises );

	return whenKeys.map( filesReadPromises, function mapper( content ) {
		return content.replace( /(\[.*?\])\((?:https?:\/\/sdk\.ckeditor\.com([^)]*?))\)/g, '$1(..$2)' );
	} );
}

function fixFontsLinks() {
	var urls = [
		path.resolve( RELEASE_PATH + '/index.html' )
	];

	var filesReadPromises = _.map( urls, function( url ) {
		// Used when.promise here to resolve with customised and more sophisticated value
		// which is literal object with file content and url of this file.
		var promise = when.promise( function( resolve, reject ) {
			return whenFs.readFile( url, 'utf8' )
				.then( function( content ) {
					resolve( { content: content, url: url } );
				} )
				.catch( reject );
		} );

		return [ url, promise ];
	} );
	filesReadPromises = _.object( filesReadPromises );

	// And here mappper use url to properly map value.
	return whenKeys.map( filesReadPromises, function mapper( result ) {
		var sampleDir = result.url.indexOf( 'samples' ) != -1,
			replacer = 'theme/css/fonts.css$3';

		replacer = ( sampleDir ? ( '$1../' + replacer ) : ( '$1' + replacer ) );

		return result.content.replace( REGEXP.LINK_FONT, replacer );
	} );
}

function handleFileSync( path, handler ) {
	var content = fs.readFileSync( path, 'utf8' ),
		result = handler( content );

	( typeof result === 'string' ) && fs.writeFileSync( path, result, 'utf8' );
}

function fixIndexSync() {
	var path = RELEASE_PATH + '/index.html';

	function handler( content ) {
		var $ = cheerio.load( content, {
			decodeEntities: false
		} );

		if ( opts.version === 'offline' ) {
			$( 'head' ).append( '<meta name="robots" content="noindex, nofollow">' );
			$( '.sdk-main-navigation a' ).each( function( index, element ) {
				$( element ).attr( 'href', Sample.fixLink( this.attribs.href, '' ) );
			} );
		}

		return $.html();
	}

	handleFileSync( path, handler );
}

function fixdocs() {
	var path = RELEASE_PATH + '/docs/index.html';

	function handler( content ) {
		var $ = cheerio.load( content, {
			decodeEntities: false
		} );

		$( '.print.guide' ).remove();

		$( 'script' ).each( function( index, element ) {
			var $element = $( element ),
				html = $element.html();

			if ( html.indexOf( 'fonts.googleapis.com' ) != -1 ) {
				html = html.replace( REGEXP.DOCUMENT_WRITE_ARG, '$1\'<link rel="stylesheet" type="text/css" href="resources/css/fonts.css" />\'$3' );

				$element.html( html );
			}
		} );

		return $.html();
	}

	handleFileSync( path, handler );

	return call( ncp, 'assets', RELEASE_PATH + '/docs/resources' );
}