/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'linksplit', {
	requires: 'splitbutton,link',
	init: function( editor ) {

		editor.ui.add( 'LinkSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: 'Link Options',
			face: {
				label: editor.lang.link.toolbar,
				command: 'link',
				icon: 'link'
			},
			items: [ {
				label: editor.lang.link.unlink,
				command: 'unlink',
				icon: 'unlink'
			}, {
				label: editor.lang.link.anchor.toolbar,
				command: 'anchor',
				icon: 'anchor'
			} ]
		} );
	}
} );
