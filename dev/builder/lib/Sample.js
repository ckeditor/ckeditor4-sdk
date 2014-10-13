var cheerio = require( 'cheerio' ),
    url = require( 'url' ),
    _ = require( 'lodash-node' ),
    TITLE_PREFIX = 'CKEditor SDK » Samples » ';

function Sample( name, content, index, zipFilename, opts ) {
    this.$ = cheerio.load( content, {
        decodeEntities: false
    } );

    this.name = name;

    this.$title = this.$( 'title' );
    this.title = this.$title.html();
    this.$title.text( TITLE_PREFIX + this.title );

    this.$head = this.$( 'head' );
    this.$header = this.$( 'header' );
    this.$footer = this.$( 'footer' );

    if ( index ) {
        this.$header.html( index.$header.html() );
        this.$footer.html( index.$footer.html() );
    } else {
        if ( opts.version === 'online' ) {
            this.$( '.sdk-main-navigation ul' ).append( '<li><a href="/' + zipFilename + '">Download SDK</a></li>' );
        }
    }

    this.$nav = this.$( 'nav.sdk-sidebar' );
}

Sample.prototype = {
    parseMeta: function( name, lengthValidator ) {

        lengthValidator = lengthValidator || function( element ) {
            return element.length != 1;
        };

        this[ name ] = this.$( 'meta[name="sdk-' + name + '"]' );
        if ( lengthValidator( this[ name ] ) )
            throw 'Invalid number of sdk-' + name + ' meta tags in sample: ' + this.name;
        this[ name ] = this[ name ].attr( 'content' );
    },

    setSidebar: function( categories ) {
        if ( this.name != 'index' )
            this.$nav.html( Sample.createSidebar( categories, _.pick( this, 'category', 'subcategory', 'name' ) ) );
        else
            this.$nav.html( Sample.createSidebar( categories ) );
    },

    fixLinks: function( prefix ) {
        var that = this;

        this.$( '.sdk-main-navigation a, .sdk-contents a, nav.sdk-sidebar a' ).each( function( index, element ) {
            that.$( element ).attr( 'href', Sample.fixLink( this.attribs.href, prefix ) );
        } );

        this.$( '.sdk-contents form' ).each( function( index, element ) {
            that.$( element ).attr( 'action', Sample.fixFormAction( this.attribs.action ) );
        } );
    },

    validateLinks: function( errors ) {
        var that = this;

        this.$( '.sdk-main-navigation a, .sdk-contents a, nav.sdk-sidebar a' ).each( function( index, element ) {
            var result = Sample.validateLink( this.attribs.href, errors );

            if ( result instanceof Error ) {
                errors.push( {
                    sample: that.name,
                    link: this.attribs.href,
                    message: result.message
                } );
            }
        } );
    },

    fixFonts: function() {
        var that = this;

        this.$( 'link[href*="fonts.googleapis.com"]' ).each( function ( index, element ) {
            that.$( element ).attr( 'href', '../theme/css/fonts.css' );
        } );
    },

    preventSearchEngineRobots: function() {
        this.$head.append( '<meta name="robots" content="noindex, nofollow">' );
    }
};

Sample.fixLink = function( href, prefix ) {
    prefix = ( typeof prefix === 'string' ? prefix : '../' );

    if ( href.indexOf( 'http://docs.ckeditor.com/' ) !== -1 ) {
        href = href.replace( 'http://docs.ckeditor.com/', prefix + 'docs/index.html' );
    }

    return href;
};

Sample.fixFormAction = function( href ) {
    var regExp = /\.\/(\S*)/;

    return href.replace( /\.\/(\S*)/, function( a, $1 ) {
        return 'http://sdk.ckeditor.com/samples/' + $1;
    } );
};

Sample.validateLink = function( href, errors ) {
    if ( typeof href != 'string' ) {
        return new Error( 'Anchor does not have href attribute. ' );
    }

    if ( href.length == 0 ) {
        return new Error( 'Href attribute is empty.' );
    }

    if ( href.indexOf( '/docs/' ) !== -1 ) {
        return new Error( 'Invalid link "/docs/" use "http://docs.ckeditor.com" instead.' );
    }
};

// return sidebar HTML string
Sample.createSidebar = function( categories, highlight ) {
    var result = [],
        list = [],

    highlightMe, highlightSubcategory;

    _.each( categories, function( category ) {
        result.push( '<h2>' + category.name + '</h2>' );

        _.each( category.subcategories, function( subcategory ) {
            if ( !subcategory.samples.length )
                return;

            highlightSubcategory = false;

            list = [ '<ul>' ];
            _.each( subcategory.samples, function( sample ) {
                highlightMe = (
                    highlight &&
                    sample.category == highlight.category &&
                    sample.subcategory == highlight.subcategory &&
                    sample.name == highlight.name
                );

                list.push( '<li class="' + ( highlightMe ? 'active' : '' ) + '"><a href="' + sample.name + '.html">' + sample.title + '</a></li>' );

                highlightSubcategory |= highlightMe;
            } );
            list.push( '</ul>' );

            result.push( '<h3 ' + ( highlightSubcategory ? 'class="active"' : '' ) + '>' + subcategory.name + '</h3>' );
            result = result.concat( list );
        } );
    } );

    return result.join( '' );
};

module.exports = Sample;