require("dotenv").config();

const app = require("./app");
const pool = require("./db/db");

const PORT = process.env.PORT || 5000;

// Test DB connection + print current database
pool.query('SELECT current_database()', (err, res) => {
  if (err) {
    console.error('❌ DB Connection Test Failed:', err.message);
  } else {
    console.log('📦 Connected to database:', res.rows[0].current_database);
  }
});

// Check DB first then start server
pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL Connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`❌ Port ${PORT} is already in use.`);
        console.log(`👉 Try changing PORT in .env (e.g. 5001)`);
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
