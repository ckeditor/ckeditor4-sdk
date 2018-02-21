<?php
if ( $_SERVER[ 'REQUEST_METHOD' ] !== 'POST' || empty( $_POST[ 'imgs' ] ) ) {
	exit();
}

function getImageInfo( $img ) {
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
		'image' => $img,
		'width' => $width,
		'height' => $height,
		'size' => $size
	];
}

$imgs = json_decode( $_POST[ 'imgs' ] );
$return = [];

foreach ( $imgs as $img ) {
	if ( strpos( $img, 'https://cdn.cke-cs.com/' ) !== 0 ) {
		continue;
	}

	$return[] = getImageInfo( $img );
}

echo json_encode( $return );
