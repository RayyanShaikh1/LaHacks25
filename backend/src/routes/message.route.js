import express from "express";
import { protectRoute } from "../middleware/auth.protectedroute.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

//get all users (friends)
router.get("/users", protectRoute, getUsersForSidebar);

//peer 2 peer messaging id == specific chatter
router.get("/:id", protectRoute, getMessages);

//send messages to a specific chatter
router.post("/send/:id", protectRoute, sendMessage);

//delete a message
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
