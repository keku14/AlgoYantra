import express from "express";

import {
  getAssignmentSubmissions,
  getMySubmissions,
  submitAssignment,
} from "../controllers/submissionController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/mine", authorize("student"), getMySubmissions);
router.get("/assignment/:assignmentId", authorize("teacher"), getAssignmentSubmissions);
router.post("/:assignmentId", authorize("student"), submitAssignment);

export default router;
