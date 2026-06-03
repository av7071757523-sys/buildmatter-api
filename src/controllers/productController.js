const pool = require("../db/db");

// ==========================
// DEBUG LOGGER FUNCTION
// ==========================
const logError = (err, functionName) => {
  console.error("🔥 ===== ERROR START =====");
  console.error("📍 Function:", functionName);
  console.error("📌 Message:", err.message);
  console.error("📌 Name:", err.name);
  console.error("📌 Stack:", err.stack);
  console.error("🔥 ===== ERROR END =====");
};

// ==========================
// CREATE PRODUCT
// ==========================
const createProduct = async (req, res) => {
  try {
    console.log("📦 CREATE PRODUCT BODY:", req.body);

    const { name, description, price, stock } = req.body;
    const image = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stock, image]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    logError(err, "createProduct");

    return res.status(500).json({
      success: false,
      message: err.message,
      type: err.name
    });
  }
};

// ==========================
// GET ALL PRODUCTS
// ==========================
const getProducts = async (req, res) => {
  try {
    console.log("📦 GET ALL PRODUCTS HIT");

    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    logError(err, "getProducts");

    return res.status(500).json({
      success: false,
      message: err.message,
      type: err.name
    });
  }
};

// ==========================
// GET PRODUCT BY ID
// ==========================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📦 GET PRODUCT BY ID:", id);

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    logError(err, "getProductById");

    return res.status(500).json({
      success: false,
      message: err.message,
      type: err.name
    });
  }
};

// ==========================
// DELETE PRODUCT
// ==========================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑 DELETE PRODUCT:", id);

    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    return res.json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (err) {
    logError(err, "deleteProduct");

    return res.status(500).json({
      success: false,
      message: err.message,
      type: err.name
    });
  }
};

// ==========================
// EXPORT
// ==========================
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  deleteProduct
};
