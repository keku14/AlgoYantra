import express from "express";

import {
  getLeaderboard,
  getStudentOverview,
  getTeacherOverview,
} from "../controllers/analyticsController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/teacher/overview", authorize("teacher"), getTeacherOverview);
router.get("/student/overview", authorize("student"), getStudentOverview);
router.get("/leaderboard", getLeaderboard);

export default router;
