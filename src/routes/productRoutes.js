const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  createProduct,
  getProducts,
  getProductById,
  deleteProduct
} = require("../controllers/productController");

// DEBUG (optional)
console.log({
  createProduct,
  getProducts,
  getProductById,
  deleteProduct
});

router.post("/add", upload.single("image"), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.delete("/:id", deleteProduct);

module.exports = router;
