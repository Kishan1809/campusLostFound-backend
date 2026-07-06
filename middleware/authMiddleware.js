const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }

    try {
        const token = authHeader.replace("Bearer ", "").trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("AUTH HEADER:", authHeader);
        console.log("DECODED TOKEN:", decoded);

        // ✅ Normalize: support both id and _id from JWT payload
            const userId = decoded.id || decoded._id;

        req.user = {
            _id: userId.toString(),
            id: userId.toString()
        };

        console.log("REQ.USER SET:", req.user);

        next();

    } catch (err) {
        console.error("JWT ERROR:", err.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};