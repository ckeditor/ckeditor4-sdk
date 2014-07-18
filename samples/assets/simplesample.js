( function() {
	'use strict';

	function attachEvent( elem, evtName, callback ) {
		if ( elem.addEventListener ) {
			elem.addEventListener( evtName, callback, false );
		} else if ( elem.attachEvent ) {
			elem.attachEvent( 'on' + evtName , callback );
		} else {
			throw new Error( 'Could not attach event.' );
		}
	}

	function accept( node, visitator ) {
		var children = node.children;

		visitator( node );

		var i = children.length;
		while( i-- ) {
			accept( children[ i ], visitator );
		}
	}

	attachEvent( window, 'load', onLoad );

	function onLoad() {
		var resources = prepareSampleResources();

		attachEvent( document.getElementsByTagName( 'body' )[ 0 ], 'click', function( e ) {
			var clicked = e.target || e.srcElement,
				classAttr = clicked.attributes.getNamedItem( 'class' );

			if ( classAttr && classAttr.value === 'sdk-get-source' ) {
				showSampleSource( clicked.attributes.getNamedItem( 'data-sample-name' ).value );
			}
		} );

		function showSampleSource( name ) {
			var templatePre = [
				'<!DOCTYPE html>',
				'<html>',
				'\t<head>',
				'\t\t<meta charset="utf-8">',
				'\t\t<title>Some title&lt;/title>',
				'\t\t<script src="http://cdn.ckeditor.com/4.4.3/standard-all/ckeditor.js"></script>',
				'\t</head>',
				'\t<body>'
			], templatePost = [
				'\t</body>',
				'</html>'
			],
			sampleResources = resources[ name ],
			resourcesString = '';

			var i = 0,
				max = sampleResources.length;
			for ( ; i < max; i++ ) {
				resourcesString = resourcesString + '\n' + sampleResources[ i ].node.outerHTML;
			}
			resourcesString = templatePre.join( '\n' ) + resourcesString + templatePost.join( '\n' );
			resourcesString = resourcesString.replace( /\</g, '&lt;' );
			resourcesString = resourcesString.replace( /(src\=\"|\')(assets)/g, '$1http://sdk.ckeditor.dev/samples/$2' );

			var myWindow = window.open( '', '', 'width=800, height=600' );

			myWindow.document.write( '<code><pre>' + resourcesString + '</pre></code>' );
		}

		function prepareSampleResources() {
			var exampleBlocks = [],
				examples = {};

			accept( document.getElementsByTagName( 'html' )[ 0 ], function( node ) {
				var attrs = node.attributes,
				sample = attrs ? attrs.getNamedItem( 'data-sample' ) : null;

				if ( sample ) {
					exampleBlocks.push( {
						node: node,
						usedIn: sample.value.split( ',' )
					} );
				}
			} );

			var i = exampleBlocks.length;
			while( i-- ) {
				var block = exampleBlocks[ i ];

				var j = block.usedIn.length;
				while( j-- ) {
					var usageName = block.usedIn[ j ];

					examples[ usageName ] = examples[ usageName ] || [];
					examples[ usageName ].push( block );
				}
			}

			return examples;
		}
	}

}() );