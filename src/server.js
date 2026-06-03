require("dotenv").config();

const app = require("./app");
const pool = require("./db/db");

const PORT = process.env.PORT || 3000;

pool.connect()
  .then((client) => {
    client.release();
    console.log("✅ PostgreSQL Connected");

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