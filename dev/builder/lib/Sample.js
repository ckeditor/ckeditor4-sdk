var cheerio = require( 'cheerio' ),
    _ = require( 'lodash-node' ),
    TITLE_PREFIX = 'CKEditor SDK » Samples » ';

function Sample( name, content, index ) {
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
    }
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