const pool = require('../db/db');

// ==========================
// CREATE TASK
// ==========================
const createTask = async (req, res) => {
  try {
    const { project_id, title, description, status, assigned_to, due_date } = req.body;
    if (!title || !project_id) return res.status(400).json({ success: false, message: 'Title and project_id are required' });
    const result = await pool.query(
      'INSERT INTO tasks (project_id, title, description, status, assigned_to, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, title, description, status || 'todo', assigned_to, due_date]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET ALL TASKS
// ==========================
const getTasks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name AS assigned_to_name, p.name AS project_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id ORDER BY t.id DESC'
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET TASK BY ID
// ==========================
const getTaskById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name AS assigned_to_name, p.name AS project_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// UPDATE TASK
// ==========================
const updateTask = async (req, res) => {
  try {
    const { title, description, status, assigned_to, due_date } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, assigned_to = $4, due_date = $5 WHERE id = $6 RETURNING *',
      [title, description, status, assigned_to, due_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// DELETE TASK
// ==========================
const deleteTask = async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };