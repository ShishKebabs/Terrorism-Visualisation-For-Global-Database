let data_table = null;
let map = undefined;
var overlay = undefined;
let year_filter = undefined;
let is_play_btn = true;
let timeline_timer = undefined;
let isDrawn = true;
let update_timeline_freq = 10;
let terror_filtered = []
let clusters = []

const ZOOM_LEVELS = 6 // how many zoom levels after X should it use no clustering

d3.csv("/data/terrorism.csv", function (error, data) {
    if (error) throw error;
    console.log("File load complete")

    console.time('loadData');
    loadData(data)
    console.log("Pre-Processing complete")

    console.time('createCharts');
    createCharts();
    console.timeEnd('createCharts');

});


function initMap() {
    const latlng = { lat: 51.5074, lng: 0.1278 };
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 4,
        center: latlng,
        styles: [
            {
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#adadad"
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "labels",
                "stylers": [
                    {
                        "color": "#cecece"
                    },
                    {
                        "lightness": 55
                    },
                    {
                        "weight": 1
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#c8c8c8"
                    },
                    {
                        "saturation": -100
                    },
                    {
                        "lightness": 35
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#000000"
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.locality",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#cacaca"
                    }
                ]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    },
                    {
                        "weight": 0.5
                    }
                ]
            },
            {
                "featureType": "administrative.neighborhood",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "administrative.province",
                "elementType": "labels",
                "stylers": [
                    {
                        "color": "#e4e4e4"
                    }
                ]
            },
            {
                "featureType": "administrative.province",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#d2d2d2"
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#dddddd"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "stylers": [
                    {
                        "saturation": 5
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "stylers": [
                    {
                        "saturation": -35
                    },
                    {
                        "lightness": 5
                    },
                    {
                        "weight": 0.5
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "saturation": -30
                    },
                    {
                        "weight": 0.5
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "stylers": [
                    {
                        "color": "#000030"
                    }
                ]
            }
        ]
    });


}

function disableMap(disable) {
    map != null ? map.setOptions({
        draggable: !disable, zoomControl: !disable,
        scrollwheel: !disable, disableDoubleClickZoom: disable
    })
        : console.log("map not created");
}

$(document).ready(() => {

    year_filter = $("#yearSlider").prop('min');
    $("#yearSlider").val(year_filter);
    $(yearval).text($("#yearSlider").val());

    $("#yearSlider").change(e => {
        year_filter = e.target.value;
        $(yearval).text(year_filter);

        year_filter1 = null;
        year_filter2 = null;

        //console.log(year_filter);
        addMarkers();

    });
    $("#playPause").click(() => {
        year_filter1 = null;
        year_filter2 = null;


        if (is_play_btn) {
            timeline_timer = setInterval(myTimer, 10);
            is_play_btn = false;
        } else {
            timeline_timer = clearInterval(timeline_timer);
            is_play_btn = true;
        }
    });
    $("#fastForward").click(() => {
        if (update_timeline_freq > 1) {
            if (update_timeline_freq >= 40) {
                update_timeline_freq -= 5;
                return;
            }
            if (update_timeline_freq >= 30) {
                update_timeline_freq -= 2;
                return;
            }
            if (update_timeline_freq >= 10) {
                update_timeline_freq -= 1;
                return;
            }
            update_timeline_freq -= 0.5;
        }
    });
    $("#slowDown").click(() => {
        if (update_timeline_freq < 60) {
            if (update_timeline_freq >= 40) {
                update_timeline_freq += 5;
                return;
            }
            if (update_timeline_freq >= 30) {
                update_timeline_freq += 2;
                return;
            }
            if (update_timeline_freq >= 10) {
                update_timeline_freq += 1;
                return;
            }
            update_timeline_freq += 0.5;
        }
    });

    data_table = $('#table').DataTable({
        //data: points_array,
        //:true,
        columns: [
            { "title": "ID", data: 'eventid' },
            { "title": "Year", data: 'iyear' },
            { "title": "Country", data: 'country_txt' },
            { "title": "Region", data: 'region_txt' },
            { "title": "City", data: 'city' },
            { "title": "Latitude", data: 'latitude' },
            { "title": "Longitude", data: 'longitude' },
            { "title": "Target", data: 'targtype1_txt' },
            { "title": "Target Type", data: 'target1' },
            { "title": "Attack Type", data: 'attacktype1_txt' },
            { "title": "Group", data: 'gname' },
            { "title": "Nationality", data: 'natlty1_txt' }
        ]
    });

})


let timeline_iteration = 0;
function myTimer() {
    if (isDrawn) {
        if (timeline_iteration >= update_timeline_freq) {
            timeline_iteration = 0;
            if (year_filter > $("#yearSlider").prop('max')) {
                year_filter = $("#yearSlider").prop('min');
            }
            $("#yearSlider").val(year_filter);
            $(yearval).text(year_filter);
            addMarkers();
            year_filter++;
        }
        timeline_iteration++;
    }
}


function zoomLevelToClusterLevel(zoomLevel) {
    console.log("Zoom Level in:",zoomLevel)
    const A = Math.pow(2, ZOOM_LEVELS)
    const clusterLevel = Math.floor(A * Math.pow(0.5, zoomLevel))
    console.log("Cluster level out:",clusterLevel)
    return clusterLevel
}

//loop over terror data and filter, store each zoom cluster
function loadData(terror) {
    //console.log(terror)
    terror_filtered = terror.filter(d => {
        const { iyear, country, city, latitude, longitude, gname } = d;
        //data filtering 
        if (!latitude || !longitude || !iyear) {
            return false;
        }
        return true;
    })

    max_cluster = Math.pow(2,ZOOM_LEVELS-1)
    clusters[0] = clusterRawData(terror_filtered, 0);
    clusters[max_cluster] = clusterRawData(terror_filtered, Number.MAX_SAFE_INTEGER)
    clusters[max_cluster*2] = clusterRawData(terror_filtered, Number.MAX_SAFE_INTEGER)
    let zoom = ZOOM_LEVELS
    for (let clustersIndex = 1; clustersIndex < max_cluster; clustersIndex*=2) {
        const modulo = (zoomLevelToClusterLevel(zoom))
        const cluster = clusterRawData(terror_filtered, modulo)
        clusters[clustersIndex] = cluster
        zoom--;
    }

    const groups = {}
    terror_filtered.forEach(t => {
        if (groups.hasOwnProperty(t.gname) == false) {
            groups[t.gname] = { g: t.gname, count: 0 }
        }
        groups[t.gname].count += 1;
    });

    let tempData = Object.keys(groups).map(c => {
        return groups[c];
    })
    tempData.sort((a, b) => b.count - a.count)
    tempData = tempData.slice(1,20)

    const unique_groups = {}
    //unique_groups = terror_filtered.filter( onlyUnique )
    tempData.forEach(d => {
        if(unique_groups.hasOwnProperty(d.g) == false) {
            unique_groups[d.g] = {}
        }
    })

    //$("#group_selection").val(Object.keys(unique_groups));

    $.each(Object.keys(unique_groups), function(key, value) {   
        $('#groups')
            .append($("<option></option>")
                       .attr("value",value)
                       .text(value)); 

    });
    
    console.timeEnd('loadData')
    console.time('addMarkers')
    addMarkers();
    console.timeEnd('addMarkers')
    console.log("Marker load complete")

    google.maps.event.addListener(map, 'bounds_changed', function () {
        //window.clearTimeout(bounds_check_freq);
        //bounds_check_freq = window.setTimeout(function () {
        addMarkers();
        //}, 20);
    });
    console.log("Cluster load complete")
}

function clusterRawData(input, modulo) {
    return input.reduce((clusters, point) => {
        const { latitude, longitude } = point;
        if(modulo <= 0) {
            cluster_latitude = latitude;
            cluster_longitude = longitude;
        } else {
            cluster_latitude = latitude - latitude % modulo
            cluster_longitude = longitude - longitude % modulo
        }


        const cluster_index = cluster_latitude + "," + cluster_longitude

        if (clusters.hasOwnProperty(cluster_index) === false) {
            clusters[cluster_index] = []
            //console.log("Creating cluster index",cluster_index)
        }

        clusters[cluster_index].push(point)

        return clusters;
    }, {})
}

let year_filter1 = undefined;
let year_filter2 = undefined;
let user_select = false;
let selection = []

function filterButton() {
    year_filter1 = null;
    year_filter2 = null;

    user_select = false;
    selection = $('#groups').val();

    const year = parseInt($("#year_search").val());
    const year2 = parseInt($("#year_search2").val());

    if(selection.length >0) {
        user_select = true;
    }
    else if (isNaN(year) && isNaN(year2)) {
        return;
    }

    if (isNaN(year) && !isNaN(year2)) {
        year_filter = year2
        $("#yearSlider").val(year_filter);
        $(yearval).text(year_filter);
    } else if (!isNaN(year) && isNaN(year2)) {
        year_filter = year
        $("#yearSlider").val(year_filter);
        $(yearval).text(year_filter);
    } else {
        year_filter1 = year;
        year_filter2 = year2;
        $(yearval).text("Range");
        timeline_timer = clearInterval(timeline_timer);

        is_play_btn = true;
    }
    addMarkers();
}

function addMarkers() {
    if (clusters.length == 0) {
        console.log("Called addMarkers before data load")
        return;
    }

    isDrawn = false;
    //disableMap(true);
    if (overlay != null && map != null) {
        overlay.setMap(null);
        overlay = null;
    }
    overlay = new google.maps.OverlayView();

    const zoomlevel = map.getZoom();

    const clusterLevel = zoomLevelToClusterLevel(zoomlevel)
    let data = clusters[clusterLevel]

    if (data === undefined) {
        console.log("Data undefined")
        return;
    }

    const camera_bounds = map.getBounds();


    //console.log(data)
    data = Object.keys(data).filter(latlng => {
            const lat = data[latlng][0].latitude
            const lng = data[latlng][0].longitude
            let google_LatLng = new google.maps.LatLng(lat, lng);
            if (camera_bounds.contains(google_LatLng)) {
                //console.log(lat,lng,"inbounds")
                return true;
            }
            //console.log(lat,lng,"outbounds")
            return false;
        })
        .reduce((rows, key) => {
            const cluster_points = data[key].filter(d => {
                const { iyear, gname } = d

                    if(user_select) {
                        let found = false;
                        for (s in selection) {
                            if(selection[s] === gname) {
                                found = true;
                                break;
                            }
                        }
                        if(!found) {
                            return false;
                        }
                    }
                
                if (year_filter1 != null &&
                    year_filter2 != null &&
                    year_filter1 <= iyear &&
                    year_filter2 >= iyear
                ) {
                    return true;
                }

                if (year_filter == iyear) {
                    return true;
                }



                return false;
            })

            if (cluster_points.length === 0) {
                return rows;
            }

            const { latitude, longitude } = cluster_points[0]

            const count = cluster_points.length

            return [...rows, { latitude, longitude, count, points: cluster_points }]
        }, [])

    data.sort((a, b) => a.count - b.count)

    const max = Math.max(...data.map(d => d.count))

    data = data.map(d => ({ ...d, max }))


    //console.log(camera_bounds)

    //console.log(data)

    // Add the container when the overlay is added
    overlay.onAdd = function () {
        layer = d3.select(this.getPanes().overlayMouseTarget)
            .append("div")
            .attr("class", "attacks")

        overlay.draw = function () {
            var projection = this.getProjection();

            var marker = layer.selectAll("svg")
                .data(d3.entries(data))
                .each(transform) // update existing markers
                .enter().append("svg")
                .each(transform)
                .style("width", function (d) {
                    x = node_padding_d3(d)
                    return x * 2.7
                })
                .style("height", function (d) {
                    x = node_padding_d3(d)
                    return x * 2.7
                })

            // Add a circle.
            var circle = marker.append("circle")
                .attr("r", node_padding_d3)
                .attr("cx", function (d) {
                    x = node_padding_d3(d)
                    return x + 3
                })
                .attr("cy", function (d) {
                    x = node_padding_d3(d)
                    return x + 3
                })
                .style("fill", d => node_color_d3(d))
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut)
                .on("click", handle_node_click_open_table)
                .style("cursor", "pointer")

            // Add a label.
            marker.append("text")
                .attr('text-anchor', 'middle')
                .attr("dominant-baseline", "central")
                .attr("x", function (d) {
                    x = node_padding_d3(d)
                    return x + 2
                })
                .attr("y", function (d) {
                    x = node_padding_d3(d)
                    return x - 1
                })
                .attr("dy", ".33em")
                .attr("pointer-events", "none")
                .attr("fill", "white")
                .text(function (d) { return d.value.count; })

            function transform(d) {
                let lat = parseFloat(d.value.latitude)
                let lang = parseFloat(d.value.longitude)
                const latlng = new google.maps.LatLng(lat, lang);
                const pnt = projection.fromLatLngToDivPixel(latlng);
                return d3.select(this)
                    .style("left", (pnt.x - node_padding_d3(d)) + "px")
                    .style("top", (pnt.y - node_padding_d3(d)) + "px");
            }
        };

    };
    overlay.onRemove = function () {
        layer.selectAll("svg").remove();
    }
    overlay.setMap(map);     // Bind our overlay to the map…
    //disableMap(false);
    isDrawn = true;
}





function handleMouseOver() {
    d3.select(this)
        .attr("r", d => {
            x = node_padding_d3(d);
            return (x * 1.1)
        })
        .style("fill", "black");
}

var handleMouseOut = function () {
    d3.select(this)
        .style("fill", node_color_d3)
        .attr("r", node_padding_d3)
}



function node_color_d3(d) {
    const { max, count } = d.value;
    //const color = d3.rgb(255, 40, 40);
    //const x = Math.floor((d.value.count) * 0.005);
    //return d3.hsl(color).darker(x);
    if (count <= max * 0.05) {
        return d3.rgb(0, 160, 0)
    } else if (count <= max * 0.2) {
        return d3.rgb(234, 117, 0)
    } else {
        return d3.rgb(230, 0, 0)
    }

    const color = d3.rgb(20, 0, 0);
    let x = Math.floor((d.value.count) * 0.05);
    if (x > 1) {
        x = 1;
    }
    return color;
}
function node_padding_d3(d) {
    //return 10;

    let val = d.value.count
    val = Math.log2(val) * 1.5;
    if (val > 25) val = 25;
    if (val < 8) val = 8;
    return val;
}

function handle_node_click_open_table() {
    points_from_click = d3.select(this).data()[0];
    points_array = points_from_click.value.points;

    data_table.clear();
    data_table.rows.add(points_array).draw();

    $('#table_wrapper').show();

    $('#table_wrapper').css("pointer-events", "auto")
    //console.log(points_array)


}

function closeTable() {
    $('#table_wrapper').css("pointer-events", "none")
    $('#table_wrapper').hide();
}


function createCharts() {
    var years = {}
    terror_filtered.forEach(t => {
        if (years.hasOwnProperty(t.iyear) == false) {
            years[t.iyear] = { count: 0 }
        }
        years[t.iyear].count += 1;
    });
    var col1 = Object.keys(years).map(y => {
        return y
    });
    var col2 = Object.keys(years).map(y => {
        return years[y].count
    });

    var chart = c3.generate({
        bindto: '#chart_year_attacks',
        data: {
            x: 'data1',
            columns: [
                ['data1', ...col1],
                ['data2', ...col2]
            ]
        }
    });


    var countries = {}
    terror_filtered.forEach(t => {
        if (countries.hasOwnProperty(t.country_txt) == false) {
            countries[t.country_txt] = { country: t.country_txt, count: 0 }
        }
        countries[t.country_txt].count += 1;
    });

    tempData = []
    tempData = Object.keys(countries).map(c => {
        return countries[c];
    })

    tempData.sort((a, b) => b.count - a.count)
    tempData = tempData.slice(0, 20);

    //console.log(tempData)
    var col1 = tempData.map(y => {
        return y.country
    });
    var col2 = tempData.map(y => {
        return y.count
    });




    //console.log(col1)
    //console.log(col2)

    var chart = c3.generate({
        bindto: '#chart_country_attacks',
        data: {
            x: 'x',
            labels: true,
            columns: [
                ['x', ...col1],
                ['data2', ...col2]
            ],

            type: 'bar'
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    rotate: 50,
                    multiline: false
                },
            }
        },

    });



    var countries = {}
    terror_filtered.forEach(t => {
        if (countries.hasOwnProperty(t.country_txt) == false) {
            countries[t.country_txt] = { country: t.country_txt, count: 0 }
        }
        countries[t.country_txt].count += 1;
    });


    tempData = []
    tempData = Object.keys(countries).map(c => {
        return countries[c];
    })

    tempData.sort((a, b) => a.count - b.count)
    tempData = tempData.slice(20, 40);

    //console.log(tempData)
    var col1 = tempData.map(y => {
        return y.country
    });
    var col2 = tempData.map(y => {
        return y.count
    });




    //console.log(col1)
    //console.log(col2)

    var chart = c3.generate({
        bindto: '#chart_country_noattacks',
        data: {
            x: 'x',
            labels: true,
            columns: [
                ['x', ...col1],
                ['data2', ...col2]
            ],

            type: 'bar'
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    rotate: 50,
                    multiline: false
                },
            }
        },

    });



    months = {}

    terror_filtered.forEach(t => {
        if (months.hasOwnProperty(t.imonth) === false) {
            months[t.imonth] = { count: 0 }
        }
        months[t.imonth].count += 1;
    });
    var col1 = Object.keys(months).map(y => {
        return y
    });
    var col2 = Object.keys(months).map(y => {
        return months[y].count
    });

    var chart = c3.generate({
        bindto: '#chart_month_attacks',
        data: {
            x: 'data1',
            columns: [
                ['data1', ...col1],
                ['data2', ...col2]
            ]
        }
    });











    var groups = {}

    terror_filtered.forEach(t => {
        if (groups.hasOwnProperty(t.gname) == false) {
            groups[t.gname] = { g: t.gname, count: 0 }
        }
        groups[t.gname].count += 1;
    });

    tempData = []
    tempData = Object.keys(groups).map(c => {
        //thing = countries[c];
        return groups[c];
    })

    tempData.sort((a, b) => b.count - a.count)
    tempData = tempData.slice(1, 10);

    //console.log(tempData)
    var col1 = tempData.map(y => {
        return y.g
    });
    var col2 = tempData.map(y => {
        return y.count
    });




    //console.log(col1)
    //console.log(col2)

    var chart = c3.generate({
        bindto: '#chart_group_attacks',
        data: {
            x: 'x',
            labels: true,
            columns: [
                ['x', ...col1],
                ['data2', ...col2]
            ],

            type: 'bar'
        },
        axis: {
            x: {
                type: 'category',
                tick: {
                    rotate: 50,
                    multiline: false
                },
            }
        },

    });



    // var countries = {}
    // terror_filtered.forEach(t => {
    //     const { iyear, country_txt } = t
    //     if (country_txt == null || iyear == null) {
    //         return;
    //     }

    //     if (countries.hasOwnProperty(country_txt) === false) {
    //         countries[country_txt] = {}
    //     }
    //     let country = countries[country_txt]
    //     x = iyear
    //     if (country.hasOwnProperty(iyear) === false) {
    //         country[x] = {year: x, count: 0}
    //     }
    //     country.count += 1;
    // });

    // var col1 = Object.keys(countries).map(c => {
    //     return c
    // });
    // console.log(col1)

    // var col2 = Object.keys(countries).map(c => {
    //     return c.count
    // });

    // var col3 = Object.keys(countries).map(c => {
    //     return c.year
    // });
    // console.log(col2)
    // console.log(col3)


    // var chart = c3.generate({
    //     bindto: '#chart_country__yearattacks',
    //     data: {
    //         x:'x',
    //         columns: [
    //             ['x', ...col3],
    //             ['data2', ...col1],

    //         ]
    //     }
    // });






}

function createBar1SVGNotUsed() {

    var data = [4, 8, 15, 16, 23, 42];

    var width = 420,
        barHeight = 20;

    var scaleBar = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .range([0, width]);

    var chart = d3.select(".chart")
        .attr("width", width)
        .attr("height", barHeight * data.length);

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(0," + i * barHeight + ")"; });

    bar.append("rect")
        .attr("width", scaleBar)
        .attr("height", barHeight - 1);

    bar.append("text")
        .attr("x", function (d) { return scaleBar(d) - 3; })
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .text(function (d) { return d; });
}