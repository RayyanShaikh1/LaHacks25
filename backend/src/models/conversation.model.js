import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    aiAgentId: {
      type: String,
      default: null,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add index on participants for better query performance
conversationSchema.index({ participants: 1 });

// Validate that there are exactly 2 participants for direct messages
conversationSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Direct conversations must have exactly 2 participants"));
  }
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
