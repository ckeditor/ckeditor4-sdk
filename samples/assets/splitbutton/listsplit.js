/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.plugins.add( 'listsplit', {
	requires: 'splitbutton,list,liststyle',
	init: function( editor ) {
		editor.addCommand( 'unorderedliststyle', {
			exec: commandCallback
		} );
		editor.addCommand( 'numberedliststyle', {
			exec: commandCallback
		} );

		function commandCallback( editor, data ) {
			var style = data.style,
				element = getListElement( editor, data.listType );

			if ( !element ) {
				if ( data.listType === 'ul' ) {
					editor.execCommand( 'bulletedlist' );
				} else {
					editor.execCommand( 'numberedlist' );
				}
				element = getListElement( editor, data.listType );
			}

			if ( style ) {
				element.setStyle( 'list-style-type' , style );
			} else {
				element.removeStyle( 'list-style-type' );
			}

			function getListElement( editor, listTag ) {
				var range;
				try {
					range = editor.getSelection().getRanges()[ 0 ];
				} catch ( e ) {
					return null;
				}

				range.shrink( CKEDITOR.SHRINK_TEXT );
				return editor.elementPath( range.getCommonAncestor() ).contains( listTag, 1 );
			}
		}

		editor.ui.add( 'UnorderedListSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: editor.lang.liststyle.bulletedTitle,
			face: {
				label: editor.lang.list.bulletedlist,
				command: 'bulletedlist',
				icon: 'bulletedlist'
			},
			items: [ {
				label: 'disc',
				command: 'unorderedliststyle',
				commandData: {
					listType: 'ul'
				}
			}, {
				label: 'circle',
				command: 'unorderedliststyle',
				commandData: {
					style: 'circle',
					listType: 'ul'
				}
			}, {
				label: 'square',
				command: 'unorderedliststyle',
				commandData: {
					style: 'square',
					listType: 'ul'
				}
			} ]
		} );

		editor.ui.add( 'NumberedListSplit', CKEDITOR.UI_SPLITBUTTON, {
			label: editor.lang.liststyle.numberedTitle,
			face: {
				label: editor.lang.list.numberedlist,
				command: 'numberedlist',
				icon: 'numberedlist'
			},
			items: [ {
				label: '1. decimal',
				command: 'numberedliststyle',
				commandData: {
					listType: 'ol'
				}
			}, {
				label: 'a. lower latin',
				command: 'numberedliststyle',
				commandData: {
					style: 'lower-alpha',
					listType: 'ol'
				}
			}, {
				label: 'A. upper latin',
				command: 'numberedliststyle',
				commandData: {
					style: 'upper-alpha',
					listType: 'ol'
				}
			}, {
				label: 'i. lower roman',
				command: 'numberedliststyle',
				commandData: {
					style: 'lower-roman',
					listType: 'ol'
				}
			}, {
				label: 'I. upper roman',
				command: 'numberedliststyle',
				commandData: {
					style: 'upper-roman',
					listType: 'ol'
				}
			} ]
		} );
	}
} );
