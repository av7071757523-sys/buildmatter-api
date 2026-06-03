const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "Railway DB",   // 🔥 FIXED (important)
  database: "buildmatter",
  password: "1135561",
  port: 5432,
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL Connected Successfully"))
  .catch(err => console.error("❌ DB Error:", err.message));

module.exports = pool;