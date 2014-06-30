var fs = require( 'fs' ),
    ncp = require( 'ncp' ),
    archiver = require( 'archiver' )
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
    var zipFilename = getZipFilename();

    index = new Sample( 'index', _samples[ '_index.html' ], undefined, zipFilename, opts );

    var removed = delete _samples[ '_index.html' ];

    samples = _.map( _samples, function( fileContent, fileName ) {
        var sample = new Sample( fileName.split( '.' )[ 0 ], fileContent, index, zipFilename, opts );

        return sample;
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
            currPath.matchLeft( new Path( BASE_PATH + '/dev' ) ),
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

function copyGuides( urls ) {
    console.log( 'Copying guides' );

    return when.promise( function ( resolve, reject ) {
        call( ncp, '../../docs/guides', RELEASE_PATH + '/../guides' ).done( function() {
            resolve( urls );
        }, reject);
    });
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
        if ( opts.version === 'online' )
            sample.fixLinks();

        fs.writeFileSync( RELEASE_PATH + '/samples/' + sample.name + '.html', sample.$.html(), 'utf8' );
    } );

    index.setSidebar( categories );
    if ( opts.version === 'online' )
        index.fixLinks();

    fs.writeFileSync( RELEASE_PATH + '/samples/index.html', index.$.html(), 'utf8' );
}

// return promise
function readSamplesDir() {
    console.log( 'Reading sample directory' );
    return whenFs.readdir( SAMPLES_PATH );
}

function getOriginalDocsBuilderConfig() {
    return JSON.parse( fs.readFileSync( BASE_PATH + '/docs/config.json', 'utf8' ) );
}

function prepareOfflineDocsBuilderConfig( cfg ) {
    cfg = _.extend( {}, cfg );

    delete cfg[ '--seo' ];
    cfg[ '--guides' ] = '../dev/guides/guides.json';

    fs.writeFileSync( BASE_PATH + '/docs/seo-off-config.json', JSON.stringify( cfg ), 'utf8' );

    return cfg;
}

function determineCKEditorVersion() {
    var content  = fs.readFileSync( BASE_PATH + '/vendor/ckeditor/ckeditor.js', 'utf8' );

    // Replace white spaces with underscore sign, remove everything which is in brackets
    return content.match( /version:"(.+?\s[a-zA-Z]*).+"/ )[ 1 ].trim().replace( '/\s/g', '_' );
}

function getZipFilename() {
    return 'ckeditor_' + determineCKEditorVersion() +  '_sdk.zip';
}

function zipBuild() {
    console.log( 'Packing release into zip file...' );

    return when.promise( function ( resolve, reject ) {
        var outputFile = getZipFilename(),
            outputPath = path.resolve( RELEASE_PATH + '/../' + outputFile ),
            output,
            archive = archiver( 'zip' );

        if ( fs.existsSync( outputPath ) )
            fs.unlinkSync( outputPath );

        output = fs.createWriteStream( outputPath );
        output.on( 'close', function () {
            resolve();
            console.log( 'Packing done. ' + archive.pointer() + ' total bytes.' );
        } );

        archive.on( 'error', function( err ) {
            reject( err );
        } );

        archive.pipe( output );
        archive.bulk( [
            { expand: true, cwd: RELEASE_PATH, src: [ '**' ], dest: 'release' }
        ] );
        archive.finalize();
    } );
}

function done() {
    process.exit( 0 );
}

function fail( e ) {
    console.log( e );
    process.exit( 1 );
}

nomnom.command( 'build' )
    .callback( build )
    .help( 'Building release version of sdk.' )
    .option( 'version', {
        default: 'offline'
    } );

nomnom.command( 'fixdocs' )
    .callback( fixdocs )
    .help( 'Fixing docs for offline use.' )
    .option( 'version', {
        default: 'offline'
    } );

nomnom.command( 'packbuild' )
    .callback( packbuild );

var opts = nomnom.parse();

function packbuild() {
    zipBuild().then( function() {
        whenRimraf( RELEASE_PATH );
    } );
}

function build() {
    console.log( 'Removing old release directory', RELEASE_PATH );
    whenRimraf( RELEASE_PATH )
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
        .then( function() {
            if ( opts.version === 'offline' ) {
                // Have to crate artificial config with specific options for offline version.
                var originalCfg = getOriginalDocsBuilderConfig(),
                    offlineCfg = prepareOfflineDocsBuilderConfig( originalCfg ),
                    urls = getGuidesFromConfig( path.resolve( BASE_PATH + '/docs/' + originalCfg[ '--guides' ] ) );

                return copyGuides( urls )
                    .then( fixGuidesLinks )
                    .then( saveFiles );

            } else {
                fixIndexLinks();
            }
        } )
        .then( done )
        .catch( fail );
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

function fixIndexLinks() {
    var filePath = RELEASE_PATH + '/index.html',
        $ = cheerio.load( fs.readFileSync( filePath, 'utf8' ), {
            decodeEntities: false
        } );

    $( '.sdk-main-navigation ul' ).append( '<li><a href="/' + getZipFilename() + '">Download SDK</a></li>' );

    $( '.sdk-main-navigation a' ).each( function( index, element ) {
        $( element ).attr( 'href', Sample.fixLink( this.attribs.href ) );
    } );

    // Save it in same location
    fs.writeFileSync( filePath, $.html(), 'utf8' );
}

function getGuidesFromConfig( guidesCfgPath ) {
    var guideCfg = JSON.parse( fs.readFileSync( guidesCfgPath, 'utf8' ) ),
        devSectionCfg = _.find( guideCfg, function ( section ) {
            return section.title === 'CKEditor 4 Developer\'s Guide';
        } ),
        functionalityOverviewSectionCfgItems = _.find( devSectionCfg.items, function( subSection ) {
            return subSection.title === 'Functionality Overview';
        } ).items;

    return _.map( functionalityOverviewSectionCfgItems, function( item ) {
        return item.url + '/README.md';
    } );
}

function fixdocs( opts ) {
    var filePath = RELEASE_PATH + '/docs/index.html',
        $ = cheerio.load( fs.readFileSync( filePath, 'utf8' ), {
            decodeEntities: false
        } );

    $( '.print.guide' ).remove();

    // Save it in same location
    fs.writeFileSync( filePath, $.html(), 'utf8' );

    done();
}