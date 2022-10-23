let control;
let sketch;
let measureTooltipElement;
let helpTooltipElement;
let area_total, unit, plant_list;

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

const formatArea = function (polygon) {
    //console.log(polygon);
    const area = ol.sphere.getArea(polygon);
    let output;
    if (area > 10000) {
        area_total = Math.round((area / 1000000) * 100) / 100;
        unit = "km";
        output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km<sup>2</sup>';
    } else {
        area_total = Math.round(area * 100) / 100;
        unit = "m";
        output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
    }
    return output;
};

function addInteractions() {
    let region = $("#region").val();
    if (!region) {
        Swal.fire(
            'Please Select Region',
            '',
            'warning'
        )
        return false;
    }
    area_total = null;
    unit = null;
    plant_list = new Array;
    map.getLayers().getArray()[1].getSource().clear();
    $(".showmeasure").css('display', 'none');
    latlng = new Array;
    draw = new ol.interaction.Draw({
        source: source,
        type: "Polygon",
    });


    createMeasureTooltip();
    let listener;
    draw.on('drawstart', function (evt) {
        // set sketch
        sketch = evt.feature;
        source.clear();
        let tooltipCoord = evt.coordinate;
        listener = sketch.getGeometry().on('change', function (evt) {
            const geom = evt.target;
            let output;
            if (geom instanceof ol.geom.Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
    });

    draw.on('drawend',
        function (evt) {
            measureTooltipElement.className = 'ol-tooltip ol-tooltip-static showmeasure';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
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

            if (!region) {
                region = "0";
            }
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
                    "bbox": bbox,
                    "region": region
                }),
            };

            $.ajax(settings).done(function (response) {
                $.unblockUI();
                var data = JSON.parse(response);
                console.log(data.features);
                dataSet = new Array;
                for (var i in data.features) {
                    dataSet.push(data.features[i].properties);
                    if (data.features[i].properties.PlantSuit) {
                        plant_list.push(data.features[i].properties.PlantSuit.split(","));
                    }

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
                        {
                            "data": "SoilGroup",
                            render: function (data, type, row, meta) {
                                var name = row.SoilGroup;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "Fertility",
                            render: function (data, type, row, meta) {
                                var name = row.Fertility;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "Texture",
                            render: function (data, type, row, meta) {
                                var name = row.Texture;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "SoilSeries",
                            render: function (data, type, row, meta) {
                                var name = row.SoilSeries;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "pH_top",
                            render: function (data, type, row, meta) {
                                var name = row.pH_top;
                                if (!name) {
                                    name = "-";
                                }
                                return name;
                            }
                        },
                        {
                            "data": "PlantSuit",
                            render: function (data, type, row, meta) {
                                var name = row.PlantSuit;
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

    map.addInteraction(draw);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
    });
    map.addOverlay(measureTooltip);
}

function removeLayer() {
    map.getLayers().getArray()[1].getSource().clear();
    var table = $('#myTable').DataTable();
    table.clear().draw();
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    $(".showmeasure").css('display', 'none');
}

function selectRegion() {
    let regionId = $("#region").val();

    switch (regionId) {
        case "1":
            map.getView().setCenter(ol.proj.transform([99.58008, 18.79761], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
        case "2":
            map.getView().setCenter(ol.proj.transform([103.20557, 16.18286], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
        case "3":
            map.getView().setCenter(ol.proj.transform([99.17358, 14.91943], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
        case "4":
            map.getView().setCenter(ol.proj.transform([100.34912, 15.52368], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
        case "5":
            map.getView().setCenter(ol.proj.transform([101.77185, 13.43079], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
        case "6":
            map.getView().setCenter(ol.proj.transform([99.26697, 8.64624], 'EPSG:4326', 'EPSG:3857'));
            map.getView().setZoom(7);
            break;
    }

}

function call_calculator() {

    if (!plant_list) {
        Swal.fire(
            'Please Draw Polygon',
            '',
            'warning'
        )
        return false;
    }

    var data = {
        "area": parseFloat(area_total),
        "unit": unit,
        "plant_list": checkPlantName()
    }
    var settings = {
        "url": "./call_calculator.php",
        "method": "POST",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json"
        },
        "data": JSON.stringify(data),
    };
    $.ajax(settings).done(function (response) {
        $('.nav-tabs a[href="#second"]').tab('show');
        var data = JSON.parse(response);
        console.log(data);
        dataSet = new Array;
        for (var i in data.values) {
            dataSet.push(data.values[i]);
        }
        if (data.status && data.message) {
            $('#myTable2').dataTable({
                "responsive": true,
                "bDestroy": true,
                "language": {
                    "decimal": '.',
                    "thousands": ',',
                },
                data: dataSet,
                "columns": [
                    {
                        "data": "id",
                        "render": function (data, type, row, meta) {
                            return meta.row + meta.settings._iDisplayStart + 1;
                        }
                    },
                    {
                        "data": "plant_name",
                        render: function (data, type, row, meta) {
                            var name = row.plant_name;
                            if (!name) {
                                name = "-";
                            }
                            return name;
                        }
                    },
                    {
                        "data": "total",
                        render: function (data, type, row, meta) {
                            var name = numberWithCommas(row.total);
                            if (!name) {
                                name = "-";
                            }
                            return name;
                        }
                    },
                    {
                        "data": "carbon_credit",
                        render: function (data, type, row, meta) {
                            var name = numberWithCommas(row.carbon_credit);
                            if (!name) {
                                name = "-";
                            }
                            return name;
                        }
                    }
                ]


            });
        }
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function checkPlantName() {
    let plantList = new Array;
    plant_list.forEach((c) => {
        c.forEach(d => {
            if (!plantList.includes(d)) {
                plantList.push(d);
            }
        });
    });
    return plantList;
}

