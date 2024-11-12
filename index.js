const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",  // Allow requests from any domain (can be further restricted for security)
    methods: ["GET", "POST"]
  }
});

// Dynamically import fetch
let fetch;

(async () => {
  fetch = (await import('node-fetch')).default;  // Dynamically import node-fetch for use

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cors({ origin: "*" })); // CORS setup for frontend requests

  // Handle incoming socket connections
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Listen for location data from the frontend
    socket.on("send-location", (data) => {
      const { latitude, longitude } = data;

      console.log("Received location:", latitude, longitude);

      // Fetch the location name using OpenStreetMap's Nominatim API
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
      )
        .then((response) => response.json())
        .then((geoData) => {
          const locationName = geoData.display_name || "Unknown location";
          // Emit the location data back to all clients
          io.emit("receive-location", { id: socket.id, latitude, longitude, locationName });
        })
        .catch((error) => {
          console.error("Error fetching location name:", error);
          // Send a fallback location name if there was an error
          io.emit("receive-location", { id: socket.id, latitude, longitude, locationName: "Unknown location" });
        });
    });

    // Handle socket disconnect event
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  // Route to render the index page
  app.get("/", (req, res) => {
    res.render("index");
  });

  // Start the server
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

})();
