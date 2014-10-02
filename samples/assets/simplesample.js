( function() {
	'use strict';

	window.onbeforeunload = function() {
		if (popup) {
			popup.close();
		}
	};

	var SDK_ONLINE_URL = 'http://sdk.ckeditor.com/',
		popup,
		placeholders = [];

	// IE8...
	if(typeof String.prototype.trim !== 'function') {
		String.prototype.trim = function() {
			return this.replace( /^\s+|\s+$/g, '' );
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
		var div = document.createElement( 'div' );

		setInnerHTML( div, html );
		return div.firstChild;
	}

	// http://allofetechnical.wordpress.com/2010/05/21/ies-innerhtml-method-with-script-and-style-tags/
	function setInnerHTML( inDOMNode, inHTML ) {
		inDOMNode.innerHTML = '_' + inHTML;
		inDOMNode.removeChild( inDOMNode.firstChild );
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

			e.returnValue = false;
			e.preventDefault && e.preventDefault();

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
			var sampleResources = resources[ id ],
				resourcesString = '',
				headResources = [];

			var i = 0,
				max = sampleResources.length;
			for ( ; i < max; i++ ) {
				var resource = sampleResources[ i ],
					isHeadResource = ( resource.name == 'LINK' || resource.name == 'STYLE' );

				if ( isHeadResource ) {
					headResources.push( resource.html );
				} else {
					resourcesString += resource.html;
				}
			}

			headResources.unshift( '<script src="http://cdn.ckeditor.com/4.4.3/standard-all/ckeditor.js"></script>' );
			headResources = headResources.join( '' );

			function getTemplatePre( headResources, title ) {
				return [
					'<!DOCTYPE html>',
					'<html>',
					'<head>',
					'<meta charset="utf-8">',
					'<meta name="robots" content="noindex, nofollow">',
					'<title>' + title + '</title>',
					headResources,
					'</head>',
					'<body>'
				];
			}

			function getTemplatePost() {
				return [
					'</body>',
					'</html>'
				];
			}

			resourcesString = getTemplatePre( headResources, metaNames[ id - 1 ] ).join( '' ) + resourcesString + getTemplatePost().join( '' );

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
				var result = placeholders[ id ].replace( /\&/g, '&amp;' );

				return result;
			} );

			resourcesString = fixUrls( resourcesString );

			if (popup) {
				popup.close();
			}

			popup = window.open( '', '', 'width=800, height=600' );

			popup.document.write( getTemplatePre( [], metaNames[ id - 1 ] ).join( '' ) + '<code><pre>' + resourcesString + '</pre></code>' + getTemplatePost().join( '' ) );
		}

		function fixUrls( str ) {
			return str
				.replace( /\.\.\//g, SDK_ONLINE_URL )
				.replace( /(")(:?\.\/)(.*?\.(?:html|php))/g, '$1' + SDK_ONLINE_URL + 'samples/$3' )
				.replace( /(assets\/)/g, SDK_ONLINE_URL + 'samples/$1' );
		}

		function prepareSampleResources() {
			var exampleBlocks = [],
				examples = {};

			var k = 0;
			accept( document.getElementsByTagName( 'html' )[ 0 ], function( node ) {
				var attrs = node.attributes,
					sample = attrs ? attrs.getNamedItem( 'data-sample' ) : null,
					sampleClear = attrs ? attrs.getNamedItem( 'data-sample-clear' ) : null;

				if ( sample ) {
					var typeAttr = attrs.getNamedItem( 'type' );

					if ( typeAttr && typeAttr.value == 'template' ) {
						node = createFromHtml( node.innerHTML.trim() );
					} else {
						node = createFromHtml( node.outerHTML.trim() );
					}

					// Removing dynamically created content from nodes.
					accept( node, function ( node ) {
						var attrs = node.attributes,
						className = attrs ? attrs.getNamedItem( 'class' ) : null,
						style = attrs ? attrs.getNamedItem( 'style' ) : null,
						sampleClear = attrs ? attrs.getNamedItem( 'data-sample-clear' ) : null;

						// Unwanted style attribute in textarea.
						if ( node.nodeName == 'TEXTAREA' && style && style.value ) {
							attrs.removeNamedItem( 'style' );
						}

						// Unwanted container "cke_textarea_inline".
						if ( className && className.value === 'cke_textarea_inline' ) {
							node.parentNode.removeChild( node );
						}

						// Unwanted node content.
						if ( sampleClear ) {
							if ( typeof node.value === 'string' ) {
								node.value = '';
							}
							if ( typeof node.innerHTML === 'string' ) {
								node.innerHTML = '';
							}
							attrs.removeNamedItem( 'data-sample-clear' );
						}
					} );

					var example = {
						node: node,
						html: node.outerHTML.trim(),
						usedIn: sample.value.split( ',' ),
						name: node.nodeName
					};

					example.innerHTML = node.innerHTML;

					// When attribute is present we don't want replace content with placeholder.
					if ( !sampleClear ) {
						// Setting placeholder for textareas and keeping reference to content in global array.
						var regexp = /(\<textarea.*\>)([\s\S]*?)(\<\/textarea>)/g;

						example.html = example.html.replace( regexp, function( text, $1, $2, $3 ) {
							placeholders.push( $2 );
							return $1 + '[' + k++ + ']PLACEHOLDER' + $3;
						} );
					}

					exampleBlocks.push( example );
				}
			} );

			// Sorting resources by usage.
			var i = exampleBlocks.length;
			while( i-- ) {
				var block = exampleBlocks[ i ],
					j = block.usedIn.length;

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
		var count = Object.keys( examples ).length,
			template = '<div><h2>Get Sample' + ( count > 1 ? 's' : '' ) + ' Source Code</h2>' + '<ul>';

		for ( var id in examples ) {
			template += '<li data-sample="' + id + '"><a href="' + id + '">' + names[ id - 1 ] + '</a></li>';
		}
		template += '</ul></div>';

		return template;
	}
}() );