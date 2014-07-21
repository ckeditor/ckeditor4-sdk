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

	// Please note: assume that there is only one element in HTML
	function createFromHtml( html ) {
		var div = document.createElement('div');
		div.innerHTML = html;

		return div.firstChild;
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
			var templatePre, templatePost,
				sampleResources = resources[ name ],
				resourcesString = '',
				sdkOnlineURL = 'http://sdk.ckeditor.dev/',
				headResources = [];

			var i = 0,
				max = sampleResources.length;
			for ( ; i < max; i++ ) {
				var resource = sampleResources[ i ],
					isHeadResource = ( resource.name == 'LINK' );

				if ( isHeadResource ) {
					headResources.push( resource.node.outerHTML );
				} else {
					resourcesString = resourcesString + sampleResources[ i ].node.outerHTML;
				}
			}
			headResources = headResources.join( '' );

			templatePre = [
				'<!DOCTYPE html>',
				'<html>',
				'<head>',
					'<meta charset="utf-8">',
					'<title>Some title</title>',
					'<script src="http://cdn.ckeditor.com/4.4.3/standard-all/ckeditor.js"></script>',
					headResources,
				'</head>',
				'<body>'
			];

			templatePost = [
				'</body>',
				'</html>'
			];

			resourcesString = templatePre.join( '' ) + resourcesString + templatePost.join( '' );
			resourcesString = resourcesString
				.replace( /(\&lt;)/g, '<' )
				.replace( /(\&gt;)/g, '>' )
				.replace( /\.\.\//g, sdkOnlineURL )
				.replace( /(")(:?\.\/)(.*?\.html)/g, '$1' + sdkOnlineURL + 'samples/$3' )
				.replace( /(assets\/)/g, sdkOnlineURL + 'samples/$1' )
				.replace( /(data\-sample=(?:\"|\')\S*(?:\"|\')\s*)/g, '' );

			resourcesString = html_beautify( resourcesString );

			resourcesString = resourcesString.replace( /(\<code\>)(.*?)(\<\/code\>)/g, function( match, preCode, inner, postCode ) {
				return preCode + inner.replace( /\</g, '&amp;lt;' ) + postCode;
			} );
			resourcesString = resourcesString.replace( /\</g, '&lt;' );

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
					var typeAttr = attrs.getNamedItem( 'type' );
					if ( typeAttr && typeAttr.value == 'template' ) {
						node = createFromHtml( node.innerHTML.trim() );
					}

					exampleBlocks.push( {
						node: node,
						usedIn: sample.value.split( ',' ),
						name: node.nodeName
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