const express = require("express");
const router = express.Router();

const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ✅ Debug: confirm middleware loaded correctly
console.log("authMiddleware:", typeof authMiddleware);
console.log("createItem:", typeof createItem);

// Routes
router.post("/", authMiddleware, upload.single("image"), createItem);
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.put("/:id", authMiddleware, updateItem);
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;