<?php
if ( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' || empty( $_POST[ 'imgs' ] ) ) {
	exit();
}

function calculateBreakpoints( $width, $breakpoints ) {
	if ( $width === 'default' ) {
		return [ 'default' ];
	}

	$calculated = [];

	foreach ( $breakpoints as $breakpoint ) {
		if ( $width < $breakpoint ) {
			$calculated[] = $breakpoint;
		}
	}

	return $calculated;
}

function getImageType( $mime ) {
	return strtoupper( explode( '/', $mime )[ 1 ] );
}

function getImageInfo( $width, $img ) {
	$breakpoints = [
		360,
		375,
		768,
		1920,
		2880
	];
	$size = 0;
	$type = '';

	$curl = curl_init( $img );
	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
	curl_exec( $curl );

	if ( !curl_errno( $curl ) ) {
		$info = curl_getinfo( $curl );
		$size = $info[ 'size_download' ];
		$type = getImageType( $info[ 'content_type' ] );
	}

	curl_close( $curl );

	return [
		'breakpoints' => calculateBreakpoints( $width, $breakpoints ),
		'image' => $img,
		'width' => $width,
		'size' => $size,
		'type' => $type
	];
}

$imgs = json_decode( $_POST[ 'imgs' ] );
$return = [];

foreach ( $imgs as $width => $img ) {
	if ( strpos( $img, 'https://cdn.cke-cs.com/' ) !== 0 ) {
		continue;
	}

	$info = getImageInfo( $width, $img );
	$breakpoints = $info[ 'breakpoints' ];

	unset( $info[ 'breakpoints' ] );

	foreach( $breakpoints as $breakpoint ) {
		$return[ $breakpoint ] = $info;
	}

}

echo json_encode( $return );
