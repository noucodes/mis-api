const express = require("express");
const routes = require("./routes");
const { initUserTable } = require("./modules/users/models/user.model");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Mount all API routes
app.use("/api", routes);

// Run DB init ONCE
initUserTable()
  .then(() => console.log("✅ Users table ready"))
  .catch((err) => console.error("❌ Error initializing DB:", err));

module.exports = app;
