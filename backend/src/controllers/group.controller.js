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

    // Emit new group event to all members
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members about the new group
    members.forEach((memberId) => {
      if (memberId.toString() !== adminId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroup", populatedGroup);
        }
      }
    });

    res.status(201).json(populatedGroup);
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
        let promptParts = null;

        // Check if an image is included
        if (image) {
          // Create multimodal prompt parts for Gemini
          promptParts = [
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
        }

        // Initialize chat with context if this is the first interaction
        const isFirstInteraction = !(await Message.findOne({
          groupId: group._id,
          isAI: true,
        }));

        if (isFirstInteraction) {
          await getGeminiResponse(null, group.aiAgentId, memberNames, null);
        }

        // Get AI response
        aiResponse = await getGeminiResponse(
          question,
          group.aiAgentId,
          memberNames,
          sender.name,
          promptParts
        );

        const aiMessage = new Message({
          senderId: aiUser._id,
          groupId,
          text: aiResponse,
          messageType: "group",
          isAI: true,
        });

        await aiMessage.save();

        // Emit AI response to all group members
        const aiMessageData = {
          ...aiMessage.toObject(),
          senderName: aiUser.name,
          senderProfilePic: aiUser.profilePic,
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
        // Don't throw the error to prevent breaking the message flow
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
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
