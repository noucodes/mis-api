const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon/Supabase require SSL
});

// Test connection on startup
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL database!");
    client.release();
  })
  .catch((err) => console.error("❌ Database connection error:", err.stack));

module.exports = pool;
