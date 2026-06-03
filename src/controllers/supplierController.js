const pool = require('../db/db');

const createSupplier = async (req, res) => {
  try {
    const { name, contact_name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required' });
    const result = await pool.query('INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, contact_name, email, phone, address]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getSupplierById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const updateSupplier = async (req, res) => {
  try {
    const { name, contact_name, email, phone, address } = req.body;
    const result = await pool.query('UPDATE suppliers SET name = $1, contact_name = $2, email = $3, phone = $4, address = $5 WHERE id = $6 RETURNING *', [name, contact_name, email, phone, address, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteSupplier = async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getSupplierProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.supplier_id = $1 ORDER BY p.id DESC', [req.params.id]);
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, getSupplierProducts };