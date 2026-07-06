const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const messageController = require("../controllers/messageController");

// GET /api/chat/conversations
// Returns all conversations for the logged-in user with last message + report info
router.get("/conversations", authMiddleware, chatController.getConversations);

// GET /api/chat/:reportId
router.get("/:reportId", authMiddleware, chatController.getChatByReportId);

// POST /api/chat/:conversationId/message
router.post(
  "/:conversationId/message",
  authMiddleware,
  messageController.postMessage
);

module.exports = router;


