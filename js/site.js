var findme_map = L.map('findme-map')
    .setView([37.383333, -5.983333], 12),
    osmUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    osmAttrib = '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
    osm = L.tileLayer(osmUrl, {minZoom: 2, maxZoom: 18, attribution: osmAttrib}).addTo(findme_map),
    category_data = [];
    subcategory_data = [];

var findme_marker = L.marker([0,0], {draggable:true}).addTo(findme_map);
findme_marker.setOpacity(0);

if (location.hash) location.hash = '';

$.ajax('./categories.json').success(function(data){
    category_data = data;
});

$("#category").select2({
    query: function (query) {
        var data = {results: []}, i;
        for (i = 0; i < category_data.length; i++) {
            var children_json = category_data[i].children;
            var children = [];
            for(var j=0; j < children_json.length; j++){
                if (query.term.length === 0 || children_json[j].toLowerCase().indexOf(query.term.toLowerCase()) >= 0) {
                    children.push({id: children_json[j], text:children_json[j]});
                }
            }
            if(children.length != 0){
                data.results.push({
                    text: category_data[i].text,
                    children: children
                });
            }
        }
        query.callback(data);
    }
});

$("#find").submit(function(e) {
    e.preventDefault();
    $("#couldnt-find").hide();
    var address_to_find = $("#address").val();
    if (address_to_find.length === 0) return;
    var qwarg = {
        format: 'json',
        q: address_to_find
    };
    var url = "http://nominatim.openstreetmap.org/search?" + $.param(qwarg);
    $("#findme h4").text("Searching...");
    $("#findme").addClass("loading");
    $.getJSON(url, function(data) {
        if (data.length > 0) {
            var chosen_place = data[0];
            console.log(chosen_place);

            var bounds = new L.LatLngBounds(
                [+chosen_place.boundingbox[0], +chosen_place.boundingbox[2]],
                [+chosen_place.boundingbox[1], +chosen_place.boundingbox[3]]);

            findme_map.fitBounds(bounds);

            findme_marker.setOpacity(1);
            findme_marker.setLatLng([chosen_place.lat, chosen_place.lon]);

            $('#instructions').html('We found it! Click and drag the marker to sit on your business, then you are ready to <a href="#details">add details to your business listing</a>.');
            $('.step-2 a').attr('href', '#details');
        } else {
            $('#instructions').html('<strong>We couldn\'t find your address.</strong> Try searching for your street or city without the address.');
        }
        $("#findme").removeClass("loading");
    });
});

$(window).on('hashchange', function() {
    if (location.hash == '#details') {
        $('#collect-data-step').removeClass('hide');
        $('#address-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').addClass('on-2');
        $('.steps').removeClass('on-3');
    } else if (location.hash == '#done') {
        $('#confirm-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#address-step').addClass('hide');
        $('.steps').addClass('on-3');
    } else {
        $('#address-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').removeClass('on-2');
        $('.steps').removeClass('on-3');
    }
    findme_map.invalidateSize();
});

$("#collect-data-done").click(function() {
    location.hash = '#done';

    var note_body = "onosm.org submitted note from a business:\n" +
        "name: " + $("#name").val() + "\n" +
        "phone: " + $("#phone").val() + "\n" +
        "website: " + $("#website").val() + "\n" +
        "twitter: " + $("#twitter").val() + "\n" +
        "hours: " + $("#opening_hours").val() + "\n" +
        "category: " + $("#category").val() + "\n" +
        "address: " + $("#address").val(),
        latlon = findme_marker.getLatLng(),
        qwarg = {
            lat: latlon.lat,
            lon: latlon.lng,
            text: note_body
        };

    $.post('http://api.openstreetmap.org/api/0.6/notes.json', qwarg);
});
