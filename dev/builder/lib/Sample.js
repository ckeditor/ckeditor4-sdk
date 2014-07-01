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

    if ( this.name != 'index' ) {
        this.parseMeta( 'category' );
        this.parseMeta( 'subcategory' );
        this.parseMeta( 'weight', function( element ) { return element.length > 1;  } );
    }
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
    }
};

Sample.fixLink = function( href, prefix ) {
    prefix = ( typeof prefix === 'string' ? prefix : '../' );

    if ( href.indexOf( 'http://docs.ckeditor.com/' ) !== -1 ) {
        href = href.replace( 'http://docs.ckeditor.com/', prefix + 'docs/index.html' );
    }

    return href;
};

// return sidebar HTML string
Sample.createSidebar = function( categories, highlight ) {
    var result = [];

    _.each( categories, function( category ) {
        result.push( '<h2>' + category.name + '</h2>' );

        _.each( category.subcategories, function( subcategory ) {
            if ( !subcategory.samples.length )
                return;

            result.push( '<h3>' + subcategory.name + '</h3>' );

            result.push( '<ul>' );
            _.each( subcategory.samples, function( sample ) {
                var highlightMe = (
                    highlight &&
                    sample.category == highlight.category &&
                    sample.subcategory == highlight.subcategory &&
                    sample.name == highlight.name
                    );

                result.push( '<li class="' + ( highlightMe ? 'active' : '' ) + '"><a href="' + sample.name + '.html">' + sample.title + '</a></li>' );
            } );
            result.push( '</ul>' )
        } );
    } );

    return result.join( '' );
};

module.exports = Sample;