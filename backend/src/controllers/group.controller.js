import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import User from "../models/user.model.js";

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
    const { text, image, groupId } = req.body;
    const senderId = req.user._id;

    // Verify user is a member of the group
    const group = await Group.findOne({ _id: groupId, members: senderId });
    if (!group) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

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

    // Emit message to all group members with sender information
    group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const memberSocketId = getReceiverSocketId(memberId);
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", {
            ...newMessage.toObject(),
            senderName: sender.name,
            senderProfilePic: sender.profilePic,
          });
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage: ", error.message);
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
