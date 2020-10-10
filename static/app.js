// need to create a simple viz using d3.json(`/whatever_route`).then(function(something) {})
// let allowCrossDomain = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', "*");
//     res.header('Access-Control-Allow-Headers', "*");
//     next();
//   }
// //app.use(allowCrossDomain);

// d3.select("#bar-plot").text("hello world");

// var test = [1,2,3]

fetch(`/electric`, {mode: "no-cors"})
    .then(function(response) {
        // console.log(response);
        var r = response.json();
        // console.log("response:");
        // console.log(r);
        return r;
    }).then(function(car_data){
        // console.log("data:");
        console.log(car_data[0]);
        passCarData(car_data);
});
console.log("middle");
function passCarData(car_data) {
    fetch(`/stations`, {mode: "no-cors"})
        .then(function(response) {
            return response.json();
        }).then(function(station_data){
            console.log(station_data[0]);
            passStationData(car_data, station_data);
    })
};
function passStationData(car_data, station_data) {

    d3.json(`static/WA_counties_geo.json`, function(geo) {
        function onEachFeature(feature, layer) {
            layer.bindPopup("<h3>" + feature.properties.NAME + "</h3>");
        }
        console.log(geo.features[0]);
        var geolayer = L.geoJSON(geo.features, {
            onEachFeature: onEachFeature
        });
        createMap(car_data, station_data, geolayer);
    })
}

console.log("end");
function createMap(car_data, station_data, geo) {
    // Define streetmap and darkmap layers
    var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/streets-v11",
        accessToken: API_KEY
    });
    
    var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "dark-v10",
        accessToken: API_KEY
    });
    
    // Define a baseMaps object to hold our base layers
    var baseMaps = {
        "Street Map": streetmap,
        "Dark Map": darkmap
    };
    
    // An array which will be used to store created stationMarkers
    var stationMarkers = [];
    
    for (var i = 0; i < station_data.length; i++) {
        var s = station_data[i]
        // loop through the station array, create a new marker, push it to the stationMarkers array
        stationMarkers.push(
        L.marker([s.lat, s.long])
        .bindPopup("<h3>" + s.address + 
        "</h3> <hr> <h3>Number of outlet types: " + s.outlets + 
        "</h3> <hr> <h3>Operational status: " + s.status + "</h3>")
        );
    } 
    
    // Add all the stationMarkers to a new layer group.
    // Now we can handle them as one group instead of referencing each individually
    var stationLayer = L.layerGroup(stationMarkers);
    var heat = heatMap(car_data);

    // Create overlay object to hold our overlay layer
    var overlayMaps = {
        counties: geo,
        stations: stationLayer,
        cars: heat
    };
    
    // Create our map, giving it the streetmap and earthquakes layers to display on load
    var myMap = L.map("nav-link", {
        center: [
        47.88, -120.64
        ],
        zoom: 7.25,
        layers: [streetmap, geo]
    });

    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
      }).addTo(myMap);
}

function heatMap(data) {
    var heatArray = [];
    for (var i = 0; i < data.length; i++) {
      var str = data[i].vehicle_location;
      if (str) {
        var arr = str.split(" ");
        var long = arr[1].substring(1);
        var lat = arr[2].substring(0, arr[2].length - 1);
        // "+" to make sure a string becomes a numeric value
        heatArray.push([+lat, +long]);
      }
    }
    var heat = L.heatLayer(heatArray, {
      radius: 20,
      blur: 35
    });
    return heat;
  }