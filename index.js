let map = undefined;
var overlay = undefined;

function initMap() {
    const latlng = { lat: 51.5074, lng: 0.1278 };
    map = new google.maps.Map(d3.select("#map").node(), {
        zoom: 4,
        center: latlng,
        //mapTypeId: google.maps.MapTypeId.SATELLITE 
    });

    map.addListener('zoom_changed', function () {
        //loadData();
        addMarkers(yearFilter);
        console.log("zoom changed")
    });
}




/* function createGoogleMapPointer(lat, lng) {
    var myLatLng = { lat, lng };
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'Hello World!'
    });
} */

let terrorism = undefined;
d3.csv("/data/terrorism.csv", function (error, data) {
    if (error) throw error;
    terrorism = data;
    loadData();
});

const years = {}


// function updateCoords() {
//     let zoomlevel = map.getZoom();

//     years.forEach(y => {

//         const coords = years[y];

//         coords.forEach(c => {
//             //zoomlevel > 2 ? zoomlevel = 2 : zoomlevel;
//             //zoomlevel < 0 ? zoomlevel = 0 : zoomlevel;

//             //console.log(zoomlevel);
//             cl_lat2 -= cl_lat % zoomlevel
//             cl_lng2 -= cl_lng % zoomlevel
//             const cl_coord = cl_lat + "," + cl_lng
//             coords[cl_coord] = {cl_lat = cl_lat2, cl_lng = cl_lng2}
//         });
//     })


// }

function loadData() {
    console.log(terrorism);
    terrorism.forEach(d => {
        const { iyear, country, city, latitude, longitude } = d;

        if (!latitude || !longitude || !iyear) {
            return;
        }

        if (years[iyear] == undefined) {
            years[iyear] = {}
        }

        const coords = years[iyear];

        let cl_lat = parseFloat(latitude).toFixed(0)
        //cl_lat -= cl_lat % 1
        let cl_lng = parseFloat(longitude).toFixed(0)
        //cl_lng -= cl_lng % 1
        const cl_coord = cl_lat + "," + cl_lng

        if (coords[cl_coord] === undefined) {
            coords[cl_coord] = { cl_lat, cl_lng, count: 0 }
        }

        const coord = coords[cl_coord];

        coord.count += 1;
    });
}




let yearFilter = undefined;
let timer = undefined;
let isDrawn = true;
let updateFrequency = 3;
let sec = 0;
function myTimer() {
    if (isDrawn) {
        if (sec >= updateFrequency) {
            sec = 0;
            if (yearFilter > $("#yearSlider").prop('max')) {
                yearFilter = $("#yearSlider").prop('min');
            }
            $("#yearSlider").val(yearFilter);
            addMarkers(yearFilter);
            yearFilter++;
        }
        sec++;
    }
}

let isPlayBtn = true;
$(document).ready(() => {
    yearFilter = $("#yearSlider").prop('min');
    $("#yearSlider").val(yearFilter);
    $("#yearSlider").change(e => {
        yearFilter = e.target.value;
        addMarkers(yearFilter);
        console.log(yearFilter);
    });
    $("#playPause").click(() => {
        if (isPlayBtn) {
            timer = setInterval(myTimer, 100);
            isPlayBtn = false;
        } else {
            timer = clearInterval(timer);
            isPlayBtn = true;
        }
    });
    $("#fastForward").click(() => {
        if (updateFrequency > 1) {
            updateFrequency--;
        }
    });
    $("#slowDown").click(() => {
        if (updateFrequency < 360) {
            updateFrequency++;
        }
    });
})





function disableMap(disable) {
    map != null ? map.setOptions({
        draggable: !disable, zoomControl: !disable,
        scrollwheel: !disable, disableDoubleClickZoom: disable
    })
        : console.log("map not created");
}


function addMarkers(yearFilter) {
    isDrawn = false;
    //disableMap(true);
    if (overlay != null) {
        overlay.setMap(null);
    }
    overlay = new google.maps.OverlayView();

    data = []

    const coords = years[yearFilter]

    if (coords == undefined) {
        console.log("Coords for year ", yearFilter, "undefined")
        isDrawn = true;
        return;
    }

    Object.keys(coords).forEach(coord => {
        const d = coords[coord]
        data.push(d)
    })

    data.sort((a,b) => a.count - b.count )

    console.log(yearFilter, data.length, "data length")

    // Add the container when the overlay is added to the map.
    overlay.onAdd = function () {
        layer = d3.select(this.getPanes().overlayLayer).append("div")
            .attr("class", "attacks");

        // Draw each marker as a separate SVG element.
        // We could use a single SVG, but what size would it have?
        overlay.draw = function () {
            var projection = this.getProjection();

            const padding = (d) => {
                let val = d.value.count

                val = Math.log2(val) * 2;

                if (val > 20) val = 20;
                if (val < 8) val = 8;

                return val;
            }

            var marker = layer.selectAll("svg")
                .data(d3.entries(data))
                .each(transform) // update existing markers
                .enter().append("svg")
                .each(transform)
            // .attr("class", "marker");

            color = d3.rgb(255, 80, 80);
            ncolor = d => {
                const x = Math.floor((d.value.count) * 0.05);
                return d3.hsl(color).darker(x);
            };


            // Add a circle.
            marker.append("circle")
                .attr("r", padding)
                .attr("cx", padding)
                .attr("cy", padding)
                .style('fill', ncolor);


            // Add a label.
            marker.append("text")
                .attr("text-anchor", "middle")
                .attr("x", padding)
                .attr("y", padding)
                .attr("dy", ".31em")
                .attr("fill", "white")
                .text(function (d) { return d.value.count; });

            function transform(d) {
                let lat = d.value.cl_lat;
                let lang = d.value.cl_lng;

                let zoomlevel = map.getZoom();
                console.log(zoomlevel)
                if(map.getZoom <= 3) {
                    lat -= lat % zoomlevel*2;
                    lang -= lang % zoomlevel*2;                
                }




                const latlng = new google.maps.LatLng(lat, lang);

                const pnt = projection.fromLatLngToDivPixel(latlng);


                return d3.select(this)
                    .style("left", (pnt.x - padding(d)) + "px")
                    .style("top", (pnt.y - padding(d)) + "px");
            }
        };

        overlay.onRemove = function () {
            layer.selectAll("svg").remove();
        }
    };

    // Bind our overlay to the map…
    overlay.setMap(map);
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