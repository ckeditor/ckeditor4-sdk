/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see license.html or https://sdk.ckeditor.com/license.html.
 */

// Helper script for the sample pages inserting the toolbar button image into sample text.
// This file can be ignored and is not required to use CKEditor.

var setupOptimizationsCalculator = ( function() {
	function displayInfo( container, info ) {
		var devices = [
			'Small mobiles (≤230px)',
			'Medium mobiles',
			'Phablets',
			'Tablets',
			'Small notebooks',
			'Medium notebooks',
			'Large notebooks',
			'Full HD screens',
			'Ultra HD screens',
			'4K screens'
		];

		function formatInfo( img ) {
			return img.width + 'x' + img.height + 'px (' + img.size + 'B)';
		}

		function getOptimization( optimized, original ) {
			return Math.ceil( 100 - ( ( optimized * 100 ) / original ) );
		}

		function generateRows( data ) {
			var html = '';

			data.forEach( function( row, i ) {
				html += '<tr>\
					<th scope="row">' + devices[ i ] +'</th>\
					<td>' + formatInfo( row ) + '</td>\
					<td>' + getOptimization( row.size, info.original.size ) + '%</td>\
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
					original = data.pop();

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
