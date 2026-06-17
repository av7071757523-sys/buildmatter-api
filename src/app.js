const express = require('express');
const path = require('path');
const app = express();

const pool = require('./db/db');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const orderRoutes = require('./routes/orderRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Home Route
app.get('/', (req, res) => {
res.json({
success: true,
message: 'BuildMatter API Running'
});
});

// Debug DB
app.get('/debug-db', async (req, res) => {
try {
const result = await pool.query(
'SELECT current_database(), current_user'
);

```
res.json({
  success: true,
  data: result.rows[0]
});
```

} catch (err) {
console.error(err);

```
res.status(500).json({
  success: false,
  message: err.message
});
```

}
});

// Debug Tables
app.get('/debug-tables', async (req, res) => {
try {
const result = await pool.query(`       SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

```
res.json({
  success: true,
  count: result.rows.length,
  tables: result.rows
});
```

} catch (err) {
console.error(err);

```
res.status(500).json({
  success: false,
  message: err.message
});
```

}
});

// Debug Users
app.get('/debug-users', async (req, res) => {
try {
const result = await pool.query(
'SELECT * FROM users LIMIT 10'
);

```
res.json({
  success: true,
  count: result.rows.length,
  users: result.rows
});
```

} catch (err) {
console.error(err);

```
res.status(500).json({
  success: false,
  message: err.message
});
```

}
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/inventory', inventoryRoutes);

module.exports = app;
