import express from "express";
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllTheLikedVideos,
  getAllLikedTweets,
} from "../controllers/like.controller.js";
import { verifyJwt } from "../middleware/index.js";

const router = express.Router();

router.use(verifyJwt);

router.route("/").get(getAllTheLikedVideos);

router.route("/tweets").get(getAllLikedTweets);

router.route("/:videoId").post(toggleVideoLike);

router.route("/comment/:commentId").post(toggleCommentLike);

router.route("/tweet/:tweetId").post(toggleTweetLike);

export default router;
