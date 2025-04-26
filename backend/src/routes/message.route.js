import express from "express";
import { protectRoute } from "../middleware/auth.protectedroute.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
  startConversation,
} from "../controllers/message.controller.js";

const router = express.Router();

//get all users with conversations
router.get("/conversations", protectRoute, getUsersForSidebar);

//start a new conversation
router.post("/start-conversation", protectRoute, startConversation);

//peer 2 peer messaging id == specific chatter
router.get("/:id", protectRoute, getMessages);

//send messages to a specific chatter
router.post("/send/:id", protectRoute, sendMessage);

//delete a message
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
