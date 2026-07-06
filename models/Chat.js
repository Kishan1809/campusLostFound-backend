const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // Conversation belongs to a specific report (Item)
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },

    // Exactly 2 participants (owner + logged-in user)
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",

      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 2;
        },
        message: "participants must contain exactly 2 users",
      },
    },
  },
  {
    timestamps: false,
  }
);

// Enforce deterministic conversation lookup: report + sorted participants.
// We'll store sorted participants at creation time.
chatSchema.index({ report: 1, participants: 1 }, { unique: true });

module.exports = mongoose.model("Chat", chatSchema);

