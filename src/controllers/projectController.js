const pool = require('../db/db');

// ==========================
// CREATE PROJECT
// ==========================
const createProject = async (req, res) => {
  try {
    const { name, description, status, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });
    const result = await pool.query(
      'INSERT INTO projects (name, description, status, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, status || 'active', start_date, end_date, req.user.id]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET ALL PROJECTS
// ==========================
const getProjects = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.name AS created_by_name FROM projects p LEFT JOIN users u ON p.created_by = u.id ORDER BY p.id DESC'
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET PROJECT BY ID
// ==========================
const getProjectById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.name AS created_by_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// UPDATE PROJECT
// ==========================
const updateProject = async (req, res) => {
  try {
    const { name, description, status, start_date, end_date } = req.body;
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, status = $3, start_date = $4, end_date = $5 WHERE id = $6 RETURNING *',
      [name, description, status, start_date, end_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// DELETE PROJECT
// ==========================
const deleteProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET PROJECT TASKS
// ==========================
const getProjectTasks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.name AS assigned_to_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = $1 ORDER BY t.id DESC',
      [req.params.id]
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ==========================
// GET PROJECT SUMMARY
// ==========================
const getProjectSummary = async (req, res) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (project.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    const tasks = await pool.query('SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = $1 GROUP BY status', [req.params.id]);
    const quotes = await pool.query('SELECT status, COUNT(*) AS count FROM quotes WHERE project_id = $1 GROUP BY status', [req.params.id]);
    return res.json({
      success: true,
      data: {
        project: project.rows[0],
        tasks: tasks.rows,
        quotes: quotes.rows
      }
    });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, getProjectTasks, getProjectSummary };