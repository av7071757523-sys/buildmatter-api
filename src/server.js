require("dotenv").config();
const fs = require('fs');
const path = require('path');
const app = require("./app");
const pool = require("./db/db");

const PORT = process.env.PORT || 3000;

const runSchema = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Schema verified — all tables ready');
  } catch (err) {
    console.error('⚠️ Schema warning:', err.message);
  }
};

pool.connect()
  .then(async (client) => {
    client.release();
    console.log("✅ PostgreSQL Connected");

    await runSchema();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
      } else {
        console.error("Server error:", err);
      }
    });
  })
  .catch((err) => {
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  });