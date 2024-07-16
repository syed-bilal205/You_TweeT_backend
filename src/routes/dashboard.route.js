import express from "express";
import { verifyJwt } from "../middleware/index.js";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(verifyJwt);

router.route("/channel-stats").get(getChannelStats);
router.route("/channel-videos").get(getChannelVideos);

export default router;
