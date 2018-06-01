/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'pastesplit', {
	requires: 'clipboard,pastetext,pastefromword',
	init: function( editor ) {

		editor.ui.add( 'PasteSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: 'Paste options',
			face: {
				label:  editor.lang.clipboard.paste,
				command: 'paste',
				icon: 'paste'
			},
			items: [ {
				icon: 'pastefromword',
				label: editor.lang.pastefromword.toolbar,
				command: 'pastefromword'
			}, {
				icon: 'pastetext',
				label: editor.lang.pastetext.button,
				command: 'pastetext'
			} ]
		} );
	}
} );
