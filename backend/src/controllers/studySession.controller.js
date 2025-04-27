import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { processStudyMaterials, getGeminiResponse } from "../lib/gemini.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import StudySessionChat from "../models/studySessionChat.model.js";
import { io } from "../lib/socket.js";

// Helper to extract JSON from a string
function extractJsonFromString(str) {
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  return null;
}

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

    // If @nexus is mentioned, get Gemini response
    let aiResponse = null;
    if (message.includes("@nexus")) {
      const question = message.split("@nexus")[1].trim();
      const user = await User.findById(sender).select("name");
      const agentId = `study_${groupId}_${topic.replace(/\s+/g, '_')}`;
      aiResponse = await getGeminiResponse(
        question,
        agentId,
        null,
        user.name
      );
      chat.messages.push({
        sender: null,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      });
    }

    await chat.save();

    // Only emit the new messages that were just added
    let newMessages;
    if (aiResponse !== null) {
      // Both user and AI messages were just added
      newMessages = chat.messages.slice(-2);
    } else {
      // Only user message was just added
      newMessages = [chat.messages[chat.messages.length - 1]];
    }
    const populatedMessages = await Promise.all(
      newMessages.map(async (msg) => {
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

// Helper to fetch PDF buffers for a group/topic
async function getPdfBuffersForGroup(group, maxFiles = 3) {
  if (!group.studyMaterials || group.studyMaterials.length === 0) return [];
  // Limit the number of PDFs to avoid overloading Gemini
  const pdfs = group.studyMaterials.slice(0, maxFiles);
  const buffers = [];
  for (const pdf of pdfs) {
    const chunks = [];
    await new Promise((resolve, reject) => {
      gfs.openDownloadStream(pdf.fileId)
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve())
        .on('error', reject);
    });
    buffers.push(Buffer.concat(chunks));
  }
  return buffers;
}

// Initialize a new Gemini agent for a study session chat and generate a lesson
export const initializeStudySessionAgent = async (req, res) => {
  try {
    const { groupId, topic } = req.body;
    // Get group and members
    const group = await Group.findById(groupId).populate("members", "name");
    if (!group) return res.status(404).json({ error: "Group not found" });
    const memberNames = group.members.map((m) => m.name);

    // Check if chat already exists and has messages
    let chat = await StudySessionChat.findOne({ groupId, topic });
    if (chat && chat.messages.length > 0) {
      return res.status(200).json({ alreadyInitialized: true, messages: chat.messages });
    }

    // Create or update chat with AI context
    const aiContext = `You are a specialized AI agent to teach the following students: ${memberNames.join(", ")} about ${topic}. Your role is to provide clear, engaging lessons, answer questions, and guide the group through the material.`;
    if (!chat) {
      chat = new StudySessionChat({ groupId, topic, messages: [], aiContext });
    } else {
      chat.aiContext = aiContext;
    }

    // Fetch PDF buffers for the group
    const pdfBuffers = await getPdfBuffersForGroup(group);
    const promptParts = [
      { text: `${aiContext}\n\nPlease provide a comprehensive lesson about ${topic}.` },
      ...pdfBuffers.map(buffer => ({
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        }
      }))
    ];

    // Generate a unique agentId for this study session
    const agentId = `study_${groupId}_${topic.replace(/\s+/g, '_')}`;

    // Generate lesson using Gemini, sending PDFs as prompt parts
    const aiLesson = await getGeminiResponse(null, agentId, memberNames, null, promptParts);

    // Save the AI's lesson as the first message
    chat.messages.push({
      sender: null,
      role: "assistant",
      content: aiLesson,
      timestamp: new Date()
    });

    // Generate quiz using Gemini
    const quizPrompt = `Based on the lesson about ${topic}, create a quiz with 5 multiple choice questions. 
    Format the response as a JSON object with the following structure:
    {
      "questions": [
        {
          "question": "Question text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correct": 0, // index of correct option
          "explanation": "Explanation of why this is the correct answer"
        }
      ]
    }
    Make the questions challenging but fair, and ensure the explanations are educational.`;

    const quizResponse = await getGeminiResponse(quizPrompt, agentId, memberNames);
    let quiz;
    try {
      quiz = JSON.parse(quizResponse);
    } catch (err) {
      // Try to extract JSON from the response
      const jsonStr = extractJsonFromString(quizResponse);
      if (jsonStr) {
        quiz = JSON.parse(jsonStr);
      } else {
        throw new Error("Failed to parse quiz JSON");
      }
    }

    // Store the quiz in the chat document
    chat.quiz = quiz;
    await chat.save();

    res.status(201).json({ 
      initialized: true, 
      messages: chat.messages,
      quiz: chat.quiz 
    });
  } catch (error) {
    console.error("Error initializing study session agent:", error);
    res.status(500).json({ error: "Failed to initialize study session agent" });
  }
}; 