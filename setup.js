const fs = require('fs');
const path = require('path');

const files = {
  'src/controllers/inventoryController.js': `
const pool = require('../db/db');

// ==========================
// ADD/UPDATE INVENTORY
// ==========================
const upsertInventory = async (req, res) => {
  try {
    const { product_id, quantity, min_stock_level, location } = req.body;
    if (!product_id || quantity === undefined)
      return res.status(400).json({ success: false, message: 'product_id and quantity are required' });
    const existing = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [product_id]);
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE inventory SET quantity = $1, min_stock_level = $2, location = $3, last_updated = NOW() WHERE product_id = $4 RETURNING *',
        [quantity, min_stock_level || existing.rows[0].min_stock_level, location || existing.rows[0].location, product_id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO inventory (product_id, quantity, min_stock_level, location) VALUES ($1, $2, $3, $4) RETURNING *',
        [product_id, quantity, min_stock_level || 0, location]
      );
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET ALL INVENTORY
// ==========================
const getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT i.*, p.name AS product_name, p.sku, p.unit FROM inventory i LEFT JOIN products p ON i.product_id = p.id ORDER BY i.id DESC'
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET INVENTORY BY PRODUCT ID
// ==========================
const getInventoryByProduct = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT i.*, p.name AS product_name, p.sku, p.unit FROM inventory i LEFT JOIN products p ON i.product_id = p.id WHERE i.product_id = $1',
      [req.params.product_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Inventory not found for this product' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// LOW STOCK ALERT
// ==========================
const getLowStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT i.*, p.name AS product_name, p.sku, p.unit FROM inventory i LEFT JOIN products p ON i.product_id = p.id WHERE i.quantity <= i.min_stock_level ORDER BY i.quantity ASC'
    );
    return res.json({
      success: true,
      count: result.rows.length,
      message: result.rows.length > 0 ? result.rows.length + ' product(s) are low on stock!' : 'All products are well stocked',
      data: result.rows
    });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// ADD STOCK
// ==========================
const addStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0)
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    const existing = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [req.params.product_id]);
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Inventory not found for this product' });
    const result = await pool.query(
      'UPDATE inventory SET quantity = quantity + $1, last_updated = NOW() WHERE product_id = $2 RETURNING *',
      [quantity, req.params.product_id]
    );
    return res.json({ success: true, message: quantity + ' units added to stock', data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// DEDUCT STOCK
// ==========================
const deductStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0)
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    const existing = await pool.query('SELECT * FROM inventory WHERE product_id = $1', [req.params.product_id]);
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Inventory not found for this product' });
    if (existing.rows[0].quantity < quantity)
      return res.status(400).json({ success: false, message: 'Insufficient stock. Available: ' + existing.rows[0].quantity });
    const result = await pool.query(
      'UPDATE inventory SET quantity = quantity - $1, last_updated = NOW() WHERE product_id = $2 RETURNING *',
      [quantity, req.params.product_id]
    );
    return res.json({ success: true, message: quantity + ' units deducted from stock', data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// DELETE INVENTORY
// ==========================
const deleteInventory = async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE product_id = $1', [req.params.product_id]);
    return res.json({ success: true, message: 'Inventory deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { upsertInventory, getInventory, getInventoryByProduct, getLowStock, addStock, deductStock, deleteInventory };
`,

  'src/routes/inventoryRoutes.js': `
const express = require('express');
const router = express.Router();
const { upsertInventory, getInventory, getInventoryByProduct, getLowStock, addStock, deductStock, deleteInventory } = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/update', authMiddleware, upsertInventory);
router.get('/', authMiddleware, getInventory);
router.get('/low-stock', authMiddleware, getLowStock);
router.get('/product/:product_id', authMiddleware, getInventoryByProduct);
router.put('/product/:product_id/add', authMiddleware, addStock);
router.put('/product/:product_id/deduct', authMiddleware, deductStock);
router.delete('/product/:product_id', authMiddleware, deleteInventory);
module.exports = router;
`
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join('D:\\Buildmatter', filePath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log('✅ Written:', filePath);
});

console.log('\n🎉 All files created successfully!');