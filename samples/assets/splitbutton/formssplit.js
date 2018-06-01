/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'formssplit', {
	requires: 'splitbutton,forms',
	init: function( editor ) {
		var imagePlugin = editor.plugins.image,
			items = [
				{
					icon: 'checkbox',
					label: editor.lang.common.checkbox,
					command: 'checkbox'
				}, {
					icon: 'radio',
					label: editor.lang.common.radio,
					command: 'radio'
				}, {
					icon: 'textfield',
					label: editor.lang.common.textField,
					command: 'textfield'
				}, {
					icon: 'textarea',
					label: editor.lang.common.textarea,
					command: 'textarea'
				}, {
					icon: 'select',
					label: editor.lang.common.select,
					command: 'select'
				}, {
					icon: 'button',
					label: editor.lang.common.button,
					command: 'button'
				}, {
					icon: 'hiddenfield',
					label: editor.lang.common.hiddenField,
					command: 'hiddenfield'
				}
			];

		if ( imagePlugin ) {
			items.splice( 6, 0, {
					icon: 'imagebutton',
					label: editor.lang.common.imageButton,
					command: 'imagebutton'
			} );
		}

		editor.ui.add( 'FormsSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: 'Forms',
			face: {
				label:  editor.lang.common.form,
				command: 'form',
				icon: 'form'
			},
			items: items
		} );
	}
} );
