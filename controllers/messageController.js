const Chat = require("../models/Chat");
const Message = require("../models/Message");

// POST /api/chat/:conversationId/message
// Body: { text }
exports.postMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const loggedInUserId = String(req.user?._id || req.user?.id);

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { text } = req.body || {};
    const trimmed = String(text ?? "").trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const conversation = await Chat.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const participantIds = (conversation.participants || []).map((p) =>
      String(p)
    );
    if (!participantIds.includes(loggedInUserId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: loggedInUserId,
      text: trimmed,
      createdAt: new Date(),
    });

    // Populate sender so frontend receives consistent sender object with fullName
    const populated = await Message.findById(message._id).populate('sender', 'fullName');

    return res.status(201).json({
      conversationId: populated.conversation,
      message: {
        _id: populated._id,
        sender: populated.sender,
        text: populated.text,
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


