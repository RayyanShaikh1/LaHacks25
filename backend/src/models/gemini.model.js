import mongoose from "mongoose";

const imageContextSchema = new mongoose.Schema({
  url: String, // Cloudinary URL
  publicId: String, // Cloudinary public_id
  mimeType: String,
  timestamp: Date,
  sender: String,
  summary: String,
  relatedMessages: [String],
});

const geminiConversationSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
    },
    history: [
      {
        role: {
          type: String,
          enum: ["user", "model"],
          required: true,
        },
        parts: [
          {
            text: String,
            inlineData: {
              mimeType: String,
              url: String, // Store Cloudinary URL instead of base64
              publicId: String, // Store Cloudinary public_id
            },
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    images: [imageContextSchema],
    lastInteraction: {
      type: Date,
      default: Date.now,
    },
    participants: [String],
    conversationType: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    associatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "conversationType",
    },
  },
  { timestamps: true }
);

// Index for efficient querying and cleanup
geminiConversationSchema.index({ lastInteraction: 1 });
geminiConversationSchema.index({ unique: true });

// Middleware to update lastInteraction
geminiConversationSchema.pre("save", function (next) {
  if (this.isModified("history")) {
    this.lastInteraction = new Date();
  }
  next();
});

// Method to add a message to history
geminiConversationSchema.methods.addToHistory = function (role, parts) {
  this.history.push({
    role,
    parts,
    timestamp: new Date(),
  });
};

const GeminiConversation = mongoose.model(
  "GeminiConversation",
  geminiConversationSchema
);

export default GeminiConversation;
