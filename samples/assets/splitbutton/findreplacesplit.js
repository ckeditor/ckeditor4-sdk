/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'findreplacesplit', {
	requires: 'splitbutton,find',
	init: function( editor ) {

		editor.ui.add( 'FindReplaceSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: 'Find options',
			face: {
				label: editor.lang.find.find,
				command: 'find',
				icon: 'find'
			},
			items: [ {
				label: editor.lang.find.replace,
				command: 'replace',
				icon: 'replace'
			} ]
		} );
	}
} );
