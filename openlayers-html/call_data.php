<?php
$curl = curl_init();

$inputJSON = file_get_contents("php://input");
$input = json_decode($inputJSON, TRUE);
$polygon =  $input["polygon"];
$bbox =  $input["bbox"];
$region = $input["region"];

$url = "";

switch ($region) {
  case "1":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_north&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_north&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
  case "2":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_northeast&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_northeast&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
  case "3":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_west&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_west&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
  case "4":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_center&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_center&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
  case "5":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_east&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_east&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
  case "6":
    $url = "http://13.76.85.240:8080/geoserver/wms?request=GetFeatureInfo&service=WMS&version=1.1.1&layers=dev-map:soil_south&styles=&srs=EPSG:4326&format=image:png&bbox=".$bbox."&width=780&height=330&query_layers=dev-map:soil_south&info_format=application/json&feature_count=10&x=353&y=145&exceptions=application:vnd.ogc.se_xml&cql=INTERSECTS%20(the_geom,%20POLYGON((".$polygon.")))";
    break;
}
curl_setopt_array($curl, array(
  CURLOPT_URL => $url,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;

?>