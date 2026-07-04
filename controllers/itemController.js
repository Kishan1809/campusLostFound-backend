const Item = require("../models/Item");

// =======================
// Create Item
// =======================
exports.createItem = async (req, res) => {
  try {
    console.log("[createItem] REQ.CONTENT-TYPE:", req.headers?.["content-type"]);
    console.log("[createItem] REQ.BODY:", req.body);
    console.log("[createItem] REQ.FILE:", req.file);
    console.log("[createItem] REQ.USER:", req.user);

    // ✅ Guard: ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    const body = req.body || {};

    const {
      title,
      description,
      category,
      type,
      location,
      date,
      status,
    } = body;

    // Validation
    if (!title || !description || !category || !type || !location) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        debug: { bodyKeys: Object.keys(body) },
      });
    }

    // Restrict categories for NEW reports only
    const allowedCategories = ["Electronics", "Books", "Keys", "Other"];
    if (!allowedCategories.includes(String(category).trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Allowed: Electronics, Books, Keys, Other",
      });
    }

    // normalize category string
    body.category = String(category).trim();

    const item = await Item.create({
      title,
      description,
      category,
      type,
      location,
      date: date || new Date(),
      status: status || "Open",
      image: req.file ? req.file.filename : "",
      reportedBy: req.user._id || req.user.id, // ✅ handle both formats
    });

    res.status(201).json({
      success: true,
      message: "Item reported successfully",
      item,
    });

  } catch (error) {
    console.error("CREATE ITEM ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Get All Items
// =======================
exports.getAllItems = async (req, res) => {
  try {
    const { type, category, search, status } = req.query || {};
    const filter = {};

    if (type) {
      filter.type = String(type).trim();
    }

    if (category) {
      filter.category = String(category).trim();
    }

    if (status) {
      filter.status = String(status).trim();
    }

    if (search) {
      const query = String(search).trim();
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { location: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
        ];
      }
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate("reportedBy", "fullName email profileImage");

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Get Single Item
// =======================
exports.getItemById = async (req, res) => {
  try {
    // Ensure reportedBy is populated (even if schema stores only an ObjectId)
    const item = await Item.findById(req.params.id).populate(
      "reportedBy",
      "fullName profileImage"
    );


    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Update Item
// =======================
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Delete Item
// =======================
exports.deleteItem = async (req, res) => {
  try {
    // Auth middleware is expected on this route.
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    const userId = String(req.user.id || req.user._id);

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const reportedById = item.reportedBy
      ? String(item.reportedBy._id || item.reportedBy)
      : "";

    if (reportedById !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only delete your own reports.",
      });
    }

    // Delete uploaded image file if it exists.
    if (item.image) {
      const fs = require("fs");
      const path = require("path");

      const uploadsDir = path.join(__dirname, "..", "uploads");
      const filename = String(item.image).replace(/^.*[\\/]/, ""); // keep only basename
      const filePath = path.join(uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
