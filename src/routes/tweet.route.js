import express from "express";
import { verifyJwt } from "../middleware/index.js";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
  getAllTweets,
  getTweetById,
} from "../controllers/tweet.controller.js";

const router = express.Router();

router.use(verifyJwt);

router.route("/").post(createTweet).get(getAllTweets);
router.route("/user-tweets").get(getUserTweet);
router
  .route("/:tweetId")
  .delete(deleteTweet)
  .patch(updateTweet)
  .get(getTweetById);

export default router;
