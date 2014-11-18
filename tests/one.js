( function() {

	function createSandbox( code ) {
		var iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );

		iframe.contentDocument.body.innerHTML = code.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' );

		return {
			iframe: iframe,
			body: iframe.contentDocument.body,
			textarea: iframe.contentDocument.body.querySelector( 'textarea' )
		}
	}

	describe( 'Creating sample source code with no double escaping characters in textarea', function() {
		var doubleEscapeTextarea = false;

		it( 'which has data-sample-short attribute', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '<p>This is some <strong>sample text</strong>. You are using <a href="http://ckeditor.com/">CKEditor</a>.</p>' );
		} );

		it( 'which has not extra attributes', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '<p>Hello moto</p>' );
		} );

		it( 'which has data-sample-short attribute in nested textarea', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '<p>This is some <strong>sample text</strong>. You are using <a href="http://ckeditor.com/">CKEditor</a>.</p>' );
		} );
	} );

	describe( 'Creating sample source code with double escaping characters in textarea', function() {
		var doubleEscapeTextarea = true;

		it( 'which has data-sample-short attribute', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="http://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
		} );

		it( 'which has not extra attributes', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );

		it( 'which has data-sample-short attribute in nested textarea', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="http://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
		} );

		it( 'which has textarea content in one line', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '4', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );
	} );

	describe( 'Creating sample which has &quot; characters', function() {
		it( 'one', function() {
			debugger;
			var downloadSampleCode = simpleSample.createSampleSourceCode( '5', false, false ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.body.querySelector('div input').value ).to.equal( 'Execute the &quot;bold&quot; Command' );
		} );
	} );

}() );