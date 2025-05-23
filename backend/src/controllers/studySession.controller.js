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
      .populate('messages.sender', 'name profilePic');
    res.json({ 
      messages: chat ? chat.messages : [],
      quiz: chat && chat.quiz ? chat.quiz : null
    });
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

    // Get sender's user information
    const senderUser = await User.findById(sender).select("name profilePic");
    if (!senderUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add user message with sender information
    const userMessage = {
      sender,
      role: "user",
      content: message,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    // If @nexus is mentioned, get Gemini response
    let aiResponse = null;
    if (message.includes("@nexus")) {
      const question = message.split("@nexus")[1].trim();
      const agentId = `study_${groupId}_${topic.replace(/\s+/g, '_')}`;
      aiResponse = await getGeminiResponse(
        question,
        agentId,
        null,
        senderUser.name
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

    // Format messages with proper sender information
    const populatedMessages = newMessages.map(msg => {
      if (msg.sender) {
        // User message
        return {
          ...msg.toObject(),
          sender: {
            _id: senderUser._id,
            name: senderUser.name,
            profilePic: senderUser.profilePic || "/avatar.png"
          }
        };
      } else {
        // AI message
        return {
          ...msg.toObject(),
          sender: {
            name: "Nexus AI",
            profilePic: "https://www.gravatar.com/avatar/?d=mp"
          }
        };
      }
    });

    io.to(`studychat:${groupId}:${topic}`).emit("newStudyChatMessages", populatedMessages);

    res.json({ message: aiResponse });
  } catch (error) {
    console.error("Error in handleStudyChat:", error);
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
      return res.status(200).json({ alreadyInitialized: true, messages: chat.messages, quiz: chat.quiz });
    }

    // Create a lock for this chat initialization
    const lockKey = `chat_init_${groupId}_${topic}`;
    
    // Check if chat is being initialized by another request
    const isLocked = await StudySessionChat.findOne({ 
      groupId, 
      topic,
      'messages.0': { $exists: true },
      'messages.0.role': 'assistant',
      'messages.0.content': { $regex: '^# ' } // Check if first message is a heading (notes)
    });

    if (isLocked) {
      // If chat is being initialized, wait and retry a few times
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const updatedChat = await StudySessionChat.findOne({ groupId, topic });
        if (updatedChat && updatedChat.messages.length > 0) {
          return res.status(200).json({ 
            alreadyInitialized: true, 
            messages: updatedChat.messages,
            quiz: updatedChat.quiz 
          });
        }
        retries++;
      }
      return res.status(409).json({ error: "Chat initialization in progress" });
    }

    // Create or update chat with AI context
    const aiContext = `You are a specialized AI agent to teach the following students: ${memberNames.join(", ")} about ${topic}. Your role is to provide clear, engaging lessons, answer questions, and guide the group through the material.`;
    if (!chat) {
      chat = new StudySessionChat({ groupId, topic, messages: [], aiContext });
    } else {
      chat.aiContext = aiContext;
    }

    // Add a temporary message to indicate initialization is in progress
    chat.messages.push({
      sender: null,
      role: "assistant",
      content: "# Initializing study materials...",
      timestamp: new Date()
    });
    await chat.save();

    // Fetch PDF buffers for the group
    const pdfBuffers = await getPdfBuffersForGroup(group);
    const promptParts = [
      { text: `${aiContext}\n\nPlease provide a brief lesson about ${topic}.` },
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

    // Update the chat with the AI's lesson
    chat.messages = [{
      sender: null,
      role: "assistant",
      content: aiLesson,
      timestamp: new Date()
    }];

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
      const jsonStr = extractJsonFromString(quizResponse);
      if (jsonStr) {
        quiz = JSON.parse(jsonStr);
      } else {
        throw new Error("Failed to parse quiz JSON");
      }
    } catch (error) {
      console.error("Error parsing quiz JSON:", error);
      // If quiz generation fails, still return the lesson but without a quiz
      await chat.save();
      return res.status(201).json({ 
        initialized: true, 
        messages: chat.messages,
        quiz: null 
      });
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

export const saveQuizResponse = async (req, res) => {
  try {
    const { groupId, topic } = req.params;
    const userId = req.user._id;
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers must be an array" });
    }
    const chat = await StudySessionChat.findOne({ groupId, topic });
    if (!chat || !chat.quiz) {
      return res.status(404).json({ error: "Quiz not found for this topic" });
    }
    // Remove any previous response from this user
    chat.quiz.responses = (chat.quiz.responses || []).filter(r => r.user.toString() !== userId.toString());
    // Add new response
    chat.quiz.responses.push({ user: userId, answers, completed: true });
    await chat.save();

    // Get the user's name for the quiz results
    const user = await User.findById(userId).select("name profilePic");
    
    // Calculate score for real-time update
    const correctAnswers = chat.quiz.questions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correct ? 1 : 0);
    }, 0);
    const score = Math.round((correctAnswers / chat.quiz.questions.length) * 100);

    // Emit socket event for real-time skills update
    io.to(groupId).emit('quizCompleted', {
      topic,
      user: {
        _id: user._id,
        name: user.name,
        profilePic: user.profilePic
      },
      score
    });

    // Format quiz results for Gemini
    let quizResults = `Quiz Results for Topic: ${topic}\n\n`;
    
    chat.quiz.questions.forEach((q, index) => {
      const isCorrect = answers[index] === q.correct;
      quizResults += `Question ${index + 1}: ${q.question}\n`;
      quizResults += `Correct Answer: ${q.options[q.correct]}\n`;
      quizResults += `${user.name}'s Answer: ${q.options[answers[index]]} (${isCorrect ? 'Correct' : 'Incorrect'})\n\n`;
    });

    quizResults += `Overall Score: ${score}%\n`;

    // Get the group to access study materials
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Fetch PDF buffers for the group
    const pdfBuffers = await getPdfBuffersForGroup(group);
    
    // Prepare prompt parts with both quiz results and PDF content
    const promptParts = [
      { text: quizResults },
      ...pdfBuffers.map(buffer => ({
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        }
      }))
    ];

    // Send quiz results and PDF content to group chat's Gemini agent
    const groupAgentId = `group_${groupId}`;
    await getGeminiResponse(
      null,  // No text prompt since we're using promptParts
      groupAgentId,
      null,
      "system",
      promptParts
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving quiz response:", error);
    res.status(500).json({ error: "Failed to save quiz response" });
  }
};

export const getSkillsMetrics = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Get all study session chats for this group
    const chats = await StudySessionChat.find({ groupId })
      .select('topic quiz')
      .populate('quiz.responses.user', 'name profilePic');

    // Calculate skills metrics for all users
    const skills = chats.map(chat => {
      if (!chat.quiz || !chat.quiz.responses) return null;

      // Calculate scores for all users who have responded
      const userScores = chat.quiz.responses.map(response => {
        const totalQuestions = chat.quiz.questions.length;
        const correctAnswers = chat.quiz.questions.reduce((acc, question, index) => {
          return acc + (response.answers[index] === question.correct ? 1 : 0);
        }, 0);

        const score = Math.round((correctAnswers / totalQuestions) * 100);

        return {
          user: response.user,
          score,
          totalQuestions,
          correctAnswers,
          completedAt: response.completed ? new Date() : null
        };
      });

      return {
        topic: chat.topic,
        userScores
      };
    }).filter(skill => skill !== null);

    res.status(200).json(skills);
  } catch (error) {
    console.error("Error in getSkillsMetrics:", error);
    res.status(500).json({ error: "Failed to get skills metrics" });
  }
};