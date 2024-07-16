import Playlist from "../models/playlist.model.js";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
} from "../utils/index.js";
import Video from "../models/video.model.js";
import { isValidObjectId } from "mongoose";

/**
 * Create a new playlist
 */
export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;
  // Check if name and description are provided
  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }
  // Check if user id is valid
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(400, "Error while creating playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist created successfully", playlist)
    );
});

/**
 * Get all playlists of the user
 */
export const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  // Check if user id is valid
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlists = await Playlist.find({ owner: userId }).populate(
    "videos"
  );

  if (!playlists) {
    throw new ApiError(404, "Playlists not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Playlists fetched successfully",
        playlists
      )
    );
});

/**
 * Add video to playlist
 */
export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // Check if playlist id and video id are valid
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in playlist");
  }

  playlist.videos.push(videoId);
  const playlistUpdated = await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Video added to playlist successfully",
        playlistUpdated
      )
    );
});

/**
 * Remove video from playlist
 */
export const removeVideoFromPlaylist = asyncHandler(
  async (req, res) => {
    const { playlistId, videoId } = req.params;
    // Check if playlist id and video id are valid
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (!playlist.videos.includes(videoId)) {
      throw new ApiError(400, "Video does not exist in playlist");
    }

    playlist.videos = playlist.videos.filter(
      (vid) => vid.toString() !== videoId
    );
    await playlist.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Video removed from playlist successfully"
        )
      );
  }
);

/**
 * Delete a playlist
 */
export const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // Check if playlist id is valid
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist deleted successfully"));
});

/**
 * Update a playlist
 */
export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  // Check if playlist id is valid
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  // Check if name and description are provided
  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not updated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Playlist updated successfully",
        updatedPlaylist
      )
    );
});
