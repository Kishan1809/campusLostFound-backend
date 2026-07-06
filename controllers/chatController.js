const Item = require("../models/Item");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

// ======================================================
// GET /api/chat/:reportId
// Find or create conversation + load messages
// ======================================================
exports.getChatByReportId = async (req, res) => {
  try {
    const { reportId } = req.params;

    const loggedInUserId = String(req.user?._id || req.user?.id);

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1. Get report with owner
    const report = await Item.findById(reportId).populate(
      "reportedBy",
      "fullName"
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const ownerId = String(report.reportedBy?._id || report.reportedBy?.id);

    // 2. Conversation lookup must match the exact participants pair,
    //    but NOT depend on requester ordering or string/ObjectId coercion.
    //    We query by report + both participant ObjectIds (order-independent).
    const mongoose = require("mongoose");
    const requesterObjectId = mongoose.Types.ObjectId.createFromHexString(
      loggedInUserId
    );
    const ownerObjectId = mongoose.Types.ObjectId.createFromHexString(ownerId);


    const lookupFilter = {
      report: report._id,
      participants: {
        $all: [requesterObjectId, ownerObjectId],
        $size: 2,
      },
    };

    // 3. Find or create chat (never create if one already exists)
    let conversation = await Chat.findOne(lookupFilter);

    if (!conversation) {
      try {
        conversation = await Chat.create({
          report: report._id,
          participants: [requesterObjectId, ownerObjectId],
        });
      } catch (err) {
        // race condition safety (avoid duplicates on concurrent creates)
        if (err.code === 11000) {
          conversation = await Chat.findOne(lookupFilter);
        } else {
          throw err;
        }
      }
    }

    // 4. Populate participants for name resolution (sender names also come from Message populate)
    conversation = await Chat.findById(conversation._id).populate(
      "participants",
      "fullName"
    );

// 5. Owner name must reflect the report owner (never the “other” participant)
    const ownerName = report.reportedBy?.fullName || "Unknown";

    // 6. Load messages

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName");

    // 7. Response
    return res.status(200).json({
      conversationId: conversation._id,
      report,
      ownerName,
      messages: messages.map((m) => ({
        _id: m._id,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET /api/chat/conversations
// List all conversations for user
// ======================================================
exports.getConversations = async (req, res) => {
  try {
    const loggedInUserId = String(req.user?._id || req.user?.id);

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const chats = await Chat.find({
      participants: loggedInUserId,
    })
      .populate("report")
      .populate("participants", "fullName")
      .lean();

    const results = [];

    for (const c of chats) {
      const lastMessage = await Message.findOne({
        conversation: c._id,
      })
        .sort({ createdAt: -1 })
        .populate("sender", "fullName");

      const participants = (c.participants || []).map((p) => ({
        id: String(p._id),
        fullName: p.fullName,
      }));

      const otherParticipant = participants.find(
        (p) => p.id !== loggedInUserId
      );

      results.push({
        conversationId: c._id,
        reportId: c.report?._id || c.report,
        reportTitle: c.report?.title || "",
        otherParticipantId: otherParticipant?.id || null,
        otherParticipantName: otherParticipant?.fullName || null,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              sender: lastMessage.sender,
            }
          : null,
      });
    }

    return res.status(200).json({
      success: true,
      conversations: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};