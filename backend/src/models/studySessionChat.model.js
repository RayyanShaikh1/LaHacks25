import mongoose from "mongoose";

const studySessionChatSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  topic: { type: String, required: true },
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["user", "assistant", "system"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const StudySessionChat = mongoose.model("StudySessionChat", studySessionChatSchema);
export default StudySessionChat; 