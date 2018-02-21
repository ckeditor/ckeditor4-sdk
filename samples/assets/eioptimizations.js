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
			'Tablets',
			'Small notebooks',
			'Notebooks',
			'Full HD screens'
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

		if ( container.getElementsByTagName( 'table' ).length < 1 ) {
			container.innerHTML = '';
		}

		container.insertAdjacentHTML( 'beforeend', '<table>\
			<caption>\
				<p>Image:</p>\
				<p><img src="' + info.original.image + '" alt="" style="max-width: 300px;"></p>\
				<p>' + formatInfo( info.original ) + '</p>\
			</caption>\
			<thead>\
				<tr>\
					<th scope="col">Device</th>\
					<th scope="col">Size used</th>\
					<th scope="col">Optimization</th>\
				</tr>\
			</thead>\
			<tbody>' + generateRows( info.optimized ) +
			'</tbody>\
		</table>' );
	}

	function getImageInfoHandler( container ) {
		return function( evt ) {
			var loader = evt.data.loader,
				original = loader.file,
				xhr = new XMLHttpRequest();

			xhr.open( 'POST', 'easyimage.php' );
			xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
			xhr.send( 'imgs=' + encodeURIComponent( JSON.stringify( loader.responseData.response ) ) );

			xhr.onload = function() {
				var data = JSON.parse( xhr.responseText ),
					original = data.pop();

				displayInfo( container, {
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
