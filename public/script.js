const socket = io();
console.log("Script loaded successfully.");

// Initialize the map
const map = L.map("map").setView([0, 0], 16);

// Add the tile layer to the map (OpenStreetMap tiles)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; contributors",
}).addTo(map);

// Object to store markers
const markers = {};

// Handle receiving location updates via socket.io
socket.on("receive-location", (data) => {
  const { id, latitude, longitude, locationName } = data;

  // Set map view to the received location
  map.setView([latitude, longitude], 16);

  // Check if marker already exists for this ID, update its position
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    // Create a new marker and add it to the map
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // Update the location name in the div on the page
  document.getElementById("location-name").innerHTML = `Location Name: ${locationName}`;

  // Bind the location name as a popup on the marker
  const popup = `<b>Location Name:</b> ${locationName}`;
  markers[id].bindPopup(popup).openPopup();
});

// Geolocation handling (send location to server)
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Sending location:", latitude, longitude);
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error("Error getting geolocation:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 1000, // Increase timeout if necessary
      maximumAge: 0,
    }
  );
} else {
  console.error("Geolocation is not supported by this browser.");
}
