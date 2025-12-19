const express = require("express");
const routes = require("./routes");
const { initUserTable } = require("./modules/users/models/user.model");
const cors = require("cors");

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "https://adonweb.com.au", // Production
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // React dev server (if used)
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // allow cookies / bearer tokens
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight OPTIONS for all routes
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content
  }
  next();
});

app.use(express.json());

// Mount all API routes
app.use("/api", routes);

// Run DB init ONCE
initUserTable()
  .then(() => console.log("✅ Users table ready"))
  .catch((err) => console.error("❌ Error initializing DB:", err));

module.exports = app;
