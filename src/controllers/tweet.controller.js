import Tweet from "../models/tweet.model.js";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
} from "../utils/index.js";
import { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";

/**
 * Create a new tweet for the user
 */
export const createTweet = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    throw new ApiError(400, "Please provide text");
  }

  const tweet = await Tweet.create({
    text,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(400, "Error while creating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet created successfully", tweet));
});

/**
 * Get all tweets posted by the user
 */
export const getUserTweet = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.user._id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({ owner: req.user._id }).populate(
    "owner",
    ["username", "avatar"]
  );

  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, "Tweets not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Tweets fetched successfully",
        tweets || []
      )
    );
});

/**
 * Update a tweet by id
 */
export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { text } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if (!text) {
    throw new ApiError(400, "Please provide text");
  }

  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: req.user._id },
    { text },
    { new: true }
  );

  if (!updatedTweet) {
    const tweetExists = await Tweet.findById(tweetId);
    if (tweetExists) {
      throw new ApiError(
        403,
        "You are not authorized to update this tweet"
      );
    } else {
      throw new ApiError(404, "Tweet not found");
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Tweet updated successfully", updatedTweet)
    );
});

/**
 * Delete a tweet by id
 */
export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const deletedTweet = await Tweet.findByIdAndDelete({
    _id: tweetId,
    owner: req.user._id,
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully"));
});

/**
 * Get all tweets
 */
export const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find().populate("owner", [
    "username",
    "avatar",
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "All tweets fetched successfully", tweets)
    );
});

/**
 * Get a tweet by id
 */
export const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId).populate("owner", [
    "username",
    "avatar",
  ]);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet fetched successfully", tweet));
});
