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
  ],
  aiContext: { type: String },
  quiz: {
    questions: [
      {
        question: String,
        options: [String],
        correct: Number // index of correct option
      }
    ],
    responses: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        answers: [Number], // index of selected option for each question
        completed: Boolean
      }
    ]
  }
}, { timestamps: true });

const StudySessionChat = mongoose.model("StudySessionChat", studySessionChatSchema);
export default StudySessionChat; 