import User from "../models/user.model.js";
import {
  asyncHandler,
  ApiResponse,
  ApiError,
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/index.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    // console.log("access " + accessToken);
    const refreshToken = await user.generateRefreshToken();
    // console.log("refresh " + refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (
    [username, email, password, fullName].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const duplicateUser = await User.findOne({
    $or: [{ username }, { email }],
  }).exec();

  if (duplicateUser) {
    throw new ApiError(400, "Username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // console.log("Avatar Local Path Register:", avatarLocalPath);

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log("uploaded avatar:", avatar);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : {
        url: "https://images.unsplash.com/photo-1545486332-9e0999c535b2?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      };

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url,
  });

  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .exec();

  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "User created", createdUser));
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const duplicateUser = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  }).exec();

  if (!duplicateUser) {
    throw new ApiError(404, "User not found register first");
  }

  const isPasswordMatched = await duplicateUser.isPasswordMatched(
    password
  );

  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(duplicateUser._id);

  const loggedInUser = await User.findById(duplicateUser._id)
    .select("-password -refreshToken")
    .exec();

  const cookieOptions = {
    sameSite: "strict",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      httpOnly: true,
    })
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(200, "User Login Successfully", {
        loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const cookieOptions = {
    sameSite: "strict",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  res
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, "Logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const foundUser = await User.findById(decoded._id).exec();
    if (
      !foundUser ||
      incomingRefreshToken !== foundUser.refreshToken
    ) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(foundUser._id);

    const cookieOptions = {
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(200, "Access token refreshed", {
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    const statusCode =
      error instanceof jwt.JsonWebTokenError ? 403 : 500;
    throw new ApiError(
      statusCode,
      error.message || "Invalid refresh token"
    );
  }
});

export const changeCurrentPassword = asyncHandler(
  async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await User.findById(req.user?._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordMatched(
      oldPassword
    );

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Old password is incorrect");
    }

    if (oldPassword === newPassword) {
      throw new ApiError(
        400,
        "New password cannot be the same as the current password"
      );
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, "Password changed successfully"));
  }
);

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken")
    .exec();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
});

export const updateUserAccountDetails = asyncHandler(
  async (req, res) => {
    const { email, fullName, username } = req.body;

    if (!fullName && !email && !username) {
      throw new ApiError(400, "At least one field is required");
    }

    const user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updateFields = {};

    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email });

      if (
        existingEmailUser &&
        existingEmailUser._id.toString() !== user._id.toString()
      ) {
        throw new ApiError(400, "Email already in use");
      }
      updateFields.email = email;
    }

    if (username && username !== user.username) {
      const existingUsernameUser = await User.findOne({ username });

      if (
        existingUsernameUser &&
        existingUsernameUser._id.toString() !== user._id.toString()
      ) {
        throw new ApiError(400, "Username already in use");
      }
      updateFields.username = username;
    }

    if (fullName) {
      updateFields.fullName = fullName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "User account details updated",
          updatedUser
        )
      );
  }
);

export const updateUserAvatar = asyncHandler(async (req, res) => {
  // console.log("Uploaded file:", req.file);

  const avatarLocalPath = req.file?.path;
  // console.log("Avatar local path:", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please provide an avatar");
  }

  const publicId = req.user?.avatar?.split("/").pop().split(".")[0];

  await deleteFromCloudinary(publicId);

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const userUpdatedAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Avatar updated successfully",
        userUpdatedAvatar
      )
    );
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Please provide cover image");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (user.coverImage) {
    const publicId = user?.coverImage.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  user.coverImage = coverImage.url;
  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "user cover image updated successfully",
        user
      )
    );
});

export const getUserChannelProfile = asyncHandler(
  async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "user name is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username,
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          subscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribedTo"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          refreshToken: 0,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "channel does not exist");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "success", channel[0]));
  }
);

export const getWatchHistory = asyncHandler(async (req, res) => {
  const userWatchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id.toString()),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
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
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$watchHistory.owner", 0] },
      },
    },
  ]);

  if (
    !userWatchHistory ||
    userWatchHistory.length === 0 ||
    !userWatchHistory[0].watchHistory
  ) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Watch history not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "success",
        userWatchHistory[0].watchHistory
      )
    );
});
