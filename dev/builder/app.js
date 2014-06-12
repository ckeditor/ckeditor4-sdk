var fs = require( 'fs' ),
    ncp = require( 'ncp' ),
    nomnom = require( 'nomnom' ),
    rimraf = require( 'rimraf' ),
    path = require( 'path' ),
    Path = require( './lib/Path' ),
    call = require( 'when/node' ).call,
    cheerio = require( 'cheerio' ),
    when = require( 'when' ),
    whenFs = require( 'when/node' ).liftAll( fs ),
    whenRimraf = require( 'when/node' ).lift( rimraf ),
    whenKeys = require( 'when/keys' ),
    _ = require( 'lodash-node' ),

    Sample = require( './lib/Sample' ),

    SAMPLES_PATH = '../../samples',
    RELEASE_PATH = '../release',
    BASE_PATH = path.resolve('../..'),
    VENDORMATHJAX_PATH = path.resolve(BASE_PATH + '/vendor/mathjax'),

    validCategories = JSON.parse( fs.readFileSync( './categories.json', 'utf8' ) ).categories,
    samples = [],
    index = null,
    categories = {},

    DEBUG = false;

require( 'when/monitor/console' );

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

    return whenKeys.all( filesReadPromises );
}

// return array of Sample instances
function setupSamplesSync( _samples ) {
    index = new Sample( 'index', _samples[ '_index.html' ] );

    var removed = delete _samples[ '_index.html' ];

    samples = _.map( _samples, function( fileContent, fileName ) {
        return new Sample( fileName.split( '.' )[ 0 ], fileContent, index );
    } );

    if ( !removed )
        throw 'Could not found "_index.html" file in samples directory.';

    return samples;
}

// return array of categories
function parseCategoriesSync( samples ) {
    console.log( 'Parsing categories.' );

    _.each( samples, function( sample ) {
        var category, subcategory;

        category = categories[ sample.category ] = categories[ sample.category ] || {
            name: sample.category,
            subcategories: {}
        };

        subcategory = category.subcategories[ sample.subcategory ] = category.subcategories[ sample.subcategory ] || {
            name: sample.subcategory,
            samples: []
        };

        var foundPredefinedCategory = _.find( validCategories, function( category ) {
            return category.name == sample.category;
        } );
        if ( !foundPredefinedCategory )
            throw 'Could not find predefined category "' + sample.category + '" in sample: ' + sample.name;

        var foundPredefinedSubcategory = _.find( foundPredefinedCategory.subcategories, function( subcategory ) {
            return subcategory == sample.subcategory;
        } );
        if ( !foundPredefinedSubcategory )
            throw 'Could not find predefined subcategory "' + sample.subcategory + '" in sample: ' + sample.name;

        subcategory.samples.push( sample );
    } );

    // Sorting each subcategory elements by their weights.
    sortSamplesByWeight( categories );

    return categories;
}

function sortSamplesByWeight( categories ) {
    _.each( categories, function( category ) {
        _.each( category.subcategories, function( subcategory ) {
            subcategory.samples.sort( function( a, b ) {
                return b.weight - a.weight;
            } );
        } );
    } );
}

// return promise
function copyFiles() {
    console.log('Copying new release files');

    var options = {};

    options.filter = function ( name ) {
        var currPath = new Path( name );

        var blackList = _.some( [
            !!path.basename( name ).match( /^\./i ),
            currPath.matchLeft( new Path( BASE_PATH + '/dev/release' ) ),
            currPath.matchLeft( new Path( BASE_PATH + '/samples' ) ),
            currPath.matchLeft( new Path( BASE_PATH + '/vendor/mathjax' ) ),
            currPath.matchLeft( new Path( BASE_PATH + '/docs' ) )
        ] );

        var whiteList = false;

        var preventCopy = !whiteList && blackList;
        if ( DEBUG && preventCopy ) {
            console.log( name );
        }

        return !preventCopy;
    };

    return call( ncp, '../../', RELEASE_PATH, options );
}

function copyMathjaxFiles() {
    var options = {};

    console.log( 'Copying Mathjax files' );

    fs.mkdirSync( RELEASE_PATH + '/vendor/mathjax' );

    options.filter = function ( name ) {
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
            currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/fontsHTML-CSS/STIX-Web' ) ),
            currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/jax/input/MathML' ) ),
            currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/localization/*' ) ),
            currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/test' ) ),
            currPath.matchLeft( new Path( VENDORMATHJAX_PATH + '/unpacked' ) )
        ] );

        var preventCopy = !whiteList && blackList;
        if ( DEBUG && preventCopy ) {
            console.log( 'Ommited', name );
        }

        return !preventCopy;
    };

    return call( ncp, '../../vendor/mathjax', RELEASE_PATH + '/vendor/mathjax', options );
}

// return promise
function prepareSamplesDir() {
    fs.mkdirSync( RELEASE_PATH + '/samples' );

    return call( ncp, '../../samples/assets', RELEASE_PATH + '/samples/assets' );
}

// sync method
function prepareSamplesFilesSync() {
    _.each( samples, function( sample ) {
        sample.setSidebar( categories );

        fs.writeFileSync( RELEASE_PATH + '/samples/' + sample.name + '.html', sample.$.html(), 'utf8' );
    } );

    index.setSidebar( categories );
    fs.writeFileSync( RELEASE_PATH + '/samples/index.html', index.$.html(), 'utf8' );
}

// return promise
function readSamplesDir() {
    console.log( 'Reading sample directory' );
    return whenFs.readdir( SAMPLES_PATH );
}

function prepareDocsBuilderConfig() {
    var cfg = JSON.parse( fs.readFileSync( BASE_PATH + '/docs/config.json', 'utf8' ) );
    delete cfg[ '--seo' ];
    fs.writeFileSync( BASE_PATH + '/docs/seo-off-config.json', JSON.stringify( cfg ), 'utf8' );
}

function done() {
    process.exit( 1 );
}

nomnom.command( 'build' )
    .callback( build )
    .help( 'Building release version of sdk.' );

nomnom.command( 'fixdocs' )
    .callback( fixdocs )
    .help( 'Fixing docs for offline use.' );

nomnom.parse();

function build() {
    console.log( 'Removing old release directory' );
    whenRimraf( RELEASE_PATH )
        .then( copyFiles )
        .then( copyMathjaxFiles )
        .then( readSamplesDir )
        .then( selectFilesSync )
        .then( readFiles )
        .then( setupSamplesSync )
        .then( parseCategoriesSync )
        .then( prepareSamplesDir )
        .then( prepareSamplesFilesSync )
        .then( prepareDocsBuilderConfig )
        .then( done );
}

function fixdocs() {
    var filePath = RELEASE_PATH + '/docs/index.html',
        $ = cheerio.load( fs.readFileSync( filePath, 'utf8' ), {
            decodeEntities: false
        } );

    $( '.print.guide' ).remove();

    fs.writeFileSync( filePath, $.html(), 'utf8' );

    done();
}