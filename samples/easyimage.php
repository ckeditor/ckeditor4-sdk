<?php
if ( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' || empty( $_POST[ 'imgs' ] ) ) {
	exit();
}

function calculateBreakpoint( $width, $breakpoints ) {
	$calculated = [];

	foreach ( $breakpoints as $breakpoint ) {
		if ( $width < $breakpoint ) {
			$calculated[] = $breakpoint;
		}
	}

	return $calculated;
}

function getImageInfo( $img ) {
	$breakpoints = [
		360,
		375,
		768,
		1920,
		2880
	];
	$size = 0;
	$tempName = tempnam( '.', 'eicache-' );

	$curl = curl_init( $img );
	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
	file_put_contents( $tempName, curl_exec( $curl ) );

	if ( !curl_errno( $curl ) ) {
		$size = curl_getinfo( $curl )[ 'size_download' ];
	}

	list( $width, $height ) = getimagesize( $tempName );

	curl_close( $curl );

	return [
		'breakpoints' => calculateBreakpoint( $width, $breakpoints ),
		'image' => $img,
		'width' => $width,
		'height' => $height,
		'size' => $size
	];
}

$imgs = json_decode( $_POST[ 'imgs' ] );
$default = end( $imgs );
$return = [];

foreach ( $imgs as $img ) {
	if ( strpos( $img, 'https://cdn.cke-cs.com/' ) !== 0 ) {
		continue;
	}

	$info = getImageInfo( $img );
	$breakpoints = $info[ 'breakpoints' ];

	unset( $info[ 'breakpoints' ] );

	if ( $img === $default ) {
		$return[ 'default' ] = $info;
		break;
	}

	foreach( $breakpoints as $breakpoint ) {
		$return[ $breakpoint ] = $info;
	}

}

echo json_encode( $return );
