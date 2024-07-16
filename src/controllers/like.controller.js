import Like from "../models/like.model.js";
import { isValidObjectId, mongoose } from "mongoose";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
} from "../utils/index.js";
import Video from "../models/video.model.js";
import Comment from "../models/comment.model.js";
import Tweet from "../models/tweet.model.js";

/**
 * Toggle video like
 */
export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const like = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (like) {
    await Like.deleteOne({ _id: like._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Video unliked successfully"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new ApiError(400, "Error while liking video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video liked successfully"));
});

/**
 * Toggle comment like
 */
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!commentId) {
    throw new ApiError(404, "Comment Required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const like = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (like) {
    await Like.deleteOne({ _id: like._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Comment unliked successfully"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new ApiError(400, "Error while liking comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment liked successfully"));
});

/**
 * Toggle tweet like
 */
export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if (!tweetId) {
    throw new ApiError(404, "Tweet Required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const like = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (like) {
    await Like.deleteOne({ _id: like._id });
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet unliked successfully"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new ApiError(400, "Error while liking tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet liked successfully"));
});

/**
 * Get all the liked videos
 */
export const getAllTheLikedVideos = asyncHandler(async (req, res) => {
  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    email: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$videoDetails",
    },

    {
      $project: {
        video: {
          _id: "$videoDetails._id",
          videoFile: "$videoDetails.videoFile",
          thumbnail: "$videoDetails.thumbnail",
          title: "$videoDetails.title",
          description: "$videoDetails.description",
          duration: "$videoDetails.duration",
          views: "$videoDetails.views",
          isPublished: "$videoDetails.isPublished",
          createdAt: "$videoDetails.createdAt",
          updatedAt: "$videoDetails.updatedAt",
          owner: "$videoDetails.ownerDetails",
        },
      },
    },
    {
      $sort: {
        "video.createdAt": -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Success", videos));
});

/**
 * Get all the liked tweets
 */
export const getAllLikedTweets = asyncHandler(async (req, res) => {
  const tweets = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "tweets", // Assuming the collection name for tweets
        localField: "tweet", // Field in Like collection that references tweets
        foreignField: "_id", // Field in tweets collection to match
        as: "tweetDetails", // Alias for the joined tweets data
        pipeline: [
          {
            $lookup: {
              from: "users", // Assuming the collection name for users
              localField: "owner", // Field in tweets collection that references users
              foreignField: "_id", // Field in users collection to match
              as: "ownerDetails", // Alias for the joined users data
              pipeline: [
                {
                  $project: {
                    username: 1,
                    email: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$tweetDetails",
    },
    {
      $project: {
        tweet: {
          _id: "$tweetDetails._id",
          text: "$tweetDetails.text",
          createdAt: "$tweetDetails.createdAt",
          updatedAt: "$tweetDetails.updatedAt",
          owner: "$tweetDetails.ownerDetails",
        },
      },
    },
    {
      $sort: {
        "tweet.createdAt": -1,
      },
    },
  ]);

  return res.status(200).json(tweets);
});
