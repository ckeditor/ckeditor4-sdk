/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see license.html or https://sdk.ckeditor.com/license.html.
 */

// Helper script for the sample pages inserting the toolbar button image into sample text.
// This file can be ignored and is not required to use CKEditor.

var setupOptimizationsCalculator = ( function() {
	function displayInfo( container, info ) {
		var devices = {
			360: 'Samsung Galaxy S3',
			375: 'iPhone 8',
			768: 'iPad 4',
			1920: 'Full HD',
			2880: 'Macbook Pro with Retina display'
		};

		function formatSize( bytes ) {
			if ( bytes >= 524288 ) {
				return Number( bytes / 1048576 ).toFixed( 2 ) + ' MB';
			}

			return Number( bytes / 1024 ).toFixed( 2 ) + ' KB';
		}

		function formatInfo( img ) {
			return img.width + 'x' + img.height + 'px (' + formatSize( img.size ) + ')';
		}

		function getOptimization( optimized, original ) {
			return Math.ceil( 100 - ( ( optimized * 100 ) / original ) );
		}

		function generateRows( data ) {
			var html = '';

			Object.keys( data ).forEach( function( row ) {
				if ( row === 'default' ) {
					return;
				}

				html += '<tr>\
					<th scope="row">' + devices[ row ] +'</th>\
					<td>' + formatInfo( data[ row ] ) + '</td>\
					<td>' + getOptimization( data[ row ].size, info.original.size ) + '%</td>\
				</tr>';
			} );

			return html;
		}

		container.innerHTML = '<table class="ei-optimization">\
			<caption>\
				<p>Image:</p>\
				<p><img src="' + info.original.image + '" alt="" class="ei-image"></p>\
				<p>' + formatInfo( info.original ) + '</p>\
			</caption>\
			<thead class="ei-optimization-head">\
				<tr>\
					<th scope="col">Device</th>\
					<th scope="col">Size used</th>\
					<th scope="col">Optimization</th>\
				</tr>\
			</thead>\
			<tbody class="ei-optimization-body">' + generateRows( info.optimized ) +
			'</tbody>\
		</table>';
	}

	function getImageInfoHandler( container ) {
		return function( evt ) {
			var loader = evt.data.loader,
				original = loader.file,
				xhr = new XMLHttpRequest(),
				requestContainer = document.createElement( 'div' );

			if ( container.getElementsByTagName( 'img' ).length < 1 ) {
				container.innerHTML = '';
			}

			requestContainer.innerHTML = '<p><img src="' + loader.data + '" class="ei-placeholder"></p>\
			<p>Please wait while image is being processed…</p>';
			container.appendChild( requestContainer );

			xhr.open( 'POST', 'easyimage.php' );
			xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
			xhr.send( 'imgs=' + encodeURIComponent( JSON.stringify( loader.responseData.response ) ) );

			xhr.onload = function() {
				var data = JSON.parse( xhr.responseText ),
					original = data[ 'default' ];

				displayInfo( requestContainer, {
					original: original,
					optimized: data
				} );
			};
		}
	}

	function setup( editor, container ) {
		editor.widgets.on( 'instanceCreated', function( evt ) {
			var widget = evt.data;

			widget.on( 'uploadDone', getImageInfoHandler( document.querySelector( container ) ) );
		} );
	}
	return setup;
} )();
