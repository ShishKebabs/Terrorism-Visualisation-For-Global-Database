let map = undefined;
var overlay = undefined;
let yearFilter = undefined;
let isPlayBtn = true;
let timer = undefined;
let isDrawn = true;
let updateFrequency = 6;
let sec = 0;
let terror = undefined;
let currentGMapZoom = 5;
let bounds_check_time = 0;
let zoom_check_time = 0;
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
    terror = data;
    if (loadData()) {
        if (map != null) {
            addMarkers(currentGMapZoom)
        }
    }
});

camera_bounds = 0

function initMap() {
    const latlng = { lat: 51.5074, lng: 0.1278 };
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 4,
        center: latlng,
    });
    currentGMapZoom = map.getZoom();
    map.addListener('zoom_changed', function () {
        currentGMapZoom = map.getZoom();
        //console.log(currentGMapZoom)

        window.clearTimeout(zoom_check_time);
        zoom_check_time = window.setTimeout(function () {
            addMarkers(currentGMapZoom);
        }, 200);
    });


    google.maps.event.addListener(map, 'bounds_changed', function () {

        camera_bounds = map.getBounds();
        //var ne = camera_bounds.getNorthEast();
        //var sw = camera_bounds.getSouthWest();
        //console.log(ne.lat());
        // console.log(ne.lng());
        // console.log(sw.lat());
        // console.log(sw.lng());
        //console.log(camera_bounds)


        window.clearTimeout(bounds_check_time);
        bounds_check_time = window.setTimeout(function () {
            addMarkers(currentGMapZoom)
        }, 100);
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
    yearFilter = $("#yearSlider").prop('min');
    $("#yearSlider").val(yearFilter);
    $("#yearSlider").change(e => {
        yearFilter = e.target.value;
        addMarkers(currentGMapZoom);
        console.log(yearFilter);
    });
    $("#playPause").click(() => {
        if (isPlayBtn) {
            timer = setInterval(myTimer, 500);
            isPlayBtn = false;
        } else {
            timer = clearInterval(timer);
            isPlayBtn = true;
        }
    });
    $("#fastForward").click(() => {
        if (updateFrequency > 1) {
            updateFrequency -= 0.5;
        }
    });
    $("#slowDown").click(() => {
        if (updateFrequency < 60) {
            updateFrequency += 0.5;
        }
    });
})


function myTimer() {
    if (isDrawn) {
        if (sec >= updateFrequency) {
            sec = 0;
            if (yearFilter > $("#yearSlider").prop('max')) {
                yearFilter = $("#yearSlider").prop('min');
            }
            $("#yearSlider").val(yearFilter);
            addMarkers(currentGMapZoom);
            yearFilter++;
        }
        sec++;
    }
}
//loop over terror x times
//each loop store all the different filterings

const data_per_zoom = []
const terrorFiltered = []
const years_per_zoom = []
let dataLoaded = false;
function loadData() {

    terror.forEach(d => {
        const { iyear, country, city, latitude, longitude } = d;
        //data filtering 
        if (!latitude || !longitude || !iyear) {
            return;
        }
        terrorFiltered.push(d)
    });

    //console.log(terror)
    max_zoom = 25;

    for (i = max_zoom; i >= 0; i--) {
        data_per_zoom[i] = terrorFiltered
    }
    cluster = 0;

    for (i = max_zoom; i >= 0; i--) {
        let years = {}
        data_per_zoom[i].forEach(d => {
            const { iyear, country, city, latitude, longitude } = d;

            if (years[iyear] == undefined) {
                years[iyear] = {}
            }

            let coord_lat = parseFloat(latitude).toFixed(2) //change to 1 when doesnt lag
            let coord_lng = parseFloat(longitude).toFixed(2)

            if (cluster > 0) {
                offset_lat = (coord_lat % cluster);
                offset_lng = (coord_lng % cluster);
            } else {
                offset_lat = 0;
                offset_lng = 0;
            }
            coord_lat -= offset_lat
            coord_lng -= offset_lng

            d.latitude = coord_lat
            d.longitude = coord_lng


            const coords = years[iyear];

            //bin
            const search_coord_string = coord_lat + "," + coord_lng
            if (coords[search_coord_string] === undefined) {
                coords[search_coord_string] = {
                    coord_lat, coord_lng,
                    latitude, longitude,
                    count: 0,
                }
            }

            coords[search_coord_string].count += 1;
        });
        years_per_zoom[i] = years
        if (i <= 7) {
            cluster += 1;
            if (i <= 4) {
                cluster += 9;
            }
        }
    }

    years_per_zoom.forEach(years => {
        for (iyear in years) {
            const year = years[iyear]
            for (ipoint in year) {
                const point = year[ipoint];
                point.coord_lat = point.latitude
                point.coord_lng = point.longitude
            }
        }
    })
    console.log(years_per_zoom)

    return (true);
}


function addMarkers(zoomlevel, bounds) {
    isDrawn = false;
    //disableMap(true);
    if (overlay != null) {
        overlay.setMap(null);
    }
    overlay = new google.maps.OverlayView();

    data = []


    const coords2 = years_per_zoom[zoomlevel]
    if (coords2 == null) {
        isDrawn = true;
        return;
    }

    const coords = coords2[yearFilter]

    if (coords == undefined) {
        isDrawn = true;
        return;
    }

    Object.keys(coords).forEach(coord => {
        const d = coords[coord]
        const latlng = new google.maps.LatLng(d.latitude, d.longitude);
        //var center = camera_bounds.getCenter();  // (55.04334815163844, -1.9917653831249726)
        //console.log(coord)
        if (camera_bounds.contains(latlng)) {
            data.push(d)
        }
    })

    data.sort((a, b) => a.count - b.count)

    //console.log(yearFilter, data.length, "data length")

    // Add the container when the overlay is added to the map.
    overlay.onAdd = function () {
        layer = d3.select(this.getPanes().overlayLayer).append("div")
            .attr("class", "attacks");

        // Draw each marker as a separate SVG element.
        // We could use a single SVG, but what size would it have?
        overlay.draw = function () {
            var projection = this.getProjection();

            const node_padding = (d) => {
                let val = d.value.count
                val = Math.log2(val) * 2;
                if (val > 17) val = 17;
                if (val < 8) val = 8;
                return val;
            }

            color = d3.rgb(255, 80, 80);
            ncolor = d => {
                const x = Math.floor((d.value.count) * 0.05);
                return d3.hsl(color).darker(x);
            };

            var marker = layer.selectAll("svg")
                .data(d3.entries(data))
                .each(transform) // update existing markers
                .enter().append("svg")
                .each(transform)
            // Add a circle.
            marker.append("circle")
                .attr("r", node_padding)
                .attr("cx", node_padding)
                .attr("cy", node_padding)
                .style('fill', ncolor);
            // Add a label.
            marker.append("text")
                .attr("text-anchor", "middle")
                .attr("x", node_padding)
                .attr("y", node_padding)
                .attr("dy", ".31em")
                .attr("fill", "white")
                .text(function (d) { return d.value.count; });

            function transform(d) {
                let lat = parseFloat(d.value.coord_lat)
                let lang = parseFloat(d.value.coord_lng)
                const latlng = new google.maps.LatLng(lat, lang);
                const pnt = projection.fromLatLngToDivPixel(latlng);
                return d3.select(this)
                    .style("left", (pnt.x - node_padding(d)) + "px")
                    .style("top", (pnt.y - node_padding(d)) + "px");
            }
        };
        overlay.onRemove = function () {
            layer.selectAll("svg").remove();
        }
    };
    overlay.setMap(map);     // Bind our overlay to the map…
    //disableMap(false);
    isDrawn = true;
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