import express from "express";
import { protectRoute } from "../middleware/auth.protectedroute.js";
import {
  createGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMembers,
  removeGroupMembers,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/members/add", protectRoute, addGroupMembers);
router.post("/:groupId/members/remove", protectRoute, removeGroupMembers);

export default router; 