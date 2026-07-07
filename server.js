const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
const PORT = process.env.PORT || 5000;

// =======================
// Middleware
// =======================
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);

// =======================
// Test Route
// =======================
app.get("/", (req, res) => {
    res.send("🚀 Campus Lost & Found Backend Running Successfully");
});

// =======================
// MongoDB Connection
// =======================
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing in .env");
    process.exit(1);
}

console.log("Connecting to MongoDB...");

mongoose
.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected Successfully");

    app.listen(PORT, () => {
        console.log("=================================");
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Local URL: http://localhost:${PORT}`);
        console.log("=================================");
    });
})
.catch((err) => {
    console.error("❌ Database Connection Failed");
    console.error(err.message);
    process.exit(1);
});
