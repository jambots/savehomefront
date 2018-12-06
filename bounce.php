<?php
$auth="5c0738088a93f8091d8b4567.DV96Jg881iPW4OpU1";
$endpoint= $_GET['endpoint'];
//$url=$_GET['url'];
if($endpoint=="list"){
  //echo $endpoint;
  //echo $endpoint;
  $url="http://fetchrss.com/api/v1/feed/".$endpoint."?auth=".$auth;
  //$response = http_get($url, array("timeout"=>10), $info);
  $options=array("timeout"=>1,"headers"=>array("HTTP_ORIGIN" => "http://www.fetchrss.com"));
  $response = http_get( $url,$options,$info);
  echo($info);
}
