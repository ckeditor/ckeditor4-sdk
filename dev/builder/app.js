#!/usr/bin/env node
/* jshint node: true */

/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the GNU GPL license v3 or later. See LICENSE.md for more information.
 */

'use strict';

var fs = require( 'fs' ),
	ncp = require( 'ncp' ),
	nomnom = require( 'nomnom' ),
	rimraf = require( 'rimraf' ),
	path = require( 'path' ),
	Path = require( './lib/Path' ),
	nodefn = require( 'when/node' ),
	call = nodefn.call,
	cheerio = require( 'cheerio' ),
	when = require( 'when' ),
	pipeline = require( 'when/pipeline' ),
	sequence = require('when/sequence'),
	whenFs = nodefn.liftAll( fs ),
	whenRimraf = nodefn.lift( rimraf ),
	whenKeys = require( 'when/keys' ),
	_ = require( 'lodash-node' ),
	tools = require( './utils/tools' ),
	copy = require( './utils/copy' ),

	Sample = require( './lib/Sample' ),

	PATHS = {
		SAMPLES: '../../samples',
		RELEASE: '../ckeditor_sdk',
		BASE: path.resolve( '../..' ),
		MATHJAX: path.resolve( path.resolve( '../..' ) + '/vendor/mathjax' )
	},

	CKEDITOR_VERSION = determineCKEditorVersion(),

	REGEXP = {
		LINK_FONT: /(<link\s+href=")(http:\/\/fonts[^\"]*)(")/g,
		DOCUMENT_WRITE_ARG: /(document\.write\()(.*)(\))/
	},

	VERBOSE = false;

require( 'when/monitor/console' );

// return promise
function readFiles( filesArr ) {
	var filesReadPromises = _.map( filesArr, function( fileName ) {
		var promise = whenFs.readFile( PATHS.SAMPLES + '/' + fileName, 'utf8' );

		return [ fileName, promise ];
	} );

	filesReadPromises = _.object( filesReadPromises );

	filesReadPromises[ 'index.html' ] = whenFs.readFile( PATHS.BASE + '/template/' + 'index.html', 'utf8' );
	filesReadPromises[ 'license.html' ] = whenFs.readFile( PATHS.BASE + '/template/' + 'license.html', 'utf8' );

	return whenKeys.all( filesReadPromises );
}

// eturn array of Sample instances
function setupSamplesSync( _samples ) {
	var samples,
		zipFilename = getZipFilename();

	var index = new Sample( 'index', _samples[ 'index.html' ], undefined, zipFilename, opts );
	var license = new Sample( 'license', _samples[ 'license.html' ], undefined, zipFilename, opts );

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
	var categories = JSON.parse( fs.readFileSync( './samples.json', 'utf8' ) ).categories;

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

function copyGuides( urls ) {
	console.log( 'Copying guides' );

	return when.promise( function( resolve, reject ) {
		call( ncp, '../../docs/guides', PATHS.RELEASE + '/../guides' ).done( function() {
			resolve( urls );
		}, reject );
	} );
}

function copyMathjaxFiles( PATHS, verbose ) {
	var options = {},
		blackFiles = [
			PATHS.MATHJAX + '/docs',
			PATHS.MATHJAX + '/extensions/MathML',
			PATHS.MATHJAX + '/fonts/HTML-CSS/Asana-Math',
			PATHS.MATHJAX + '/fonts/HTML-CSS/Gyre-Pagella',
			PATHS.MATHJAX + '/fonts/HTML-CSS/Gyre-Termes',
			PATHS.MATHJAX + '/fonts/HTML-CSS/Latin-Modern',
			PATHS.MATHJAX + '/fonts/HTML-CSS/Neo-Euler',
			PATHS.MATHJAX + '/fonts/HTML-CSS/STIX-Web',
			PATHS.MATHJAX + '/fonts/HTML-CSS/TeX/png',
			PATHS.MATHJAX + '/jax/input/MathML',
			PATHS.MATHJAX + '/localization/*',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/Asana-Math',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/Gyre-Pagella',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/Gyre-Termes',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/Latin-Modern',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/Neo-Euler',
			PATHS.MATHJAX + '/jax/output/HTML-CSS/fonts/STIX-Web',
			PATHS.MATHJAX + '/jax/output/NativeMML',
			PATHS.MATHJAX + '/jax/output/SVG',
			PATHS.MATHJAX + '/test',
			PATHS.MATHJAX + '/unpacked',
			function( name ) {
				return !!path.basename( name ).match( /^\./i );
			}
		],
		blackListFilter = copy.createNcpBlacklistFilter( blackFiles );

	console.log( 'Copying Mathjax files' );

	fs.mkdirSync( PATHS.RELEASE + '/vendor/mathjax' );

	options.filter = function( name ) {
		var currPath = new Path( name );

		var whiteList = _.some( [
			( path.resolve( name ) === path.resolve( '../../vendor/mathjax' ) ),
			currPath.matchLeft( new Path( PATHS.MATHJAX + '/localization/en' ) )
		] );

		var blackList = !blackListFilter( name );

		var preventCopy = !whiteList && blackList;
		if ( verbose && preventCopy ) {
			console.log( '  Omitting ', name );
		}

		return !preventCopy;
	};

	return call( ncp, '../../vendor/mathjax', PATHS.RELEASE + '/vendor/mathjax', options );
}

// sync method
function prepareSamplesFilesSync( categories, files ) {
	_.each( files.samples, function( sample ) {
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

		_path = PATHS.RELEASE + '/samples/' + sample.name + '.html';
		fs.writeFileSync( _path, sample.$.html(), 'utf8' );
		VERBOSE && console.log( 'Writing sample file: ', path.resolve( _path ) );
	} );

	files.index.setSidebar( categories );
	files.index.activateSamplesButton();

	files.license.setSidebar( categories );
	files.license.activateSamplesButton();

	if ( opts.version === 'offline' ) {
		files.index.preventSearchEngineRobots();
		files.index.fixLinks( '' );
		files.index.fixFonts();

		files.license.preventSearchEngineRobots();
		files.license.fixLinks( '' );
		files.license.fixFonts();
	}

	fs.writeFileSync( PATHS.RELEASE + '/index.html', files.index.$.html(), 'utf8' );
	VERBOSE && console.log( 'Writing sample file: ', path.resolve( PATHS.RELEASE + '/index.html' ) );

	fs.writeFileSync( PATHS.RELEASE + '/license.html', files.license.$.html(), 'utf8' );
	VERBOSE && console.log( 'Writing sample file: ', path.resolve( PATHS.RELEASE + '/license.html' ) );
}

// return promise
function readSamplesDir() {
	console.log( 'Reading sample directory', path.resolve( PATHS.SAMPLES ) );
	return whenFs.readdir( PATHS.SAMPLES );
}

function getOriginalDocsBuilderConfig() {
	return JSON.parse( fs.readFileSync( PATHS.BASE + '/docs/config.json', 'utf8' ) );
}

function prepareOfflineDocsBuilderConfig( cfg ) {
	cfg = _.extend( {}, cfg );

	delete cfg[ '--seo' ];
	cfg[ '--guides' ] = '../dev/guides/guides.json';

	fs.writeFileSync( PATHS.BASE + '/docs/seo-off-config.json', JSON.stringify( cfg ), 'utf8' );

	return cfg;
}

function determineCKEditorVersion() {
	var content  = fs.readFileSync( PATHS.BASE + '/vendor/ckeditor/ckeditor.js', 'utf8' );

	// Replace white spaces with underscore sign, remove everything which is in brackets
	return content.match( /version:"(.+?\s[a-zA-Z]*).+"/ )[ 1 ].trim().replace( '/\s/g', '_' );
}

function getZipFilename() {
	return 'ckeditor_' + CKEDITOR_VERSION +  '_sdk.zip';
}

function readFilesAndValidateLinks() {
	var tasks = [
		readSamplesDir,
		tools.selectHtmlFilesSync,
		readFiles,
		setupSamplesSync,
		validateLinks
	];

	return pipeline( tasks );
}

function validateLinks( elements ) {
	var errors = [];
	console.log( 'Validating links in samples and index' );

	_.each( elements.samples, function( sample ) {
		sample.validateLinks( errors );
	} );
	elements.index.validateLinks( errors );

	tools.handleFileSync( PATHS.BASE + '/template/index.html', function( content ) {
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

nomnom.command( 'build' )
	.callback( wrapper( build ) )
	.help( 'Building release version of sdk.' )
	.option( 'version', {
		'default': 'offline'
	} )
	.option( 'pack', {
		flag: true
	} );

nomnom.command( 'validatelinks' )
	.callback( wrapper( readFilesAndValidateLinks ) );

nomnom.nocommand()
	.callback( wrapper( build ) )
	.option( 'version', {
		'default': 'offline'
	} );

var opts = nomnom.parse();

// This wrapper is needed for setup some options based on other ones.
function wrapper( cb ) {
	return function( opts ) {
		VERBOSE = ( opts.verbose === true );

		cb( opts );
	};
}

function packbuild() {
	return tools.zipDirectory(
		path.resolve( PATHS.RELEASE + '/../' + getZipFilename() ),
		PATHS.RELEASE,
		'ckeditor_sdk'
	).then( function() {
		return whenRimraf( PATHS.RELEASE );
	} );
}

function removeAndCopyFiles() {
	var tasks = [
		// Removing old files
		function( PATHS ) {
			return whenRimraf( PATHS.RELEASE );
		},

		// Copying files
		copy.copyTemplate,
		copy.copySamples,
		copy.copyVendor
	];

	return sequence( tasks, PATHS, opts.version ).then( function() {
		return copyMathjaxFiles( PATHS, VERBOSE );
	} );
}

function parseSamplesFiles() {
	var tasks = [
		readSamplesDir,
		tools.selectHtmlFilesSync,
		readFiles,
		setupSamplesSync
	];

	return pipeline( tasks ).catch( function() {
		console.log( 'blad' );
	} );
}

function build( opts ) {
	var files;
	console.log( 'Building', opts.version, 'version of CKEditor SDK.' );
	console.log( 'Removing old release directory', path.resolve( PATHS.RELEASE ) );

	var tasks = [
		removeAndCopyFiles,
		parseSamplesFiles,
		function( _files ) {
			return files = _files;
		},
		validateLinks,
		function( result ) {
			if ( result.errors.length ) {
				fail();
			}

			return result.elements;
		},
		parseCategoriesSync,
		function( categories ) {
			return prepareSamplesFilesSync( categories, files );
		},
		fixIndexSync
	];

	if ( opts.version === 'offline' ) {
		// Have to crate artificial config with specific options for offline version.
		var originalCfg = getOriginalDocsBuilderConfig();

		prepareOfflineDocsBuilderConfig( originalCfg );

		tasks = tasks.concat( [
			function () {
				return getGuidesFromConfig( path.resolve( PATHS.BASE + '/docs/' + originalCfg[ '--guides' ] ) )
			},
			copyGuides,
			fixGuidesLinks,
			tools.saveFiles,
			fixFontsLinks,
			tools.saveFiles,
			buildDocumentation,
			tools.curryExec( 'mv', [ '../../docs/build', PATHS.RELEASE + '/docs' ] ),
			tools.curryExec( 'rm', [ '../../docs/seo-off-config.json' ] ),
			fixdocs,
			tools.curryExec( 'rm', [ '-rf', '../guides' ] )
		] );

	}

	if ( opts.pack ) {
		tasks.push( function () {
			return packbuild();
		} )
	}

	pipeline( tasks )
		.then( done )
		.catch( fail );// jshint ignore:line
}

function buildDocumentation() {
	console.log( 'Building documentation' );
	return tools.curryExec( 'bash', [ '../../docs/build.sh', '--config', 'seo-off-config.json' ], false )();
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
	var filesReadPromises = _.map( urls, function( url ) {
		url = path.resolve( '../guides/' + url );
		var promise = whenFs.readFile( url, 'utf8' );

		return [ url, promise ];
	} );
	filesReadPromises = _.object( filesReadPromises );

	return whenKeys.map( filesReadPromises, function mapper( content ) {
		return content.replace( /(\[.*?\])\((?:http:\/\/sdk\.ckeditor\.com([^)]*?))\)/, '$1(..$2)' );
	} );
}

function fixFontsLinks() {
	var urls = [
		path.resolve( PATHS.RELEASE + '/index.html' )
	];

	var filesReadPromises = _.map( urls, function( url ) {

		// Used when.promise here to resolve with customised and more sophisticated value
		// which is literal object with file content and url of this file.
		var promise = when.promise( function( resolve, reject ) {
			return whenFs.readFile( url, 'utf8' )
				.then( function( content ) {
					resolve( { content: content, url: url } );
				} )
				.catch( reject ); // jshint ignore:line
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

function fixIndexSync() {
	var path = PATHS.RELEASE + '/index.html';

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

	tools.handleFileSync( path, handler );
}

/**
 * This function look up guides config and prepare flat structure
 * of all guides README.md URLs.
 */
function getGuidesFromConfig( guidesCfgPath ) {
	var guideCfg = JSON.parse( fs.readFileSync( guidesCfgPath, 'utf8' ) ),
		guidesURLs = [];

	_.each( guideCfg, function( category ) {
		getGuidesFromCategory( category, guidesURLs );
	} );

	return _.map( guidesURLs, function( url ) {
		return url + '/README.md';
	} );
}

function getGuidesFromCategory( category, guides ) {
	if ( category.items ) {
		_.each( category.items, function( category ) {
			getGuidesFromCategory( category, guides );
		} );
	} else {
		guides.push( category.url );
	}
}

function fixdocs() {
	var path = PATHS.RELEASE + '/docs/index.html';

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

	tools.handleFileSync( path, handler );

	return call( ncp, 'assets', PATHS.RELEASE + '/docs/resources' );
}