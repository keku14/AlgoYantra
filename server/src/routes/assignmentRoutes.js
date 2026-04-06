import express from "express";

import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  updateAssignment,
} from "../controllers/assignmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(getAssignments).post(authorize("teacher"), createAssignment);
router
  .route("/:assignmentId")
  .get(getAssignmentById)
  .put(authorize("teacher"), updateAssignment)
  .delete(authorize("teacher"), deleteAssignment);

export default router;
