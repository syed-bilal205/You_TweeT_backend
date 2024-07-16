import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import {
  asyncHandler,
  ApiResponse,
  uploadOnCloudinary,
  deleteFromCloudinary,
  ApiError,
} from "../utils/index.js";
import { isValidObjectId } from "mongoose";

/**
 * Get all videos with pagination, search and sorting
 */
export const getAllTheVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    query = "",
    userId,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const sortOptions = ["asc", "desc"];
  if (!sortOptions.includes(sortType.toLowerCase())) {
    throw new ApiError(400, "Invalid sort type");
  }

  const sort = {
    [sortBy]: sortType.toLowerCase() === "asc" ? 1 : -1,
  };

  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    searchQuery.owner = mongoose.Types.ObjectId(userId);
  }

  const options = {
    page: pageNumber,
    limit: limitNumber,
    sort: sort,
    populate: { path: "owner", select: "username avatar" },
  };

  const result = await Video.paginate(searchQuery, options);

  res.status(200).json(
    new ApiResponse(200, "Videos fetched successfully", {
      videos: result.docs,
      totalVideos: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
    })
  );
});

/**
 * Publish a video
 */
export const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const thumbnailFile = req.files?.thumbnail[0];
  const videoFile = req.files?.videoFile[0];

  if (!thumbnailFile || !videoFile) {
    throw new ApiError(400, "Please provide thumbnail and video");
  }

  const thumbnailLocalFilePath = thumbnailFile.path;
  const videoLocalFilePath = videoFile.path;

  const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
  const videoFileUpload = await uploadOnCloudinary(
    videoLocalFilePath
  );

  if (!thumbnail.url || !videoFileUpload.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFileUpload.duration,
    thumbnail: thumbnail.url,
    videoFile: videoFileUpload.url,
    owner: req.user?._id,
    isPublished: isPublished !== undefined ? isPublished : true,
  });

  if (!video) {
    throw new ApiError(400, "Error while publishing video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video published successfully", video)
    );
});

/**
 * Get a single video
 */
export const getSingleVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },
    { new: true }
  ).populate("owner", ["username", "avatar"]);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userId = req.user?._id;
  if (userId) {
    const user = await User.findById(userId);
    if (!user.watchHistory.includes(videoId)) {
      user.watchHistory.push(videoId);
      await user.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

/**
 * Update a video
 */
export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this video"
    );
  }

  const thumbnailLocalFilePath = req.files?.thumbnail?.[0];
  // console.log(thumbnailLocalFilePath);

  if (thumbnailLocalFilePath) {
    const publicId = video.thumbnail.split("/").pop().split(".")[0];
    // console.log(publicId);
    await deleteFromCloudinary(publicId);
    const thumbnail = await uploadOnCloudinary(
      thumbnailLocalFilePath.path
    );
    // console.log(thumbnail);

    if (!thumbnail.url) {
      throw new ApiError(400, "Error while uploading on cloudinary");
    }

    video.thumbnail = thumbnail.url;
  }

  video.title = title;
  video.description = description;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", video));
});

/**
 * Delete a video
 */
export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this video"
    );
  }

  const publicId = video?.thumbnail?.split("/").pop().split(".")[0];
  const videoFilePublicId = video?.videoFile
    ?.split("/")
    .pop()
    .split(".")[0];
  await deleteFromCloudinary(publicId);
  await deleteFromCloudinary(videoFilePublicId);
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

/**
 * Toggle publish status of a video
 */
export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this video"
    );
  }
  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video status updated successfully", video)
    );
});

export const unisPublishedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const videos = await Video.find({
    owner: userId,
    isPublished: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Unpublished videos retrieved successfully",
        videos
      )
    );
});
