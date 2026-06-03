const { Pool } = require("pg");

// ==============================
// DATABASE CONNECTION (RAILWAY + LOCAL SAFE)
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // REQUIRED for Railway / cloud PostgreSQL
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// ==============================
// TEST CONNECTION (DEBUG SAFE)
// ==============================
pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ Database Connection Error:");
    console.error(err.message);
  });

// ==============================
// EXPORT POOL
// ==============================
module.exports = pool;