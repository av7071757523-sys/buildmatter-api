const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts
} = require("../controllers/supplierController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", authMiddleware, updateSupplier);
router.delete("/:id", authMiddleware, deleteSupplier);
router.get("/:id/products", getSupplierProducts);

module.exports = router;