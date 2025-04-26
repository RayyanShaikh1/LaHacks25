import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { processStudyMaterials } from "../lib/gemini.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import StudySessionChat from "../models/studySessionChat.model.js";
import { io } from "../lib/socket.js";

// Initialize GridFS
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'studyMaterials'
  });
});

export const processStudyFile = async (req, res) => {
  try {
    const { groupId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group member names for context
    const members = await User.find({
      _id: { $in: group.members },
    }).select("name");
    const memberNames = members.map((m) => m.name);

    // Create or get AI agent ID for this group's study session
    if (!group.studyAgentId) {
      group.studyAgentId = `study_${group._id}`;
      await group.save();
    }

    // Process all files and combine their content
    let combinedLessonPlan = null;
    const storedFiles = [];

    for (const file of files) {
      // Store file in GridFS
      const writeStream = gfs.openUploadStream(file.originalname, {
        metadata: {
          groupId: group._id,
          uploadedBy: req.user._id,
          contentType: file.mimetype
        }
      });

      const fileId = await new Promise((resolve, reject) => {
        writeStream.write(file.buffer);
        writeStream.end();
        writeStream.on('finish', () => resolve(writeStream.id));
        writeStream.on('error', reject);
      });

      storedFiles.push({
        fileId: fileId,
        filename: file.originalname,
        contentType: file.mimetype,
        uploadedBy: req.user._id
      });

      // Process the file content
      const lessonPlan = await processStudyMaterials(
        file,
        group.studyAgentId,
        memberNames
      );
      
      if (!combinedLessonPlan) {
        combinedLessonPlan = lessonPlan;
      } else {
        // Merge the lesson plans
        const existingModules = new Map();
        
        combinedLessonPlan.modules.forEach(module => {
          existingModules.set(module.module, module);
        });
        
        lessonPlan.modules.forEach(newModule => {
          if (existingModules.has(newModule.module)) {
            const existingModule = existingModules.get(newModule.module);
            existingModule.lessons = [...new Set([...existingModule.lessons, ...newModule.lessons])];
          } else {
            combinedLessonPlan.modules.push(newModule);
          }
        });
      }
    }

    // Update group with stored files and lesson plan
    group.studyMaterials = storedFiles;
    group.studySessionLesson = combinedLessonPlan;
    await group.save();

    res.status(200).json({ 
      lessonPlan: combinedLessonPlan,
      files: storedFiles
    });
  } catch (error) {
    console.error("Error in processStudyFile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get the current lesson plan for a group
export const getStudySessionLesson = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.status(200).json({ lessonPlan: group.studySessionLesson });
  } catch (error) {
    console.error("Error in getStudySessionLesson:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific study material (PDF)
export const getStudyMaterial = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    // Set appropriate headers
    res.set('Content-Type', file[0].contentType);
    res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);

    // Stream the file
    const readStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    readStream.pipe(res);
  } catch (error) {
    console.error("Error in getStudyMaterial:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch chat history for a group/topic
export const getStudyChatHistory = async (req, res) => {
  try {
    const { groupId, topic } = req.query;
    const chat = await StudySessionChat.findOne({ groupId, topic })
      .populate('messages.sender', 'name');
    res.json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

export const handleStudyChat = async (req, res) => {
  try {
    const { topic, message, history, groupId } = req.body;
    const sender = req.user._id;

    // Find or create chat
    let chat = await StudySessionChat.findOne({ groupId, topic });
    if (!chat) {
      chat = new StudySessionChat({ groupId, topic, messages: [] });
    }

    // Add user message
    chat.messages.push({
      sender,
      role: "user",
      content: message,
      timestamp: new Date()
    });

    // Generate assistant response (replace with Gemini logic)
    const aiResponse = `You asked about "${topic}": ${message}`;
    chat.messages.push({
      sender: null,
      role: "assistant",
      content: aiResponse,
      timestamp: new Date()
    });

    await chat.save();

    // Populate sender for the last two messages
    const lastTwoMessages = chat.messages.slice(-2);
    const populatedMessages = await Promise.all(
      lastTwoMessages.map(async (msg) => {
        if (msg.sender) {
          const user = await User.findById(msg.sender).select("name");
          return { ...msg.toObject(), sender: { name: user?.name || "" } };
        }
        return { ...msg.toObject() };
      })
    );

    io.to(`studychat:${groupId}:${topic}`).emit("newStudyChatMessages", populatedMessages);

    res.json({ message: aiResponse });
  } catch (error) {
    res.status(500).json({ error: "Failed to process study chat message" });
  }
}; 