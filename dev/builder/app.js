var fs = require( 'fs' ),
    ncp = require( 'ncp' ),
    path = require( 'path' ),
    call = require( 'when/node' ).call,
    cheerio = require( 'cheerio' ),
    when = require( 'when' ),
    whenFs = require( 'when/node' ).liftAll( fs ),
    whenKeys = require( 'when/keys' ),
    _ = require( 'lodash-node' ),

    Sample = require( './lib/Sample' ),

    SAMPLES_PATH = '../../samples',
    RELEASE_PATH = '../release',

    validCategories = JSON.parse( fs.readFileSync( './categories.json', 'utf8' ) ).categories,
    samples = [],
    index = null,
    categories = {};

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
    console.log( 'Copying files.' );
    var options = {};

    options.filter = function( name ) {
        var basename = path.basename( name ),
            startFromDot = !!basename.match( /^\./i ),
            isReleaseDir = basename == 'release',
            isSamplesDir = basename == 'samples';

        return !( startFromDot || isReleaseDir || isSamplesDir );
    };

    return call( ncp, '../../', RELEASE_PATH, options );
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

copyFiles()
    .then( readSamplesDir )
    .then( selectFilesSync )
    .then( readFiles )
    .then( setupSamplesSync )
    .then( parseCategoriesSync )
    .then( prepareSamplesDir )
    .then( prepareSamplesFilesSync );