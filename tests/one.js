( function() {

    function createSandbox( code ) {
        var iframe = document.createElement( 'iframe' );
        document.body.appendChild( iframe );

        iframe.contentDocument.body.innerHTML = code;

        return {
            iframe: iframe,
            body: iframe.contentDocument.body
        }
    }

    describe( 'Creating sample source code with no double escaping characters in textarea', function() {
        var doubleEscapeTextarea = false;

        it( 'which has data-sample-short attribute', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '<p>This is some <strong>sample text</strong>. You are using <a href="http://ckeditor.com/">CKEditor</a>.</p>' );
        } );

        it( 'which has not extra attributes', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '<p>Hello moto</p>' );
        } );

        it( 'which has data-sample-short attribute in nested textarea', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '<p>This is some <strong>sample text</strong>. You are using <a href="http://ckeditor.com/">CKEditor</a>.</p>' );
        } );
    } );

    describe( 'Creating sample source code with double escaping characters in textarea', function() {
        var doubleEscapeTextarea = true;

        it( 'which has data-sample-short attribute', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="http://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
        } );

        it( 'which has not extra attributes', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
        } );

        it( 'which has data-sample-short attribute in nested textarea', function() {
            var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea );
            var sandbox = createSandbox( downloadSampleCode.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' ) );
            var textareaValue = sandbox.body.querySelector( 'textarea' ).value.trim();

            expect( textareaValue ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="http://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
        } );
    } );

}() );