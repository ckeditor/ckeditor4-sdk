var cheerio = require( 'cheerio' ),
    _ = require( 'lodash-node' ),
    TITLE_PREFIX = 'CKEditor SDK &raquo; Samples &raquo; ';

function Sample( name, content, index ) {
    this.$ = cheerio.load( content );

    this.name = name;

    this.$title = this.$( 'title' );
    this.title = this.$title.text();
    this.$title.html( TITLE_PREFIX + this.title );

    this.$header = this.$( 'header' );
    this.$footer = this.$( 'footer' );

    if ( index ) {
        this.$header.html( index.$header.html() );
        this.$footer.html( index.$footer.html() );
    }

    this.$nav = this.$( 'nav.sdk-sidebar' );

    if ( this.name != 'index' ) {
        this.category = this.$( 'meta[name="sdk-category"]' );
        if ( this.category.length != 1 )
            throw 'Invalid number of sdk-category meta tags in sample: ' + this.name;
        this.category = this.category.attr( 'content' );

        this.subcategory = this.$( 'meta[name="sdk-subcategory"]' );
        if ( this.subcategory.length != 1 )
            throw 'Invalid number of sdk-subcategory meta tags in sample: ' + this.name;
        this.subcategory = this.subcategory.attr( 'content' );

        this.weight = this.$( 'meta[name="sdk-weight"]' );
        if ( this.weight.length > 1 )
            throw 'Invalid number of sdk-weight meta tags in sample: ' + this.name;
        this.weight = Number( this.weight.attr( 'content' ) ) || 1;
    }
}

Sample.prototype = {
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

            result.push('<ul>');
            _.each( subcategory.samples, function( sample ) {
                var highlightMe = (
                    highlight &&
                    sample.category == highlight.category &&
                    sample.subcategory == highlight.subcategory &&
                    sample.name == highlight.name
                    );

                result.push( '<li class="' + ( highlightMe ? 'active' : '' ) + '"><a href="' + sample.name + '.html">' + sample.title + '</a></li>' );
            } );
            result.push('</ul>')
        } );
    } );

    return result.join( '' );
};

module.exports = Sample;