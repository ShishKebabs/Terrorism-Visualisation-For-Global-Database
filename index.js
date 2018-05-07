let data_table = null;
let map = undefined;
var overlay = undefined;
let year_filter = undefined;
let is_play_btn = true;
let timeline_timer = undefined;
let isDrawn = true;
let update_timeline_freq = 10;
let bounds_check_freq = undefined;
let terror_filtered = []
//const terror_per_zoom = []
//const years_per_zoom = []
let clusters = []
/* 

In Add markers, only push variables to data which fall within the camera coordinates


*/

/* function createGoogleMapPointer(lat, lng) {
    var myLatLng = { lat, lng };
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'Hello World!'
    });
} */
d3.csv("/data/terrorism.csv", function (error, data) {
    if (error) throw error;

    console.log("File load complete")

    loadData(data)

    if (map != null) {
        addMarkers();
        createChart();
    }
});


function initMap() {
    const latlng = { lat: 51.5074, lng: 0.1278 };
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 4,
        center: latlng,
    });

    //google.maps.event.addListenerOnce(map, 'idle', function () {
    //currentGMapZoom = map.getZoom();
    //camera_bounds = map.getBounds(); 
    //});


    google.maps.event.addListener(map, 'bounds_changed', function () {
        //window.clearTimeout(bounds_check_freq);
        //bounds_check_freq = window.setTimeout(function () {
        addMarkers();
        //}, 20);
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
    $("#yearSlider").change(e => {
        year_filter = e.target.value;
        addMarkers();
        console.log(year_filter);
    });
    $("#playPause").click(() => {
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
            { "title": "Attack Type", data: 'attacktype1_txt' },
            { "title": "Target", data: 'targtype1_txt' },
            { "title": "Target Type", data: 'target1' },
            { "title": "Nationality", data: 'natlty1_txt' },
            { "title": "Group", data: 'gname' }
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
            addMarkers();
            year_filter++;
        }
        timeline_iteration++;
    }
}
//loop over terror x times
//each loop store all the different filterings


function loadData(terror) {
    //console.log(terror)

    terror_filtered = terror.filter(d => {
        const { iyear, country, city, latitude, longitude } = d;
        //data filtering 
        if (!latitude || !longitude || !iyear) {
            return false;
        }
        return true;
    })//.slice(0,10000)

    for(let clustersIndex = 1; clustersIndex <= 2048; clustersIndex *= 2) {
        const modulo = clustersIndex/256;

        const cluster = clusterRawData(terror_filtered,modulo)

        clusters[clustersIndex] = cluster
    }

    console.log("Cluster load complete")
}

function clusterRawData(input,modulo) {
    return input.reduce((clusters,point) => {
        const { latitude,longitude } = point;

        const cluster_latitude = latitude - latitude%modulo
        const cluster_longitude = longitude - longitude%modulo

        const cluster_index = cluster_latitude+","+cluster_longitude

        if(clusters.hasOwnProperty(cluster_index) === false) {
            clusters[cluster_index] = []
            //console.log("Creating cluster index",cluster_index)
        }

        clusters[cluster_index].push(point)

        return clusters;
    },{})
}

let year_filter1 = null;
let year_filter2 = null;

function filter() {
    new_data = []
    let year = $("#year_search").val();


    if (year != null) {
        year_filter1 = $("#year_search").val();
    }

    let year2 = $("#year_search2").val();
    if (year != null) {
        year_filter2 = $("#year_search2").val();
    }

    addMarkers();
}

function zoomLevelToClusterLevel(zoomLevel) {
    console.log("Zoom Level in:",zoomLevel)

    //3 => 32
    //4 => 16
    //5 => 8
    //6 => 4
    //7 => 2
    //8 => 1
    //const clusterLevel = Math.floor((1/zoomLevel) * 64)

    //const clusterLevel = Math.floor(7.1076 + 0.9710 * Math.log(zoomLevel))

    const ZOOM_LEVELS = 14
    const A = Math.pow(2,ZOOM_LEVELS)

    const clusterLevel = Math.floor(A * Math.pow(0.5,zoomLevel))

    console.log("Cluster level out:",clusterLevel)

    return clusterLevel
}

function addMarkers() {
    if(clusters.length === 0) {
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

    if(data === undefined) {
        console.log("Data undefined")
        return;
    }

    const camera_bounds = map.getBounds();
        
    data = Object.keys(data)
        .filter(latlng => {
            const latlng_split = latlng.split(",")

            const lat = latlng_split[0]
            const lng = latlng_split[1]

            
            let google_LatLng = new google.maps.LatLng(lat, lng);
            if (camera_bounds.contains(google_LatLng)) {
                //console.log(lat,lng,"inbounds")
                return true;
            }

            //console.log(lat,lng,"outbounds")
            return false;
        })
        .reduce((rows,key) => {
            const cluster_points = data[key].filter(d => {
                const {iyear} = d

                if (year_filter1 !== null &&
                    year_filter2 != null &&
                    year_filter1 <= iyear && 
                    year_filter2 >= iyear
                ) {
                    return true;
                }

                if(year_filter == iyear) {
                    return true;
                }
                return false;
            })

            if(cluster_points.length === 0) {
                return rows;
            }

            const { latitude, longitude } = cluster_points[0]

            const count = cluster_points.length

            return [...rows,{latitude,longitude,count,points:cluster_points}]
        },[])

    data.sort((a, b) => a.count - b.count)

    console.log("Marker load complete")

    //console.log(camera_bounds)

    //console.log(data)

    // Add the container when the overlay is added to the map.
    overlay.onAdd = function () {
        layer = d3.select(this.getPanes().overlayMouseTarget)
            .append("div")
            .attr("class", "attacks")

        // Draw each marker as a separate SVG element.
        // We could use a single SVG, but what size would it have?
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

            //.attr("class", "marker")

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
                .style("fill", node_color_d3)
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
        .style("fill", "orange");
}

var handleMouseOut = function () {
    d3.select(this)
        .style("fill", node_color_d3)
        .attr("r", node_padding_d3)
}



function node_color_d3(d) {
    const color = d3.rgb(255, 40, 40);
    const x = Math.floor((d.value.count) * 0.005);
    return d3.hsl(color).darker(x);
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


function createChart() {
    let years = {}
    terror_filtered.forEach(t => {
        if (years.hasOwnProperty(t.iyear) === false) {
            years[t.iyear] = { count: 0 }
        }
        years[t.iyear].count += 1;
    });
    let col1 = Object.keys(years).map(y => {
        return y
    });
    let col2 = Object.keys(years).map(y => {
        return years[y].count
    });

    // {year:y, ...years[y] }

    //console.log(x);

    //const d1 = ['data1']
    //const d2 = Object.keys(years)
    //const d4 = d1.concat(d2)

    //console.log(d4)

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







    countries = {}

    terror_filtered.forEach(t => {
        if (countries.hasOwnProperty(t.country_txt) == false) {
            countries[t.country_txt] = { country: t.country_txt, count: 0 }
        }
        countries[t.country_txt].count += 1;
    });

    tempData = []
    tempData = Object.keys(countries).map(c => {
        //thing = countries[c];
        return countries[c];
    })

    tempData.sort((a, b) => b.count - a.count)
    tempData = tempData.slice(0, 25);

    //console.log(tempData)
    col1 = tempData.map(y => {
        return y.country
    });
    col2 = tempData.map(y => {
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



    months = {}

    terror_filtered.forEach(t => {
        if (months.hasOwnProperty(t.imonth) === false) {
            months[t.imonth] = { count: 0 }
        }
        months[t.imonth].count += 1;
    });
    col1 = Object.keys(months).map(y => {
        return y
    });
    col2 = Object.keys(months).map(y => {
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





}

function createBar1SVG() {

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