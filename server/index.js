const express = require("express");
const cors = require("cors");
const http = require("http");

const dailyRoutes = require("./routes/dailyRoutes");
const solitaireRoutes = require("./routes/solitaireRoutes");
const { initWebsocket } = require("./websocket/multiplayer");
const guessRoutes = require("./routes/guessRoutes");
const rhymeSetRoutes = require("./routes/rhymeSetRoutes");

const app = express();
app.use(cors());

// Explicit JSON parser with lightweight error handler for invalid JSON bodies
app.use(express.json());
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Schmordle backend is running" });
});

// REST API routes
app.use("/api/daily", dailyRoutes);
app.use("/api/solitaire", solitaireRoutes);
app.use("/api/guess", guessRoutes);
app.use("/api/rhymeSet", rhymeSetRoutes);

// Create HTTP server FIRST
const server = http.createServer(app);

// Initialize WebSocket AFTER server is created
initWebsocket(server);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`HTTP API + WebSocket server running on port ${PORT}`);
});

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

