( function() {
	'use strict';

	window.onbeforeunload = function() {
		if (popup) {
			popup.close();
		}
	};

	var SDK_ONLINE_URL = 'http://sdk.ckeditor.dev/',
		popup;

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
				headResources = [];

			var i = 0,
				max = sampleResources.length;
			for ( ; i < max; i++ ) {
				var resource = sampleResources[ i ],
					isHeadResource = ( resource.name == 'LINK' );

				if ( isHeadResource ) {
					headResources.push( resource.html );
				} else {
					if ( resource.name === 'TEXTAREA' ) {
						// Want to prevent from beautifying, so put placeholder here for a while
						resourcesString = ( resourcesString + resource.openingTag + '[' + i + ']PLACEHOLDER' + resource.closingTag );
					} else {
						resourcesString = ( resourcesString + resource.html );
					}
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

			// Removing data-sample attribute.
			resourcesString = resourcesString.replace( /(data\-sample=(?:\"|\')\S*(?:\"|\')\s*)/g, '' );

			resourcesString = html_beautify( resourcesString, {
				'indent_size': 1,
				'indent_char': '\t'
			} );

			resourcesString = resourcesString.replace( /(\<code\>)(.*?)(\<\/code\>)/g, function( match, preCode, inner, postCode ) {
				return preCode + inner.replace( /\&/g, '&amp;' ) + postCode;
			} );

			resourcesString = resourcesString.replace( /\</g, '&lt;' ).replace( /\>/g, '&gt;' );

			resourcesString = resourcesString.replace( /\[(\d)\]PLACEHOLDER/g, function( match, id ) {
				var result = sampleResources[ id ].innerHTML.replace( /\&/g, '&amp;' );

				return result;
			} );

			resourcesString = fixUrls( resourcesString );

			if (popup) {
				popup.close();
			}

			popup = window.open( '', '', 'width=800, height=600' );

			popup.document.write( '<code><pre>' + resourcesString + '</pre></code>' );
		}

		function fixUrls( str ) {
			return str
				.replace( /\.\.\//g, SDK_ONLINE_URL )
				.replace( /(")(:?\.\/)(.*?\.html)/g, '$1' + SDK_ONLINE_URL + 'samples/$3' )
				.replace( /(assets\/)/g, SDK_ONLINE_URL + 'samples/$1' );
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

					var example = {
						node: node,
						html: node.outerHTML.trim(),
						usedIn: sample.value.split( ',' ),
						name: node.nodeName
					};

					example.innerHTML = node.innerHTML;

					// Here we determine opening and closing tags HTML.
					var elementTags = example.html.replace( example.innerHTML, '' );
					var parsedElementTags = /(<.*>)(<.*>)/g.exec( elementTags );

					if ( !parsedElementTags ) {
						example.openingTag = elementTags;
						example.closingTag = null;
					} else {
						example.openingTag = parsedElementTags[ 1 ];
						example.closingTag = parsedElementTags[ 2 ];
					}
					exampleBlocks.push( example );
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