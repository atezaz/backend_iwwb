import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import "../../css/MapComponent.css";
import courseCategoryColors from "../../json/categoryColors.json" ;
import displayCategoryNames from "../../json/categoryDisplayNames.json";



const API_URL = process.env.REACT_APP_API_URL;

function LeafletMap() {
  // useState variables rerender the html everytime there are changed
  const [markerClusterGroup, setMarkerClusterGroup] = useState(null); // all markers are stored inside here
  const [mapInstance, setMapInstance] = useState(null);
  const [markerJson, setMarkerJson] = useState(null); // marker data that is fetched as json
  const [onlineCourses, setOnlineCourses] = useState([]); 
  const [visibleMarkersCount, setVisibleMarkersCount] = useState(0); // counts all visible markers on map
  const [filteredOnlineCourses, setFilteredOnlineCourses] = useState(0); // counts all onlines courses filtered by the search bar

  // variables to build up the map data and save at once in a useState variable once they are completely build
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markersRef = useRef(null); 
  const responseJson = useRef(null);

  // map is showing this location at start if user location is disabled
  let currentPositon_lat = 0;
  let currentPositon_long = 0;
  let center_lat = 50;
  let center_long = 12;
  let center_zoom = 5.5;

  // markerClusterGroup is clustering all markers with the specified options
  markersRef.current = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyDistanceMultiplier: 1.7, // scatter size of the markers

    // modify icons of the clusters depending on courses amount
    iconCreateFunction: function (cluster) {
      var childCount = cluster.getChildCount();

      var c = ' marker-cluster-';
      if (childCount < 100) {
        c += 'small';
      }
      else if (childCount < 3000) {
        c += 'medium';
      }
      else if (childCount  < 10000) {
        c += 'large';
      }
      else if (childCount  >= 10000) {
        c += 'large extra';
      }

      return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
  }})

  // create icon for current location
  const currentPositionIcon = L.divIcon({
    className: 'map-marker',
    iconSize: null,
    html:'<div class="current-position-icon"></div>'
  });

  tileRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // function to created an icon for a course with the colour of the category
  function createCourseCategoryIcon(categoryName)
  {
    var color = courseCategoryColors[categoryName];
    const coursesIcon = L.divIcon({
      className: 'map-marker',
      iconSize: null,
      html:'<div class="courses-icon" style="background:' + color + '"></div>'
    }); 
    return coursesIcon
  }

  // this function is creating all markers from the fetched data
  function createMarkers(data) {
    Object.keys(data).forEach(category => {
      data[category].forEach(markerData => {

        // this if statement checks if the course is a online course
        if (parseFloat(markerData[1]) != 0 && parseFloat(markerData[0]) != 0 ) {

          // here is all the data stored in one marker
          var latitude = markerData[1] === null? 0 : markerData[1]
          var longitude = markerData[1] === null? 0 : markerData[0] 
          var courseLocation = [parseFloat(latitude), parseFloat(longitude)];
          var courseTitle = markerData[2];
          var courseStart = markerData[3];
          var courseProvider = markerData[4];
          var courseStreet = markerData[5];
          var courseCity = markerData[6];
          var courseLink = markerData[7];

          // add popup to markers to show the data stored
          const marker = L.marker(courseLocation, {icon: createCourseCategoryIcon(category)})
          .bindPopup(
            '<div class="container">'
            + '<div class="row">' 
              + '<div class="col-sm-2">'
                + '<img class="icon" src="../../img/icons/book.svg">'
              + '</div>'
              + '<div class="col-sm-10">'
                + courseTitle 
              + '</div>'
            + '</div>'
            + '<br>'
            + '<div class="row">'
              + '<div class="col-sm-2">'
                +'<img class="icon" src="../../img/icons/calendar.svg">'
              + '</div>'
              + '<div class="col-sm-10">'
                + courseStart
              + '</div>'
            + '</div>'
            + '<br>'
            + '<div class="row">'
              + '<div class="col-sm-2">'
                + '<img class="icon" src="../../img/icons/map-pin.svg">'
              + '</div>'
              + '<div class="col-sm-10">'
                + courseProvider + "<br>" + courseStreet + "<br>" + courseCity
              + '</div>'
            + '</div>'
            + '<br>'
            + '<div class="row">'
              + '<div class="col-sm-2">'
                + '<img class="icon" src="../../img/icons/external-link.svg">'
              + '</div>'
              + '<div class="col-sm-10">'
                + '<a href=' + courseLink + " target='_blank'> Kurslink </a>"
              + '</div>'
            + '</div>'
          + '</div>');

          markerClusterGroup.addLayer(marker);

        }
    })})
  }
 
  // function which fetches the marker data
  const fetchData = async () => {
    window.year = sessionStorage.getItem("year");
    const response = await fetch(`${API_URL}/getLocations?year=${window.year}`);
    responseJson.current = await response.json();
    
    // create current position marker if permitted by user
    if (currentPositon_lat != 0 && currentPositon_long != 0) {
      mapInstance.createPane("locationMarker");
      mapInstance.getPane("locationMarker").style.zIndex = 999;
      var currentPositionMarker = L.marker([currentPositon_lat, currentPositon_long],{icon: currentPositionIcon, title: "current location", pane:"locationMarker"}).bindPopup("Aktueller Standort");
      currentPositionMarker.addTo(mapInstance);
    }
    setMarkerJson(responseJson.current);
    createMarkers(responseJson.current);
    mapInstance.fireEvent("moveend");
  }
  
  // function which fetches the online courses data
  const fetchOnlineCourseData  = async () => {
    const response = await fetch(`${API_URL}/getOnlineCourses?year=${window.year}`);
    responseJson.current = await response.json();
    setFilteredOnlineCourses(responseJson.current.length)
    setOnlineCourses(responseJson.current);
  }
  
  // this useEffect function is called once before the DOM is build
  // it is building up the leaeflet map
  useEffect(() => {
      mapRef.current = L.map('map', {
      center: [center_lat, center_long],
      zoom: center_zoom,
      layers: [tileRef.current]
    });
    setMarkerClusterGroup(markersRef.current);
    setMapInstance(mapRef.current);
  },[]);

  // this useEffect function is called once the Map is build
  // it adds all markers and legends to the map
  useEffect(() => {
    if (!mapInstance) return;
    
    if (mapInstance) { 
      // focus the view to the current location
      navigator.geolocation.getCurrentPosition(function(position) {
        currentPositon_lat = position.coords.latitude;
        currentPositon_long = position.coords.longitude;
        mapInstance.flyTo([currentPositon_lat,currentPositon_long], center_zoom + 4 );
      });
      fetchOnlineCourseData();
      fetchData();
      mapInstance.addLayer(markerClusterGroup);

      // add legend to the map
      var legend = L.control({ position: "bottomright" });
      legend.onAdd = function(mapInstance) {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Kategorien</h4>";
          Object.keys(displayCategoryNames).forEach( key => {
            div.innerHTML += '<i style="background: '+ courseCategoryColors[key] +' "></i><span>'+ displayCategoryNames[key] +'</span><br>';
          });
        return div;
      };
      legend.addTo(mapInstance);
    }
  }, [mapInstance]);

  // event function which is called each time when the search bar changes and filter marker for the entry
  const filterData = (inputField) => {
    markerClusterGroup.clearLayers();
    if (inputField.target.value == "") {
      setFilteredOnlineCourses(onlineCourses.length);
      createMarkers(markerJson);
    }
    else {
      var uppercaseInput = inputField.target.value[0].toUpperCase() + inputField.target.value.substring(1);
      var lowercaseInput = inputField.target.value[0].toLowerCase() + inputField.target.value.substring(1);
      var filteredMarkers = new Map();
      Object.entries(markerJson).map( ([keyword, array]) => filteredMarkers.set(keyword, array.filter( data => data[2].search(uppercaseInput) > -1
                                                                              || data[2].search(lowercaseInput) > -1)));
      createMarkers(Object.fromEntries(filteredMarkers));

      // filters the amount of online courses for input
      setFilteredOnlineCourses(onlineCourses.filter( data => data[0].search(uppercaseInput) > -1 || data[0].search(lowercaseInput) > -1).length)
    }
    mapInstance.fireEvent("moveend");
  }

// is called each time when the map is moved and count the amount of markers
  if (mapInstance != null) {
    mapInstance.on('moveend', function() {
      setVisibleMarkersCount(0);
      var visibleMarkerCountTemp = 0;
      var bounds = mapInstance.getBounds();

      markerClusterGroup.eachLayer(function(marker) {
          if (marker instanceof L.Marker && bounds.contains(marker.getLatLng())) {
            visibleMarkerCountTemp += 1;
          }
      });
      setVisibleMarkersCount(visibleMarkerCountTemp);
    })
  }

  // returns the html of the map component
  return (
    <div className="row">
      <div className="col-12 col-md-9 col-xxl-9 d-flex order-3 order-xxl-2">
        <div className="card flex-fill w-100">
          <div className="card-header">
            <h5 className="card-title mb-0">Kurse auf der Karte</h5>
          </div>
          <div className="card-body px-4">
            <div>
              <input type="text" className="form-control" placeholder="Filter for..." onChange={filterData} />
              <br></br>
              <div id="map"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-12 col-md-3 col-xxl-3 d-flex flex-column">
            <div className="card flex-fill w-100">
              <div className="card-body">
                <div className="row">
                  <div className="col mt-0">
                    <h5 className="card-title">Sichtbare Kurse auf der Karte</h5>
                  </div>

                  <div className="col-auto">
                    <div className="stat text-primary">
                      <i className="align-middle" data-feather="map-pin"></i>
                    </div>
                  </div>
                </div>
                <h1 className="mt-1 mb-3">{visibleMarkersCount}</h1>
              </div>
            </div>
            <div className="card flex-fill w-100">
              <div className="card-body">
                <div className="row">
                  <div className="col mt-0">
                    <h5 className="card-title">Verfügbare online Kurse</h5>
                  </div>

                  <div className="col-auto">
                    <div className="stat text-primary">
                      <i className="align-middle" data-feather="search"></i>
                    </div>
                  </div>
                </div>
                <h1 className="mt-1 mb-3">{filteredOnlineCourses}</h1>
              </div>

        </div>
      </div>

    </div>
  );

} 

// this react component can be called in the html file by ID: "leaflet-map"
const domNode = document.getElementById('leaflet-map');
const root = createRoot(domNode);
root.render(<LeafletMap />);

