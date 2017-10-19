( function() {
	var predefinedText = '<p>This is some <strong>sample text</strong>. You are using <a href="https://ckeditor.com/">CKEditor</a>.</p>',
		predefinedTextEscaped = '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="https://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;';

	var samplesDescriptions = {
		'1': 'has data-sample-short attribute',
		'2': 'has not extra attributes',
		'3': 'has data-sample-short attribute in nested textarea',
		'4': 'has textarea content in one line',
		'5': 'has &quot; characters',
		'6': 'has &lt; and &gt; characters in div',
		'7': 'has textarea with escaped code tag'
	};

	function createSandbox( code, forDownload ) {
		// Default false.
		forDownload = ( forDownload === true ? true : false );

		var iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );

		if ( !forDownload ) {
			code = code.replace( /&lt;/g, '<' ).replace( /&gt;/g, '>' );
		} else {
			code = code.replace( /&/g, '&amp;' );
		}

		iframe.contentDocument.body.innerHTML = code;

		return {
			iframe: iframe,
			body: iframe.contentDocument.body,
			textarea: iframe.contentDocument.body.querySelector( 'textarea' )
		}
	}

	describe( 'Creating sample source code with no double escaping characters in textarea', function() {
		var doubleEscapeTextarea = false;

		it( 'which ' + samplesDescriptions[ 1 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( predefinedText );
		} );

		it( 'which ' + samplesDescriptions[ 2 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '<p>Hello moto</p>' );
		} );

		it( 'which ' + samplesDescriptions[ 3 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( predefinedText );
		} );
	} );

	describe( 'Creating sample source code with double escaping characters in textarea', function() {
		var doubleEscapeTextarea = true;

		it( 'which ' + samplesDescriptions[ 1 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '1', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="https://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
		} );

		it( 'which ' + samplesDescriptions[ 2 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '2', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );

		it( 'which ' + samplesDescriptions[ 3 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '3', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;This is some &lt;strong&gt;sample text&lt;/strong&gt;. You are using &lt;a href="https://ckeditor.com/"&gt;CKEditor&lt;/a&gt;.&lt;/p&gt;' );
		} );

		it( 'which ' + samplesDescriptions[ 4 ], function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '4', false, false, doubleEscapeTextarea ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );
	} );

	describe( 'Creating sample which ' + samplesDescriptions[ 5 ], function() {
		it( 'one', function() {
			var downloadSampleCode = simpleSample.createSampleSourceCode( '5', false, false ),
				sandbox = createSandbox( downloadSampleCode );

			expect( sandbox.body.querySelector('div input').value ).to.equal( 'Execute the &quot;bold&quot; Command' );
		} );
	} );

	describe( 'Creating sample source code for download', function() {
		it( 'which ' + samplesDescriptions[ 1 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '1' ),
				sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.textarea.value.trim() ).to.equal( predefinedTextEscaped );
		} );

		it( 'which ' + samplesDescriptions[ 2 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '2' ),
				sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );

		it( 'which ' + samplesDescriptions[ 3 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '3' ),
			sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.textarea.value.trim() ).to.equal( predefinedTextEscaped );
		} );

		it( 'which ' + samplesDescriptions[ 4 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '4' ),
			sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.textarea.value.trim() ).to.equal( '&lt;p&gt;Hello moto&lt;/p&gt;' );
		} );

		it( 'which ' + samplesDescriptions[ 5 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '5' ),
				sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.body.querySelector('input').value ).to.equal( 'Execute the &quot;bold&quot; Command' );
		} );

		it( 'which ' + samplesDescriptions[ 6 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '6' ),
				sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.body.querySelector( 'code' ).innerText ).to.equal( '&lt;iframe&gt;' );
		} );

		it( 'which' + samplesDescriptions[ 7 ], function() {
			var sampleSourceCode = simpleSample.getSampleSourceCode( '7' ),
				sandbox = createSandbox( sampleSourceCode.download, true );

			expect( sandbox.body.querySelector( 'textarea' ).value.trim() ).to.equal( '&amp;nbsp;&lt;code&gt;div&lt;/code&gt;&amp;nbsp;' );
		} );
	} );

}() );