const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// =======================
// Import Routes
// =======================
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const chatRoutes = require("./routes/chatRoutes");

// =======================
// Initialize Express
// =======================
const app = express();


// =======================
// Middleware
// =======================
app.use(cors());
app.use(express.json());
// ✅ Must allow multipart forms to be parsed by Multer.
// Multer handles multipart/form-data; keep express.urlencoded from breaking parsing.
app.use(express.urlencoded({ extended: true }));
// =======================
// API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);


// =======================
// Static uploads
// =======================
const uploadsPath = path.join(__dirname, "uploads");
console.log("SERVER FILE:", __filename);
console.log("UPLOADS PATH:", uploadsPath);
console.log("UPLOADS EXISTS:", fs.existsSync(uploadsPath));

if (fs.existsSync(uploadsPath)) {
    console.log("UPLOADS FILES:", fs.readdirSync(uploadsPath));
}

// Expose backend/uploads so images can be loaded by the frontend.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log("=== RUNNING SERVER INSTANCE ===");


// =======================
// Test Route
// =======================
app.get("/", (req, res) => {
    res.send("🚀 Campus Lost & Found Backend Running Successfully");
});


// =======================
// MongoDB Connection
// =======================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");

        app.listen(process.env.PORT, () => {
            console.log(`🚀 Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Database Connection Failed");
        console.error(err);
    });