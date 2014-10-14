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
	if ( typeof String.prototype.trim !== 'function' ) {
		String.prototype.trim = function() {
			return this.replace( /^\s+|\s+$/g, '' );
		}
	}

	if ( !Object.keys ) {
		Object.keys = function( o ) {
			if ( o !== Object( o ) ) {
				throw new TypeError( 'Object.keys called on a non-object' );
			}

			var k = [], p;
			for ( p in o ) {
				if ( Object.prototype.hasOwnProperty.call( o, p ) ) {
					k.push( p );
				}
			}

			return k;
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

		return sdkMeta ? sdkMeta.content.split( '|' ) : '';
	}

	contentLoaded( window, onLoad );

	function onLoad() {
		var resources = prepareSampleResources(),
			body = document.getElementsByTagName( 'body' )[ 0 ],
			sections = document.getElementsByTagName( 'section' ),
			sdkContents,
			metaNames = prepareSamplesNames(),
			samplesList = createFromHtml( prepareSamplesList( resources, metaNames ) );

		initSidebarAccordion( body );

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

		function createSampleSourceCode( id, metaNames, wrapInHtmlStructure, wrapInCodePre ) {
			var sampleResources = resources[ id ],
				resourcesString = '',
				headResources = [],
				result;

			wrapInHtmlStructure = ( wrapInHtmlStructure === false ? false : true );
			wrapInCodePre = ( wrapInCodePre === false ? false : true );

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

			// Here we are going to remove extra new line characters and white spaces added by beautifier.
			resourcesString = resourcesString.replace( /(<script>)(\n)([\s\S]*?)(\n)([\s\S]*?)(\<\/script\>)/g, function( match, $1, $2, $3, $4, $5, $6 ) {
				return $1 + $3.trim() + $6;
			} );

			resourcesString = resourcesString.replace( /(\<code\>)(.*?)(\<\/code\>)/g, function( match, preCode, inner, postCode ) {
				return preCode + inner.replace( /\&/g, '&amp;' ) + postCode;
			} );

			resourcesString = resourcesString.replace( /\</g, '&lt;' ).replace( /\>/g, '&gt;' );

			resourcesString = resourcesString.replace( /(\n)(\s*)([^\n]*)\[(\d)\]PLACEHOLDER/g, function( match, $0, $1, $2, $3 ) {
				var lines = placeholders[ $3 ].content.split( '\n' ), result = '';

				// Removing whitespaces in each line.
			    var max = lines.length;
				for ( var i = 0; i < max; i++ ) {
					var lineData = lines[ i ].match( /(\s*)([\S\s]*)/ );

					lines[ i ] = {
						indent: lineData[ 1 ].replace( placeholders[ $3 ].indent, $1 ),
						content: lineData[ 2 ]
					};
				}

				// Fake line to make indentation, because join make indentation only between lines - not at the beginning.
				lines.unshift( { indent: '', content: '' } );

				// Indent one tab extra.
				var i = 0,
					max = lines.length;
				for ( var i = 0; i < max; i++ ) {
					result += lines[ i ].indent + lines[ i ].content + '\n';
				}

				result = $2 + result.replace( /\&/g, '&amp;' );

				result = '\n' + $0 + $1[ 0 ] + result.trim() + $0 + $1[ 0 ];

				return result;
			} );

			resourcesString = fixUrls( resourcesString );

			return [
				wrapInHtmlStructure ? getTemplatePre( [], metaNames[ id - 1 ] ).join( '' ) : '',
				wrapInCodePre ? '<code><pre>' : '',
				resourcesString,
				wrapInCodePre ? '</pre></code>' : '',
				wrapInHtmlStructure ? getTemplatePost().join( '' ) : ''
			].join( '' );
		}

		var showSampleSource;
		if ( !this.picoModal || ( CKEDITOR.env.ie && CKEDITOR.env.version < 9 ) ) {
			showSampleSource = function( sampleId, metaNames ) {
				var code = createSampleSourceCode( sampleId, metaNames );
				if ( popup ) {
					popup.close();
				}

				popup = window.open( '', '', 'width=800, height=600' );

				popup.document.write( code );
			};
		} else {
			showSampleSource = function( sampleId, metaNames ) {
				var code = '<div><button>Select code</button><div class="textarea-wrapper"><textarea>' + createSampleSourceCode( sampleId, metaNames, false, false ) + '</textarea></div></div>',
				modal = picoModal( {
					content: code,
					modalClass: 'source-code'
				} ),
				modalElem = new CKEDITOR.dom.element( modal.modalElem() ),
				selectButton = modalElem.findOne( 'button' ),
				textarea = modalElem.findOne( 'textarea' );

				selectButton.on( 'click', function() {
					textarea.$.select();
				} );
				modal.show();
			};
		}

		function fixUrls( str ) {
			return str

				// "../../something.html" ==> "http://sdk.ckeditor.com/something.html"
				.replace( /\.\.\/\.\.\//g, function() {
					return SDK_ONLINE_URL;
				} )

				// "../something.html"    ==> "http://sdk.ckeditor.com/something.html"
				.replace( /\.\.\//g, function() {
					return SDK_ONLINE_URL;
				} )

				// "./example.php"        ==> "http://sdk.ckeditor.com/samples/example.php"
				.replace( /("|')(:?\.\/)(.*?\.(?:html|php))/g, function( match, p1, p2, p3 ) {
					return p1 + SDK_ONLINE_URL + 'samples/' + p3;
				}, '$1' + SDK_ONLINE_URL + 'samples/$3' )

				// "assets/some.php"      ==> "http://sdk.ckeditor.com/samples/assets/some.php"
				.replace( /("|')(assets\/)/g, function( match, p1, p2 ) {
					return p1 + SDK_ONLINE_URL + 'samples/' + p2;
				} );
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
						var regexpTextarea = /(\<textarea.*?\>)([\s\S]*?)\n(\s*)(\<\/textarea>)/g,
							regexpScript = /(\<script.*?\>)([\s\S]*?)\n(\s*)(\<\/script>)/g;

						var pickPlaceholder = function( text, $1, $2, $3, $4 ) {
							example;
							placeholders.push( {
								indent: $3.replace( '\n', '' ),
								content: $2[0] === '\n' ? $2.replace( '\n', '' ) : $2
							} );
							return $1 + '[' + k++ + ']PLACEHOLDER' + $4;
						};

						example.html = example.html.replace( regexpTextarea, pickPlaceholder );
						example.html = example.html.replace( regexpScript, pickPlaceholder );
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
		var template = '<div><h2>Get Sample Source Code</h2>' + '<ul>';

		for ( var id in examples ) {
			template += '<li data-sample="' + id + '"><a href="' + id + '">' + names[ id - 1 ] + '</a></li>';
		}
		template += '</ul></div>';

		return template;
	}

	function initSidebarAccordion( body ) {
		var sidebar = body.querySelector( 'nav.sdk-sidebar' );

		if ( sidebar.addEventListener ) {
			sidebar.addEventListener( 'click', onClick );
		} else {
			sidebar.attachEvent( 'onclick', onClick );
		}

		function onClick( evt ) {
			var target = evt.target || evt.srcElement;

			if ( target.tagName == 'H3' ) {
				target.className = target.className == 'active' ? '' : 'active';

				// Force redraw on IE8.
				target.parentElement.className = target.parentElement.className;
			}
		}
	}
}() );