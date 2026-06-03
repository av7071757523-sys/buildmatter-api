const pool = require('../db/db');

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const result = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getCategoryById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query('UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name, description, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };