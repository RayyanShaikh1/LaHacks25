import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";
import { getGeminiResponse } from "../lib/gemini.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find users that have conversations with the logged-in user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", loggedInUserId] },
              "$receiverId",
              "$senderId",
            ],
          },
        },
      },
    ]);

    const userIds = conversations.map((conv) => conv._id);

    // Get user details for these conversations, excluding Nexus AI
    const users = await User.find({
      _id: { $in: userIds },
      email: { $ne: "nexusai@nexus.com" }, // Exclude Nexus AI
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [myId, userToChatId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, userToChatId],
      });
    }

    // Get messages for this specific conversation only
    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    // Get all unique sender IDs
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ];

    // Get user information for all senders
    const users = await User.find({ _id: { $in: senderIds } }).select(
      "name profilePic email"
    );

    // Create a map of user information
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = {
        name: user.name,
        profilePic: user.profilePic,
        email: user.email,
      };
      return acc;
    }, {});

    // Add AI user information
    userMap["nexusai"] = {
      name: "Nexus AI",
      profilePic: "https://www.gravatar.com/avatar/?d=mp",
      email: "nexusai@nexus.com",
    };

    // Add sender information to each message
    const messagesWithSenders = messages.map((msg) => ({
      ...msg.toObject(),
      senderName: userMap[msg.senderId.toString()]?.name || "Unknown",
      senderProfilePic:
        userMap[msg.senderId.toString()]?.profilePic ||
        "https://www.gravatar.com/avatar/?d=mp",
      isAI: msg.isAI || false,
    }));

    res.status(200).json(messagesWithSenders);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      messageType: "direct",
      conversationId: conversation._id,
    });

    await newMessage.save();

    // Get sender information
    const sender = await User.findById(senderId).select("name profilePic");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        senderName: sender.name,
        senderProfilePic: sender.profilePic,
      });
    }

    // Check if message contains @nexus
    if (text && text.includes("@nexus")) {
      const question = text.split("@nexus")[1].trim();

      try {
        // Get or create the AI user
        let aiUser = await User.findOne({ email: "nexusai@nexus.com" });
        if (!aiUser) {
          aiUser = await User.create({
            name: "Nexus AI",
            email: "nexusai@nexus.com",
            password: "placeholder",
            profilePic: "https://www.gravatar.com/avatar/?d=mp",
          });
        }

        // Get or create AI agent for this conversation
        if (!conversation.aiAgentId) {
          conversation.aiAgentId = `agent_${conversation._id}`;
          await conversation.save();
        }

        // Get participant names for context
        const participants = await User.find({
          _id: { $in: conversation.participants },
        }).select("name");
        const participantNames = participants.map((p) => p.name);

        // Get sender's name
        const sender = await User.findById(senderId).select("name");

        let aiResponse;

        // Check if an image is included
        if (image) {
          // Create multimodal prompt parts for Gemini
          const promptParts = [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image.split(",")[1],
              },
            },
            {
              text: question
                ? `Please analyze this image and respond to: "${question}". Keep your response focused and concise.`
                : `Please briefly describe what you see in this image. Keep your response focused and concise.`,
            },
          ];

          aiResponse = await getGeminiResponse(
            null,
            conversation.aiAgentId,
            participantNames,
            sender.name,
            promptParts
          );
        } else {
          // Regular text-only response
          aiResponse = await getGeminiResponse(
            question,
            conversation.aiAgentId,
            participantNames,
            sender.name
          );
        }

        const aiMessage = new Message({
          senderId: aiUser._id,
          receiverId: senderId,
          text: aiResponse,
          messageType: "direct",
          isAI: true,
          conversationId: conversation._id,
        });

        await aiMessage.save();

        const aiMessageData = {
          ...aiMessage.toObject(),
          senderName: "Nexus AI",
          senderProfilePic: "https://www.gravatar.com/avatar/?d=mp",
          isAI: true,
        };

        // Emit AI response to both sender and receiver
        const senderSocketId = getReceiverSocketId(senderId);
        const receiverSocketId = getReceiverSocketId(receiverId);

        // Emit to sender's socket
        if (senderSocketId) {
          io.to(senderSocketId).emit("newMessage", aiMessageData);
        }

        // Emit to receiver's socket if different from sender
        if (receiverSocketId && receiverSocketId !== senderSocketId) {
          io.to(receiverSocketId).emit("newMessage", aiMessageData);
        }

        res.status(201).json(newMessage);
      } catch (error) {
        console.error("Error generating AI response:", error);
        res.status(201).json(newMessage);
      }
    } else {
      res.status(201).json(newMessage);
    }
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit socket event to notify other users
    if (message.messageType === "direct") {
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", messageId);
      }
    } else if (message.messageType === "group") {
      // For group messages, notify all group members
      const group = await Group.findById(message.groupId);
      if (group) {
        group.members.forEach((memberId) => {
          if (memberId.toString() !== userId.toString()) {
            const memberSocketId = getReceiverSocketId(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit("messageDeleted", messageId);
            }
          }
        });
      }
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const startConversation = async (req, res) => {
  try {
    const { email } = req.body;
    const loggedInUserId = req.user._id;

    // Find user by email
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() === loggedInUserId.toString()) {
      return res
        .status(400)
        .json({ error: "Cannot start conversation with yourself" });
    }

    // Check if conversation already exists
    const existingConversation = await Message.findOne({
      $or: [
        { senderId: loggedInUserId, receiverId: user._id },
        { senderId: user._id, receiverId: loggedInUserId },
      ],
    });

    if (existingConversation) {
      return res.status(400).json({ error: "Conversation already exists" });
    }

    // Create initial message
    const newMessage = new Message({
      senderId: loggedInUserId,
      receiverId: user._id,
      text: "Hello! 👋",
      messageType: "direct",
    });

    await newMessage.save();

    // Get the sender's user data
    const sender = await User.findById(loggedInUserId).select("-password");

    // Notify both users about the new conversation
    const receiverSocketId = getReceiverSocketId(user._id);
    const senderSocketId = getReceiverSocketId(loggedInUserId);

    // Emit to receiver
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newConversation", {
        user: sender,
        message: newMessage,
      });
    }

    // Emit to sender
    if (senderSocketId) {
      io.to(senderSocketId).emit("newConversation", {
        user: user,
        message: newMessage,
      });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error in startConversation: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Forward to group.controller.js
    return res.status(400).json({
      error: "Group messages should be handled by group.controller.js",
    });
  } catch (error) {
    console.log("Error in sendGroupMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });

    // Get all unique sender IDs
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId.toString())),
    ];

    // Get user information for all senders
    const users = await User.find({ _id: { $in: senderIds } }).select(
      "name profilePic email"
    );

    // Create a map of user information
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = {
        name: user.name,
        profilePic: user.profilePic,
        email: user.email,
      };
      return acc;
    }, {});

    // Add sender information to each message
    const messagesWithSenders = messages.map((msg) => ({
      ...msg.toObject(),
      senderName: userMap[msg.senderId.toString()]?.name || "Unknown",
      senderProfilePic:
        userMap[msg.senderId.toString()]?.profilePic ||
        "https://www.gravatar.com/avatar/?d=mp",
    }));

    res.status(200).json(messagesWithSenders);
  } catch (error) {
    console.log("Error in getGroupMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
