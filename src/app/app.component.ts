/// <reference types="@types/googlemaps" />
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import io from "socket.io-client";
import { store } from './types/store.type';

declare var google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('map') mapElement; 
  @ViewChild('placeSearch') searchElement; 
  socket: any;
  selectedStore: store;
  showMap = false;
  map;
  autocomplete;
  markers = [];
  stores: store[];
  searchDistance = 30;
  coords;
  error;

  // Declare a single inforwindow. Which is reused for each marker.
  infowindow = new google.maps.InfoWindow({
    content: ''
  });
  
  ngAfterViewInit() {
    // Init google maps & places on html elements.
    this.map = new google.maps.Map(this.mapElement.nativeElement);
    this.autocomplete = new google.maps.places.Autocomplete(this.searchElement.nativeElement);
    const self = this;
    google.maps.event.addListener(self.autocomplete, 'place_changed', function() {
      const place = self.autocomplete.getPlace();
      self.coords = place.geometry.location;
      self.error = null;
    });
    
    // App is loaded, cocnnect to the socket server
    this.connect();
  }

  connect () {
    var connectionOptions =  {
      "force new connection" : true,
      "reconnectionAttempts": "Infinity", //avoid having user reconnect manually in order to prevent dead clients after a server restart
      "timeout" : 10000,                  //before connect_error and connect_timeout are emitted.
    };
    // connect to hosted socket server
    this.socket = io("http://kevdevbox.com", {path: '/gwStoreFinder/socket.io/'}, connectionOptions);
    // This.socket = io("http://localhost:3000", connectionOptions);
    const self = this;
    this.socket.on("result", results => {
      // Remove any existing markers
      this.clearMarkers();
      this.showMap = true;
      this.stores = results;
      this.stores.forEach(function(store){
        self.markLocation(store);
      });
    });
  }
  
  // Create a marker and set its position.
  markLocation(locationInfo){
    const self = this;
    
    //Marker infowindow text.
    var contentString = '<h3>' + locationInfo.name + '</h3>' +
      '<br>' + '<div>' + 
      locationInfo.address + ', ' +
      locationInfo.City + ', ' +
      locationInfo.State + ', ' +
      locationInfo.Postcode +
      '</div>' + '<br>' +
      '<div>' + locationInfo.phoneNumber + '</div>';
    // Add the marker to the map
    const marker = new google.maps.Marker({
      map: this.map,
      position: locationInfo.location,
      title: locationInfo.name
    });
    
    this.markers.push(marker);
    
    // Show store info when marker is clicked
    marker.addListener('click', function(){
      self.selectedStore = locationInfo;
      self.infowindow.setContent(contentString);
      self.infowindow.setPosition(this.getPosition());
      self.infowindow.open(self.map, marker);
    });
  }

  clearMarkers(){
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];
  }

  search(){
    if (this.coords) {
      let request = {
        location: this.coords,
        distance: this.searchDistance,
      }
      // Ask the socket server for information. The return is expected in the on('result') event.
      this.socket.emit('request', request);
      this.map.setCenter(this.coords);
      // Zoom the map based on the search distance.
      switch(this.searchDistance){
        case 5: 
          this.map.setZoom(11);
          break;
        case 15:
          this.map.setZoom(10);
          break;
        case 30:
          this.map.setZoom(9);
          break;
        case 40:
          this.map.setZoom(8);
          break;
        case 50:
          this.map.setZoom(8);
          break;
      }
    } else {
      this.error = 'Please select a valid location';
    }
  }
}
