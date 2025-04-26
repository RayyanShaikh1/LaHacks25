import express from "express";
import { processStudyFile, getStudySessionLesson, getStudyMaterial } from "../controllers/studySession.controller.js";
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
  upload.array("files", 5), // Allow up to 5 files at once
  processStudyFile
);

// New: Get the current lesson plan for a group
router.get(
  "/:groupId/lesson",
  protectRoute,
  getStudySessionLesson
);

// New route for getting PDFs
router.get(
  "/material/:fileId",
  protectRoute,
  getStudyMaterial
);

export default router; 