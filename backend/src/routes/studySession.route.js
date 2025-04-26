import express from "express";
import { processStudyFile } from "../controllers/studySession.controller.js";
import { protectRoute } from "../middleware/auth.protectedroute.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post(
  "/:groupId/process",
  protectRoute,
  upload.single("file"),
  processStudyFile
);

export default router; 