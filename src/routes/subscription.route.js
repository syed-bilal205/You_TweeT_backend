import express from "express";
import { verifyJwt } from "../middleware/index.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.use(verifyJwt);

router
  .route("/toggle-subscription/:channelId")
  .post(toggleSubscription);
router
  .route("/user-channel-subscribers/:channelId")
  .get(getUserChannelSubscribers);
router
  .route("/subscribed-channels/:subscriberId")
  .get(getSubscribedChannels);

export default router;
