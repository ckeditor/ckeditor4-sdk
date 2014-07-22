( function() {
	'use strict';

	// IE8...
	if(typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		}
	}

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
		var children;

		// Handling node as a node and array
		if ( node.children ) {
			children = node.children;

			visitator( node );
		} else if ( typeof node.length == 'number' ) {
			children = node;
		}

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

	function prepareSamplesNames() {
		var meta = document.getElementsByTagName( 'meta' ),
			sdkMeta = null,
			metaNames;

		accept( meta, function( element ) {
			if ( element.name == 'sdk-samples' ) {
				sdkMeta = element;
			}
		} );

		return sdkMeta.content.split( '|' );
	}

	contentLoaded( window, onLoad );

	function onLoad() {
		var resources = prepareSampleResources(),
			body = document.getElementsByTagName( 'body' )[ 0 ],
			sections = document.getElementsByTagName( 'section' ),
			sdkContents,
			metaNames = prepareSamplesNames(),
			samplesList = createFromHtml( prepareSamplesList( resources, metaNames ) );

		accept( sections, function( element ) {
			var classAttr = element.attributes && element.attributes.getNamedItem( 'class' );

			if ( classAttr && classAttr.value == 'sdk-contents' ) {
				sdkContents = element;
			}
		} );

		sdkContents.appendChild( samplesList );

		attachEvent( samplesList, 'click', function( e ) {
			var clicked = e.target || e.srcElement,
				relLi,
				sampleId;

			e.preventDefault();

			if ( clicked instanceof HTMLAnchorElement) {
				relLi = clicked.parentNode;
			} else {
				return false;
			}
			sampleId = relLi.attributes.getNamedItem( 'data-sample' ).value;
			showSampleSource( sampleId, metaNames );

			return false;
		} );

		function showSampleSource( id, metaNames ) {
			var templatePre, templatePost,
				sampleResources = resources[ id ],
				resourcesString = '',
				sdkOnlineURL = 'http://sdk.ckeditor.dev/',
				headResources = [];

			var i = 0,
				max = sampleResources.length;
			for ( ; i < max; i++ ) {
				var resource = sampleResources[ i ],
					isHeadResource = ( resource.name == 'LINK' );

				if ( isHeadResource ) {
					headResources.push( resource.html );
				} else {
					resourcesString = resourcesString + sampleResources[ i ].html;
				}
			}
			headResources = headResources.join( '' );

			templatePre = [
				'<!DOCTYPE html>',
				'<html>',
				'<head>',
					'<meta charset="utf-8">',
					'<title>' + metaNames[ id - 1 ] + '</title>',
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

			resourcesString = html_beautify( resourcesString, {
				'indent_size': 1,
				'indent_char': '\t'
			} );

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
						html: node.outerHTML.trim(),
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

	function prepareSamplesList( examples, names ) {
		var template = '<div><h2>Runnable examples</h2>' + '<ul>';

		for ( var id in examples ) {
			template += '<li data-sample="' + id + '"><a href="' + id + '">' + names[ id - 1 ] + '</a></li>';
		}
		template += '</ul></div>';

		return template;
	}
}() );