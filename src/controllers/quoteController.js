const pool = require('../db/db');

const createQuote = async (req, res) => {
  try {
    const { project_id, title, valid_until, items } = req.body;
    if (!title || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'title and items are required' });
    const quote = await pool.query(
      'INSERT INTO quotes (project_id, title, valid_until, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, title, valid_until, req.user.id]
    );
    const quoteId = quote.rows[0].id;
    for (const item of items) {
      await pool.query(
        'INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, notes) VALUES ($1, $2, $3, $4, $5)',
        [quoteId, item.product_id, item.quantity, item.unit_price, item.notes]
      );
    }
    const result = await pool.query(
      'SELECT q.*, p.name AS project_name FROM quotes q LEFT JOIN projects p ON q.project_id = p.id WHERE q.id = $1',
      [quoteId]
    );
    const quoteItems = await pool.query(
      'SELECT qi.*, p.name AS product_name FROM quote_items qi LEFT JOIN products p ON qi.product_id = p.id WHERE qi.quote_id = $1',
      [quoteId]
    );
    const total = quoteItems.rows.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    return res.status(201).json({ success: true, data: { ...result.rows[0], items: quoteItems.rows, total_amount: total } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getQuotes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT q.*, p.name AS project_name, u.name AS created_by_name FROM quotes q LEFT JOIN projects p ON q.project_id = p.id LEFT JOIN users u ON q.created_by = u.id ORDER BY q.id DESC'
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getQuoteById = async (req, res) => {
  try {
    const quote = await pool.query(
      'SELECT q.*, p.name AS project_name, u.name AS created_by_name FROM quotes q LEFT JOIN projects p ON q.project_id = p.id LEFT JOIN users u ON q.created_by = u.id WHERE q.id = $1',
      [req.params.id]
    );
    if (quote.rows.length === 0) return res.status(404).json({ success: false, message: 'Quote not found' });
    const items = await pool.query(
      'SELECT qi.*, p.name AS product_name FROM quote_items qi LEFT JOIN products p ON qi.product_id = p.id WHERE qi.quote_id = $1',
      [req.params.id]
    );
    const total = items.rows.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    return res.json({ success: true, data: { ...quote.rows[0], items: items.rows, total_amount: total } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE quotes SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Quote not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteQuote = async (req, res) => {
  try {
    await pool.query('DELETE FROM quotes WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createQuote, getQuotes, getQuoteById, updateQuoteStatus, deleteQuote };