<?php
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true ");
header("Access-Control-Allow-Methods: OPTIONS, GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control");

function print_page($subtitle, $body, $fragment, $options = array()) {
  $uri = 'http://' . str_replace("cdn-source.", "", $_SERVER["HTTP_HOST"]) . preg_replace('/\?.*$/', '', $_SERVER["REQUEST_URI"]);
  $canonical = $uri."#!".$fragment;
  $html = file_get_contents('print-template.html');
  $meta = "";
  if (!empty($options['meta_description'])) {
    $meta .= '<meta name="description" property="og:description" content="'.htmlspecialchars($options['meta_description']).'" />';
  }
  if (!empty($options['meta_keywords'])) {
    $meta .= ($meta ? "\n" : "").'<meta name="keywords" content="'.htmlspecialchars($options['meta_keywords']).'" />';
  }

  echo preg_replace(array('/\{subtitle}/', '/\{body}/', '/\{canonical}/', '/\{meta}/'), array($subtitle, fix_links($body), $canonical, $meta), $html);
}

function print_index_page() {
  echo fix_links(file_get_contents("index-template.html"));
}

function jsonp_decode($jsonp) {
  $jsonp = preg_replace('/^.*?\(/', "", $jsonp);
  $jsonp = preg_replace('/\);\s*$/', "", $jsonp);
  return json_decode($jsonp, true);
}

function decode_file($filename) {
  if (file_exists($filename)) {
    return jsonp_decode(file_get_contents($filename));
  }
  else {
    throw new Exception("File ".htmlspecialchars($filename)." not found");
  }
}

// Turns #! links into ?print= links when in print mode.
//
// <a href="#!/api/Ext.Element">  -->  <a href="?print=/api/Ext.Element">
// <a href="#!/api/Ext.Element-cfg-id">  -->  <a href="?print=/api/Ext.Element#cfg-id">
//
function fix_links($html) {
  if (isset($_GET["print"]) || isset($_GET["mobile"])) {
    $param = isset($_GET["print"]) ? "print" : "mobile";
    $patterns = array(
      '/<a href=([\'"])#!?\/(api\/[^-\'"]+)-([^\'"]+)/' => '<a href=$1?'.$param.'=/$2#$3',
      '/<a href=([\'"])#!?\/guide\/([^-\'"]+)-section-([^\'"]+)/' => '<a href=$1?'.$param.'=/guide/$2#$2-section-$3',
      '/<a href=([\'"])#!?\//' => '<a href=$1?'.$param.'=/',
    );
    return preg_replace(array_keys($patterns), array_values($patterns), $html);
  }
  else {
    return $html;
  }
}

function word_limiter($str = '', $limit = 120, $endstr = '...'){
  if ($str == '') return '';

  if (strlen($str) <= $limit) return $str;

  $out = substr($str, 0, $limit);
  $pos = strrpos($out, " ");
  if ($pos>0) {
    $out = substr($out, 0, $pos);
  }
  $out .= $endstr;
  return $out;
}

// Very basic support for dynamic SEO
function meta_description($body) {
  // Skip top navigation
  $description = str_replace('<strong>Contents</strong>', '', $body);
  $description = preg_replace('#<li><a[^>]*>.*?</a></li>#', ' ', $description);
  // Add a dot after top level heading
  $description = preg_replace('#<h1>(.*?)\.?</h1>#', '$1.', $description);
  // Remove tags
  $description = preg_replace('#<[^>]+>#', ' ', $description);
  $description = word_limiter($description, 160);
  // Get rid of extra white characters
  $description = preg_replace('/\s+/', ' ', trim($description));

  return $description;
}

if (isset($_GET["_escaped_fragment_"]) || isset($_GET["print"]) || isset($_GET["mobile"])) {
  if (isset($_GET["_escaped_fragment_"])) {
    $fragment = $_GET["_escaped_fragment_"];
  }
  elseif (isset($_GET["print"])) {
    $fragment = $_GET["print"];
  }
  elseif (isset($_GET["mobile"])) {
    $fragment = $_GET["mobile"];
  }
  else {
    $fragment = "";
  }

  try {
    if (preg_match('/^\/api\/([^-]+)/', $fragment, $m)) {
      $className = $m[1];
      $json = decode_file("output/".$className.".js");
      $options = array();
      $options['meta_description'] = "CKEditor 4 API Documentation for " . $className;
      print_page($className, "<h1>" . $className . "</h1>\n" . $json["html"], $fragment, $options);
    }
    elseif (preg_match('/^\/api\/?$/', $fragment, $m)) {
      print_index_page();
    }
    elseif (preg_match('/^\/guide\/(.+?)(-section-.+)?$/', $fragment, $m)) {
      $json = decode_file("guides/".$m[1]."/README.js");
      $options = array();
      if (!empty($json['meta_keywords'])) {
        $options['meta_keywords'] = $json['meta_keywords'];
      }
      if (!empty($json['meta_description'])) {
        $options['meta_description'] = $json['meta_description'];
      }
      else {
        $options['meta_description'] = meta_description($json["guide"]);
      }
      print_page($json["title"], '<div class="guide-container" style="padding: 1px">' . $json["guide"] . '</div>', $fragment, $options);
    }
    elseif (preg_match('/^\/guide\/?$/', $fragment, $m)) {
      print_index_page();
    }
    else {
      print_index_page();
    }
  }
  catch (Exception $e) {
    print_page($e->getMessage(), $e->getMessage(), $fragment);
  }
}
else {
  echo file_get_contents("template.html");
}

?>
