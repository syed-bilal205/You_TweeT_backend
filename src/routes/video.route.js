import express from "express";
import {
  deleteVideo,
  getSingleVideo,
  publishAVideo,
  updateVideo,
  togglePublishStatus,
  getAllTheVideos,
  unisPublishedVideos,
} from "../controllers/video.controller.js";
import { verifyJwt, upload } from "../middleware/index.js";

/**
 * Video routes
 */
const router = express.Router();

/**
 * Get all the videos
 */
router.route("/").get(getAllTheVideos);

/*

*/
router
  .route("/unpublished-videos")
  .get(verifyJwt, unisPublishedVideos);

/**
 * Toggle publish status of a video
 */
router
  .route("/publish/:videoId")
  .patch(verifyJwt, togglePublishStatus);

/**
 * Publish a video
 */
router.route("/publish").post(
  verifyJwt,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videoFile", maxCount: 1 },
  ]),
  publishAVideo
);

/**
 * Get a single video by id
 * Delete a video by id
 * Update a video by id
 */
router
  .route("/:videoId")
  .get(verifyJwt, getSingleVideo)
  .delete(verifyJwt, deleteVideo)
  .patch(
    verifyJwt,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateVideo
  );

export default router;
