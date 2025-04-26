import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import User from "../models/user.model.js";
import { getGeminiResponse } from "../lib/gemini.js";
import cloudinary from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const adminId = req.user._id;

    // Ensure admin is included in members
    if (!members.includes(adminId)) {
      members.push(adminId);
    }

    const newGroup = new Group({
      name,
      members,
      admin: adminId,
      aiAgentId: null, // Will be initialized on first AI interaction
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .populate("admin", "-password");
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId })
      .populate("senderId", "name profilePic email")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      messageType: "group",
    });

    await newMessage.save();

    // Get sender information
    const sender = await User.findById(senderId).select("name profilePic");

    // Get group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // First emit the original message to all group members
    const messageData = {
      ...newMessage.toObject(),
      senderName: sender.name,
      senderProfilePic: sender.profilePic,
      groupId: group._id,
    };

    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", messageData);
        }
      }
    });

    // Then handle AI response if @nexus is mentioned
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

        // Create or get AI agent ID for this group
        if (!group.aiAgentId) {
          group.aiAgentId = `group_${group._id}`;
          await group.save();
        }

        // Get group member names for context
        const members = await User.find({
          _id: { $in: group.members },
        }).select("name");
        const memberNames = members.map((m) => m.name);

        let aiResponse;

        // Check if an image is included
        if (image) {
          // Create multimodal prompt parts for Gemini
          const promptParts = [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image.split(",")[1], // Remove the data:image/jpeg;base64, prefix
              },
            },
            {
              text: question
                ? `Please analyze this image and respond to: "${question}". Keep your response focused and concise.`
                : `Please briefly describe what you see in this image. Keep your response focused and concise.`,
            },
          ];

          // Send initial context first if this is a new chat
          if (!group.aiAgentId) {
            await getGeminiResponse(null, group.aiAgentId, memberNames, null);
          }

          aiResponse = await getGeminiResponse(
            null,
            group.aiAgentId,
            memberNames,
            sender.name,
            promptParts
          );
        } else {
          // Regular text-only response
          // Send initial context first if this is a new chat
          if (!group.aiAgentId) {
            await getGeminiResponse(null, group.aiAgentId, memberNames, null);
          }

          aiResponse = await getGeminiResponse(
            question,
            group.aiAgentId,
            memberNames,
            sender.name
          );
        }

        const aiMessage = new Message({
          senderId: aiUser._id,
          groupId,
          text: aiResponse,
          messageType: "group",
          isAI: true,
        });

        await aiMessage.save();

        // Wait a short delay to ensure message ordering
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Emit AI response to all group members
        const aiMessageData = {
          ...aiMessage.toObject(),
          senderName: "Nexus AI",
          senderProfilePic: "https://www.gravatar.com/avatar/?d=mp",
          groupId: group._id,
        };

        group.members.forEach((memberId) => {
          const memberSocketId = getReceiverSocketId(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).emit("newGroupMessage", aiMessageData);
          }
        });
      } catch (error) {
        console.error("Error getting AI response:", error);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { groupId, newMembers } = req.body;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, admin: userId });
    if (!group) {
      return res
        .status(403)
        .json({ error: "You are not the admin of this group" });
    }

    group.members = [...new Set([...group.members, ...newMembers])];
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addGroupMembers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeGroupMembers = async (req, res) => {
  try {
    const { groupId, membersToRemove } = req.body;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, admin: userId });
    if (!group) {
      return res
        .status(403)
        .json({ error: "You are not the admin of this group" });
    }

    group.members = group.members.filter(
      (member) => !membersToRemove.includes(member.toString())
    );
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in removeGroupMembers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
