/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see license.html or https://sdk.ckeditor.com/license.html.
 */

// Helper script for the sample pages using Cloud Services provider.
// This file can be ignored and is not required to use CKEditor.
// Stolen from https://github.com/ckeditor/ckeditor5-easy-image/blob/42fbc4b8ed8b020f559da0a5a499e0a604ea0baf/tests/_utils/gettoken.js
function getCSToken( callback ) {
	function uid() {
		var uuid = 'e'; // Make sure that id does not start with number.

		for ( var i = 0; i < 8; i++ ) {
			uuid += Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
		}

		return uuid;
	}

	var xhr = new XMLHttpRequest(),
		userId = uid();

	xhr.open( 'GET', getCSToken.CLOUD_SERVICES_TOKEN_URL + '?user.id=' + userId );

	xhr.onload = function() {
		if ( xhr.status >= 200 && xhr.status < 300 ) {
			var response = JSON.parse( xhr.responseText );

			callback( response.token );
		} else {
			console.error( xhr.status );
		}
	};

	xhr.onerror = function( error ) {
		console.error( error );
	}

	xhr.send( null );
}

getCSToken.CLOUD_SERVICES_TOKEN_URL = 'https://j2sns7jmy0.execute-api.eu-central-1.amazonaws.com/prod/token';
