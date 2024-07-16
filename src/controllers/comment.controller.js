import Comment from "../models/comment.model.js";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
} from "../utils/index.js";
import { isValidObjectId } from "mongoose";

/**
 * Fetch comments for a video
 */
export const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const comments = await Comment.find({ video: videoId })
    .sort({ createdAt: -1 })
    .populate({
      path: "video",
      select: "title videoFile",
    })
    .populate({
      path: "owner",
      select: "username avatar",
    });

  if (!comments || comments.length === 0) {
    throw new ApiError(404, "Not Comments");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Comments fetched successfully", comments)
    );
});

/**
 * Create a new comment for a video
 */
export const createComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { videoId } = req.params;

  if (!comment) {
    throw new ApiError(400, "Please provide comment");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide video id");
  }

  const comments = await Comment.create({
    comment,
    owner: req.user._id,
    video: videoId,
  });

  if (!comments) {
    throw new ApiError(400, "Error while creating comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Comment created successfully", comments)
    );
});

/**
 * Update a comment
 */
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!comment) {
    throw new ApiError(400, "Please provide text");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    { _id: commentId, owner: req.user._id },
    { comment },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Comment updated successfully",
        updatedComment
      )
    );
});

/**
 * Delete a comment
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const deletedComment = await Comment.findByIdAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully"));
});
