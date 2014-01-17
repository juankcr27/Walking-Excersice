var map,
	directionsService = new google.maps.DirectionsService(),
	currentMarker = null,
	previousMarker = null;

$(document).ready(function() {
    var dropbox = document.getElementById('dropbox');
	// init event handlers
	dropbox.addEventListener("dragenter", commonFunction, false);
	dropbox.addEventListener("dragexit", commonFunction, false);
	dropbox.addEventListener("dragover", commonFunction, false);
	dropbox.addEventListener("drop", drop, false);
});

function commonFunction(e) {
	e.stopPropagation();
	e.preventDefault();
}

function drop(e) {
    commonFunction(e);
	var files = e.dataTransfer.files;
	var count = files.length;
	// Only call the handler if 1 or more files was dropped.
	if (count > 0)
		handleFiles(files);
}

function handleFiles(files) {
	var file = files[0],
        $msgContainer = $('#droplabel');
    if(file.name && file.name !== '' && file.name.split('.').pop() !== 'csv'){
		alert('Please drag a csv file');
		return;
    }
	$msgContainer.text('Processing ' + file.name);
	var reader = new FileReader();
	reader.onloadend = function(e) {
		var msg = 'Loaded the file ' + file.name;
	    $msgContainer.text(msg).attr('title', msg);
	    //Display the option to draw the map.

	    var result = parseFileInput(e.target.result);
	    

	    $('#draw-map').click(function(){ 
	    	initializeMap(result);
	    });
	};
	reader.readAsText(file);
}

function parseFileInput(data){
	var coordinates = [];
	data = data.split('\n');
	data.forEach(function (element){
		var parseElement = element.trim().split(','),
			lat = parseElement[0] * 1, lng = parseElement[1] * 1;
		if(!isNaN(lat) && !isNaN(lng))
			coordinates.push(new google.maps.LatLng(lat, lng));
	});

	return coordinates;
}

function initializeMap(coordinatesArray) {	
	var mapOptions = {
		zoom: 16,
		center: new google.maps.LatLng(41.1279983,-73.3653919),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	
	createMarker(coordinatesArray, 0);
	Route(coordinatesArray, map, 0);
}

function createMarker(coordinates, index){
	var position = coordinates[index];
	var marker = new google.maps.Marker({
		position: position,
		map: map,			
		icon: "img/number_" + index + ".png"	
	});	
	
	google.maps.event.addListener(marker, 'click', function() {			
		
		var circle = new google.maps.Circle({
			map: map,
			radius: 100,    // 100 metres
			fillColor: '#AA0000'
		});

		var newCircle = {
			circle: circle,
			index: index,
			position: position
		};

		if(currentMarker === null){
			currentMarker = newCircle;
		}
		else {
			if(previousMarker !== null) {
				previousMarker.circle.setMap(null);
			}
			previousMarker = currentMarker;
			currentMarker = newCircle;

			$('#from').text(previousMarker.index);
			$('#to').text(currentMarker.index);

			$('#message').css('visibility', 'visible');

			var request = {
				origin: previousMarker.position,
			    destination:currentMarker.position,
			    travelMode: google.maps.TravelMode.DRIVING
			  };
			  directionsService.route(request, function(response, status) {
			    if (status == google.maps.DirectionsStatus.OK) {
			    	$('#distance').text(response.routes[0].legs[0].distance.value + ' mts');
			    }
			  });

		}
		
		circle.bindTo('center', marker, 'position');
		
	});
}

function Route(coordinates, map, i) {
	var start = coordinates[i];
	var end = coordinates[i + 1];
	var request = {
		origin:start,
		destination:end,
		travelMode: google.maps.TravelMode.DRIVING
	};
	
	directionsService.route(request, function(result, status) {			
		if (status == google.maps.DirectionsStatus.OK) {			
			var pointsArray = [];
			pointsArray = result.routes[0].overview_path;					
			var flightPath = new google.maps.Polyline({
				path: pointsArray,
				geodesic: true,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 2
			});

			flightPath.setMap(map);
			createMarker(coordinates, i + 1);
		}
		else {
			setTimeout(function(){
				Route(coordinates, map, i);
			}, 700);
		}

		if(i < coordinates.length - 2){
			setTimeout(function(){
				Route(coordinates, map, ++i);
			}, 700);
		}
	});
}