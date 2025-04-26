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
  },
  { timestamps: true }
);

// Ensure either receiverId or groupId is present, but not both
messageSchema.pre("save", function(next) {
  if ((!this.receiverId && !this.groupId) || (this.receiverId && this.groupId)) {
    next(new Error("Message must have either receiverId or groupId, but not both"));
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
