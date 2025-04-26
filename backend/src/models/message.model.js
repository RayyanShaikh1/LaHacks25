import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    isAI: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
  },
  { timestamps: true }
);

// Ensure either receiverId or groupId is present, but not both
messageSchema.pre("save", function (next) {
  // Validate message type matches the presence of receiverId/groupId
  if (this.messageType === "direct" && !this.receiverId) {
    next(new Error("Direct messages must have a receiverId"));
  }
  if (this.messageType === "group" && !this.groupId) {
    next(new Error("Group messages must have a groupId"));
  }

  // Ensure either text or image is present
  if (!this.text && !this.image) {
    next(new Error("Message must have either text or image"));
  }

  // Ensure either receiverId or groupId is present, but not both
  if (
    (!this.receiverId && !this.groupId) ||
    (this.receiverId && this.groupId)
  ) {
    next(
      new Error("Message must have either receiverId or groupId, but not both")
    );
  }

  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;

//CHATGPT best message schema (include file?/ boolean ping bot)
// Chat {
//     _id: ObjectId,
//     isGroup: Boolean,
//     name?: String, // Only for groups
//     participants: ObjectId[], // User references
//     messages: ObjectId[], // Message references
//     lastMessage: ObjectId, // Message reference
//     createdAt: Date,
//     updatedAt: Date
//   }
// Message {
//     _id: ObjectId,
//     chat: ObjectId, // Chat reference
//     sender: ObjectId, // User reference
//     content: String,
//     timestamp: Date,
//     readBy: ObjectId[] // User references who have read this message
//  }
