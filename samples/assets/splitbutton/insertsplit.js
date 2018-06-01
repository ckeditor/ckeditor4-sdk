/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'insertsplit', {
	requires: 'splitbutton,image,flash,horizontalrule,smiley,specialchar,pagebreak,iframe',
	init: function( editor ) {

		editor.ui.add( 'InsertSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: 'More inserts',
			face: {
				label: editor.lang.common.image,
				command: 'image',
				icon: 'image'
			},
			items: [ {
				label: editor.lang.common.flash,
				command: 'flash',
				icon: 'flash'
			}, {
				label: editor.lang.horizontalrule.toolbar,
				command: 'horizontalrule',
				icon: 'horizontalrule'
			}, {
				label: editor.lang.smiley.toolbar,
				command: 'smiley',
				icon: 'smiley'
			}, {
				label: editor.lang.specialchar.toolbar,
				command: 'specialchar',
				icon: 'specialchar'
			}, {
				label: editor.lang.pagebreak.toolbar,
				command: 'pagebreak',
				icon: 'pagebreak'
			}, {
				label: editor.lang.iframe.toolbar,
				command: 'iframe',
				icon: 'iframe'
			} ]
		} );
	}
} );
