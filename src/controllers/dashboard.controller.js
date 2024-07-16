import Videos from "../models/video.model.js";
import Likes from "../models/like.model.js";
import Subscriptions from "../models/subscription.model.js";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
} from "../utils/index.js";

/**
 * Get channel statistics
 */
export const getChannelStats = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  // Check if the user is authenticated
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // Get the subscriber count
  const subscriptions = await Subscriptions.find({
    subscriber: userId,
  }).select("channel");
  const subscriberCount = subscriptions.length;

  // Get the channel IDs
  const channelIds = subscriptions.map((sub) => sub.channel);

  // Get the video count and total video views for the subscriber's channels
  const videoCount = await Videos.countDocuments({ owner: userId });

  const totalVideoViews = await Videos.aggregate([
    { $match: { owner: { $in: channelIds } } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const videoLikeCount = await Likes.countDocuments({
    video: { $exists: true },
  });

  // Get total likes on comments
  const commentLikeCount = await Likes.countDocuments({
    comment: { $exists: true },
  });

  // Get total likes on tweets
  const tweetLikeCount = await Likes.countDocuments({
    tweet: { $exists: true },
  });

  // Calculate the total likes
  const totalLikes = {
    videoLikes: videoLikeCount,
    commentLikes: commentLikeCount,
    tweetLikes: tweetLikeCount,
  };

  // Calculate the stats
  const stats = {
    videoCount,
    totalVideoViews: totalVideoViews.length
      ? totalVideoViews[0].totalViews
      : 0,
    totalLikes,
    subscriberCount,
  };

  // Return the stats
  return res.status(200).json(new ApiResponse(200, stats));
});

/**
 * Get the videos of the user's subscriptions
 */
export const getChannelVideos = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  console.log(userId);

  // Check if the user is authenticated
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // Get the channels the user is subscribed to
  const subscriptions = await Subscriptions.find({
    subscriber: userId,
  }).select("channel");

  // Extract channel IDs from subscriptions
  const channelIds = subscriptions.map((sub) => sub.channel);

  // Get the videos from the subscribed channels
  const videos = await Videos.find({
    owner: { $in: channelIds },
    isPublished: true,
  }).populate("owner");

  // Return the videos
  return res
    .status(200)
    .json(new ApiResponse(200, "All channel video fetched", videos));
});
