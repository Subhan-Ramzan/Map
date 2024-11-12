const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");  // Importing node-fetch for server-side fetch requests

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",  // Allow requests from any domain (can be further restricted for security)
    methods: ["GET", "POST"]
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: "*" })); // CORS setup for frontend requests

// Global handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally, exit the process or handle this error gracefully
});

// Handle incoming socket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for location data from the frontend
  socket.on("send-location", async (data) => {
    const { latitude, longitude } = data;

    console.log("Received location:", latitude, longitude);

    try {
      // Fetch the location name using OpenStreetMap's Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
      );

      // Check if the response is successful
      if (!response.ok) {
        throw new Error("Failed to fetch location name");
      }

      const geoData = await response.json();
      const locationName = geoData.display_name || "Unknown location";
      
      // Emit the location data back to all clients
      io.emit("receive-location", { id: socket.id, latitude, longitude, locationName });
    } catch (error) {
      console.error("Error fetching location name:", error);
      // Send a fallback location name if there was an error
      io.emit("receive-location", { id: socket.id, latitude, longitude, locationName: "Unknown location" });
    }
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
