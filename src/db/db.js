const { Pool } = require("pg");

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL Connected (Railway)");
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
  });

module.exports = pool;