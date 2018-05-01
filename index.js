let map = undefined;
var overlay = undefined;
let yearFilter = undefined;
let isPlayBtn = true;
let timer = undefined;
let isDrawn = true;
let updateFrequency = 6;
let sec = 0;
let terror = undefined;
let years = {}
const years_original = {}

function initMap() {
    const latlng = { lat: 51.5074, lng: 0.1278 };
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 4,
        center: latlng,
    });

    map.addListener('zoom_changed', function () {
        updateCoords(years);
        console.log("zoom changed")
    });
}

function disableMap(disable) {
    map != null ? map.setOptions({
        draggable: !disable, zoomControl: !disable,
        scrollwheel: !disable, disableDoubleClickZoom: disable
    })
        : console.log("map not created");
}

/* function createGoogleMapPointer(lat, lng) {
    var myLatLng = { lat, lng };
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'Hello World!'
    });
} */


$(document).ready(() => {
    yearFilter = $("#yearSlider").prop('min');
    $("#yearSlider").val(yearFilter);
    $("#yearSlider").change(e => {
        yearFilter = e.target.value;
        addMarkers();
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
            addMarkers();
            yearFilter++;
        }
        sec++;
    }
}

d3.csv("/data/terrorism.csv", function (error, data) {
    if (error) throw error;
    terror = data;
    loadData();
});




//shift alt f 
function updateCoords(input) {
    let zoomlevel = map.getZoom();

    var coords = input[yearFilter];
    console.log(coords);
    x = (Object.keys(coords).slice(1, 5))
    x.forEach(coord => {
        //let { coord_lat, coord_lng, count } = c;
        //zoomlevel > 2 ? zoomlevel = 2 : zoomlevel;
        //zoomlevel < 0 ? zoomlevel = 0 : zoomlevel;
        coords[coord].coord_lng = coords[coord].coord_lng - 1          //c.coord_lat % 3
        coords[coord].coord_lat = coords[coord].coord_lng - 1              //c.coord_lng % 3
        //console.log(c)

        //coords[c].coord_lat 
        // const search_coord_string = coord_lat + "," + coord_lng

        //if (coords[search_coord_string] === undefined) {
        //   coords[search_coord_string] = { coord_lat, coord_lng, count: 0 }
        // }
        // coords[search_coord_string].count += 1;
    

    //  addMarkers(yearFilter)

    })

    console.log(coords);
    


}

function loadData() {
    //console.log(terror);
    terror.forEach(d => {
        const { iyear, country, city, latitude, longitude } = d;

        //data filtering 
        if (!latitude || !longitude || !iyear) {
            return;
        }

        if (years_original[iyear] == undefined) {
            years_original[iyear] = {}
        }

        const coords = years_original[iyear];

        let coord_lat = parseFloat(latitude).toFixed(0)
        let coord_lng = parseFloat(longitude).toFixed(0)

        /////////////////////////////////////////////////////////
        //  coord_lat -= coord_lat % 3
        //  coord_lng -= coord_lng % 3
        /////////////////////////////////////////////////////////


        const search_coord_string = coord_lat + "," + coord_lng

        if (coords[search_coord_string] === undefined) {
            coords[search_coord_string] = { coord_lat, coord_lng, count: 0 }
        }
        coords[search_coord_string].count += 1;
    });
    years = years_original
    addMarkers()
}


function addMarkers() {
    isDrawn = false;
    //disableMap(true);
    if (overlay != null) {
        overlay.setMap(null);
    }
    overlay = new google.maps.OverlayView();

    data = []

    const coords = years[yearFilter]

    if (coords == undefined) {
        //console.log("Coords for year ", yearFilter, "undefined")
        isDrawn = true;
        return;
    }

    Object.keys(coords).forEach(coord => {
        const d = coords[coord]
        data.push(d)
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
                if (val > 20) val = 20;
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
                let lat = d.value.coord_lat;
                let lang = d.value.coord_lng;
                if (map.getZoom <= 3) {
                    lat -= lat % zoomlevel * 2;
                    lang -= lang % zoomlevel * 2;
                }
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