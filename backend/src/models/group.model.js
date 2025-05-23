import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupImage: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSHTuuGuExr7F-k1Toog4jgi6PM1tnZexs6A&s",
    },
    aiAgentId: {
      type: String,
      default: null,
    },
    studyAgentId: {
      type: String,
      default: null,
    },
    studySessionLesson: {
      type: Object,
      default: null,
    },
    studyMaterials: [{
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      filename: {
        type: String,
        required: true
      },
      contentType: {
        type: String,
        required: true
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
