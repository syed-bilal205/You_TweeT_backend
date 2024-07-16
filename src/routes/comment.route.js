import express from "express";
import { verifyJwt } from "../middleware/index.js";
import {
  createComment,
  deleteComment,
  updateComment,
  getVideoComment,
} from "../controllers/comment.controller.js";

/**
 * Comment routes
 */
const router = express.Router();

/**
 * Verify JWT middleware
 */
router.use(verifyJwt);

/**
 * Delete a comment
 * Update a comment
 */
router
  .route("/:commentId")
  .delete(deleteComment)
  .patch(updateComment);

/**
 * Create a new comment for a video
 * Get comments for a video
 */
router.route("/:videoId").post(createComment).get(getVideoComment);

export default router;
