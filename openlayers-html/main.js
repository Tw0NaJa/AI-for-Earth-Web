let control;

const baseMap = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'http://mt.google.com/vt/lyrs=y&z={z}&x={x}&y={y}&hl=th',
    })
})


const source = new ol.source.Vector();
const vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2,
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33',
            }),
        }),
    }),
});

function scaleControl() {
    control = new ol.control.ScaleLine({
        units: 'metric',
    });
    return control;
}

// Limit multi-world panning to one world east and west of the real world.
// Geometry coordinates have to be within that range.
const extent = ol.proj.get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new ol.Map({
    controls: new ol.control.defaults().extend([scaleControl()]),
    layers: [baseMap, vector],
    target: 'map',
    view: new ol.View({
        center: [11302896.246585583, 1477374.8826958865],
        zoom: 6,
        extent,
    }),
});

let draw, snap; // global so we can remove them later
let latlng;
const typeSelect = document.getElementById('type');

function addInteractions() {
    map.getLayers().getArray()[1].getSource().clear();
    latlng = new Array;
    draw = new ol.interaction.Draw({
        source: source,
        type: "Polygon",
    });
    map.addInteraction(draw);
    draw.on('drawend',
        function (evt) {

            let dataPolygon = evt.target.Hv[0];
            for (var i = 0; i < dataPolygon.length; i++) {
                let lonlat = ol.proj.transform(dataPolygon[i], 'EPSG:3857', 'EPSG:4326');
                latlng.push(lonlat);
            }
            map.removeInteraction(draw);
            let polygon_data = "";
            let lng_data = [];
            let lat_data = [];
            for (var x = 0; x < latlng.length; x++) {
                let edit_lng = latlng[x][0];
                let edit_lat = latlng[x][1];
                polygon_data += ',' + edit_lng + '%20' + edit_lat;
                lng_data.push(edit_lng);
                lat_data.push(edit_lat);

            }
            polygon_data = polygon_data.substring(1, polygon_data.length - 1);
            polygon_data += ',' + latlng[0][0] + '%20' + latlng[0][1];
            let minlat = Math.min.apply(Math, lat_data);
            let maxlat = Math.max.apply(Math, lat_data);
            let minlng = Math.min.apply(Math, lng_data);
            let maxlng = Math.max.apply(Math, lng_data);
            let bbox = (minlng - 1) + "," + (minlat - 1) + "," + (maxlng + 1) + "," + (maxlat + 1);
            $.blockUI({
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: '#000',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: .5,
                    color: '#fff'
                },
                message: 'Please wait...'
            });
            var settings = {
                "url": "./call_data.php",
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json"
                },
                "data": JSON.stringify({
                    "polygon": polygon_data,
                    "bbox": bbox
                }),
            };

            $.ajax(settings).done(function (response) {
                $.unblockUI();
                var data = JSON.parse(response);
                console.log(data.features);
                dataSet = [];
                for (var i in data.features) {
                    dataSet.push(data.features[i].properties);
                }
                $('#myTable').dataTable({
                    "responsive": true,
                    "bDestroy": true,
                    data: dataSet,
                    "columns": [
                        {
                            "data": "id",
                            "render": function (data, type, row, meta) {
                                return meta.row + meta.settings._iDisplayStart + 1;
                            }
                        },
                        { "data": "Symbole" },
                        {
                            "data": "soil_lv1",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv1;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "soil_lv2",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv2;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "soil_lv3",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv3;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "soil_lv4",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv4;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "soil_lv5",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv5;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "soil_lv6",
                            render: function (data, type, row, meta) {
                                var name = row.soil_lv6;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "suitable_p",
                            render: function (data, type, row, meta) {
                                var name = row.suitable_p;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        }
                    ]


                });
            });
            snap = new ol.interaction.Snap({ source: source });
            map.addInteraction(snap);
            map.removeInteraction(draw);
        }, this)
}


function removeLayer() {
    map.getLayers().getArray()[1].getSource().clear();
    var table = $('#myTable').DataTable();
    table.clear().draw();
    map.removeInteraction(draw);
    map.removeInteraction(snap);
}
