import express from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload, verifyJwt } from "../middleware/index.js";

const router = express.Router();

/**
 * Register a new user
 */
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  register
);

/**
 * Login a user
 */
router.route("/login").post(login);

/**
 * Logout a user
 */
router.route("/logout").post(verifyJwt, logout);

/**
 * Refresh an access token
 */
router.route("/refresh-token").post(refreshAccessToken);

/**
 * Change the current password of a user
 */
router
  .route("/change-password")
  .post(verifyJwt, changeCurrentPassword);

/**
 * Get the current user
 */
router.route("/current-user").get(verifyJwt, getCurrentUser);

/**
 * Update account details of a user
 */
router
  .route("/update-account-details")
  .patch(verifyJwt, updateUserAccountDetails);

/**
 * Update avatar of a user
 */
router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

/**
 * Update cover image of a user
 */
router
  .route("/update-cover")
  .patch(
    verifyJwt,
    upload.single("coverImage"),
    updateUserCoverImage
  );

/**
 * Get channel profile of a user
 */
router.route("/c/:username").get(verifyJwt, getUserChannelProfile);

/**
 * Get watch history of a user
 */
router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
