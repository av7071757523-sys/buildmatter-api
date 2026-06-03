require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'buildmatter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ New DB client connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected DB error:', err.message);
});

module.exports = pool;
