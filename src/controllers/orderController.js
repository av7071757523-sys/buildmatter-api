const pool = require('../db/db');

const createOrder = async (req, res) => {
  try {
    const { supplier_id, notes, items } = req.body;
    if (!supplier_id || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'supplier_id and items are required' });
    const order = await pool.query(
      'INSERT INTO orders (supplier_id, notes) VALUES ($1, $2) RETURNING *',
      [supplier_id, notes]
    );
    const orderId = order.rows[0].id;
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
    }
    const result = await pool.query(
      'SELECT o.*, s.name AS supplier_name FROM orders o LEFT JOIN suppliers s ON o.supplier_id = s.id WHERE o.id = $1',
      [orderId]
    );
    const orderItems = await pool.query(
      'SELECT oi.*, p.name AS product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [orderId]
    );
    return res.status(201).json({ success: true, data: { ...result.rows[0], items: orderItems.rows } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, s.name AS supplier_name FROM orders o LEFT JOIN suppliers s ON o.supplier_id = s.id ORDER BY o.id DESC'
    );
    return res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getOrderById = async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT o.*, s.name AS supplier_name FROM orders o LEFT JOIN suppliers s ON o.supplier_id = s.id WHERE o.id = $1',
      [req.params.id]
    );
    if (order.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await pool.query(
      'SELECT oi.*, p.name AS product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [req.params.id]
    );
    const total = items.rows.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    return res.json({ success: true, data: { ...order.rows[0], items: items.rows, total_amount: total } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const deleteOrder = async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder };