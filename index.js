//index.js
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000", // Allow requests from frontend
    methods: ["GET", "POST"],
  },
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: "http://localhost:3000" })); // Enable CORS for Next.js

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("send-location", (data) => {
    const { latitude, longitude } = data;

    console.log("Received location:", latitude, longitude);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
    )
      .then((response) => response.json())
      .then((geoData) => {
        const locationName = geoData.display_name || "Unknown location";
        io.emit("receive-location", { id: socket.id, latitude, longitude, locationName });
      })
      .catch((error) => {
        console.error("Error fetching location name:", error);
        io.emit("receive-location", { id: socket.id, latitude, longitude, locationName: "Unknown location" });
      });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
