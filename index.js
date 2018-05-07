let data_table = null;
let map = undefined;
var overlay = undefined;
let year_filter = undefined;
let is_play_btn = true;
let timeline_timer = undefined;
let isDrawn = true;
let update_timeline_freq = 10;
let bounds_check_freq = undefined;
const terror_filtered = []
const terror_per_zoom = []
const years_per_zoom = []
let current_data = []
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
    if (loadData(data)) {
        if (map != null) {
            addMarkers(current_data);
            createChart();
        }
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
        addMarkers(current_data);
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
        addMarkers(years_per_zoom);
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
            addMarkers(years_per_zoom);
            year_filter++;
        }
        timeline_iteration++;
    }
}
//loop over terror x times
//each loop store all the different filterings




function loadData(terror) {
    //console.log(terror)
    terror.forEach(d => {
        const { iyear, country, city, latitude, longitude } = d;
        //data filtering 
        if (!latitude || !longitude || !iyear) {
            return;
        }
        terror_filtered.push(d)
    });

    //console.log(terror)
    const MAX_ZOOM = 8;

    for (i = MAX_ZOOM; i >= 0; i--) {
        terror_per_zoom[i] = terror_filtered
    }
    node_merge_amount = 0;

    for (i = MAX_ZOOM; i >= 0; i--) {
        let years = {}
        let count_per_year_atpos = 0;
        let count_total_atpos = 0;

        if (i <= 1) {
            node_merge_amount = Number.MAX_SAFE_INTEGER;
        } else if (i <= 3) {
            node_merge_amount += 6;
        } else if (i <= 5) {
            node_merge_amount += 3;
        } else if (i <= 7) {
            node_merge_amount += 1;
        }
        terror_per_zoom[i].forEach(d => {
            const { iyear, country, city, latitude, longitude } = d;
            let plot_lat = parseFloat(latitude).toFixed(1)
            let plot_lng = parseFloat(longitude).toFixed(1)

            if (node_merge_amount > 0) {
                offset_lat = (plot_lat % node_merge_amount);
                offset_lng = (plot_lng % node_merge_amount);
            } else {
                offset_lat = 0;
                offset_lng = 0;
            }
            plot_lat -= offset_lat
            plot_lng -= offset_lng

            //d.plot_lat = plot_lat
            //d.plot_lng = plot_lng;

            if (years[iyear] == undefined) {
                years[iyear] = {}
            }

            const coords = years[iyear];
            const search_coord_string = plot_lat + "," + plot_lng
            if (coords[search_coord_string] === undefined) {
                coords[search_coord_string] = {
                    year: iyear,
                    plot_lat, plot_lng,
                    latitude, longitude,
                    points: [],
                    count: 0,
                }
            }
            coords[search_coord_string].points.push(d)
            coords[search_coord_string].count += 1;



            return d
        });
        years_per_zoom[i] = years
    }
    years_per_zoom.forEach(years => {
        for (iyear in years) {
            const year = years[iyear]
            for (ipoint in year) {
                const point = year[ipoint];
                let sumlat = 0, sumlong = 0;
                length = point.points.length
                for (i = 0; i < point.points.length; i++) {
                    sumlat += parseFloat(point.points[i].latitude);
                    sumlong += parseFloat(point.points[i].longitude);
                }
                // console.log(point.points)
                // console.log("length" + length)
                // console.log("sumlat" + sumlat)
                // console.log("sumlong" + sumlong)

                sumlat = sumlat / length;
                sumlong = sumlong / length;

                point.coord_lat = sumlat;
                point.coord_lng = sumlong;
            }
        }
    })

    current_data = years_per_zoom;
    return (true);
}

//new_data = []
let year_filter1 = 0;

function filter() {
    new_data = []
    let year = $("#year_search").val();
    year_filter1 = 0;
    let year_filter2 = 0;

    if (year != null) {
        year_filter1 = $("#year_search").val();
    }

    let year2 = $("#year_search2").val();
    if (year != null) {
        year_filter2 = $("#year_search2").val();
    }

    //console.log(years_per_zoom[map.getZoom()]);


    years_per_zoom.forEach(zoom_level => {
        x = {}
        for (iyear in zoom_level) {
            let year = zoom_level[iyear]
            if (iyear >= year_filter1 && iyear <= year_filter2) {
                x[iyear] = year
                //console.log(current_zoom[iyear])
            }
        }
        new_data.push(x)
    }

    );
    console.log(years_per_zoom)
    console.log(new_data)


    /*
    var newArray = homes.filter(function (el) {
        return el.price <= 1000 &&
            el.sqft >= 500 &&
            el.num_of_beds >= 2 &&
            el.num_of_baths >= 2.5;
    })
*/
    current_data = new_data;
    addMarkers(current_data);
}


function addMarkers(array) {
    isDrawn = false;
    //disableMap(true);
    if (overlay != null && map != null) {
        overlay.setMap(null);
        overlay = null;
    }
    overlay = new google.maps.OverlayView();

    let coords2
    const zoomlevel = map.getZoom();

    coords2 = array[zoomlevel]
    

    if (coords2 == null) {
        isDrawn = true;
        return;
    }
    console.log(year_filter1)
    const coords = coords2[year_filter1]

    if (coords == undefined) {
        isDrawn = true;
        return;
    }


    data = []

    Object.keys(coords).forEach(coord => {
        const d = coords[coord]
        const latlng = new google.maps.LatLng(d.latitude, d.longitude);
        //var center = camera_bounds.getCenter();  // (55.04334815163844, -1.9917653831249726)
        //console.log(coord)
        const camera_bounds = map.getBounds();
        if (camera_bounds.contains(latlng)) {
            data.push(d)
        }
    })

    data.sort((a, b) => a.count - b.count)

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
                let lat = parseFloat(d.value.coord_lat)
                let lang = parseFloat(d.value.coord_lng)
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