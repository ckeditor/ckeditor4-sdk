<!DOCTYPE html>
<?php
/*
Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.md or http://ckeditor.com/license
*/
?>
<html>
<head>
	<meta charset="utf-8">
	<title>Sample &mdash; CKEditor</title>
	<link rel="stylesheet" href="../theme/css/sdk.css">
	<link rel="stylesheet" href="highlight/styles/googlecode.css">
	<style>
	pre code {
		white-space: pre-wrap;
		word-wrap: break-word;
		color: #000;
	}
	</style>
</head>
<body>
	<section class="sdk-container">
	<section class="sdk-contents">
		<h1>CKEditor &ndash; Posted Data </h1>

		<p>The following data has been submitted via POST request:</p>
		<table border="1" cellspacing="0" id="outputSample">
		<colgroup>
			<col width="120">
		</colgroup>
		<thead>
		<tr>
			<th>Field Name</th>
			<th>Value</th>
		</tr>
		</thead>
		<?php

		if (!empty($_POST)) {
			foreach ($_POST as $key => $value) {
			if ((!is_string($value) && !is_numeric($value)) || !is_string($key)) {
				continue;
			}

			if (get_magic_quotes_gpc()) {
				$value = htmlspecialchars(stripslashes((string) $value));
			}
			else {
				$value = htmlspecialchars((string) $value);
			}
			?>
			<tr>
				<th style="vertical-align: top"><?php echo htmlspecialchars((string) $key); ?></th>
				<td>
				<pre><code class="html"><?php echo $value; ?></code></pre>
				</td>
			</tr>
			<?php
			}
		}
		?>
		</table>
	</section>
	</section>

	<footer class="sdk-footer">

	</footer>

</body>
</html>
