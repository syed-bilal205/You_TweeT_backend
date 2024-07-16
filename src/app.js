import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONT_END_URI || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes imports
import userRoute from "./routes/user.route.js";
import subscriptionRoute from "./routes/subscription.route.js";
import videoRoute from "./routes/video.route.js";
import tweetRoute from "./routes/tweet.route.js";
import commentRoute from "./routes/comment.route.js";
import likeRoute from "./routes/like.route.js";
import PlaylistRoute from "./routes/playlist.route.js";
import dashboardRoute from "./routes/dashboard.route.js";

// routes define
app.use("/api/user", userRoute); //done
app.use("/api/subscription", subscriptionRoute); //done
app.use("/api/video", videoRoute); //done
app.use("/api/tweet", tweetRoute); //done
app.use("/api/comment", commentRoute); //done
app.use("/api/like", likeRoute); //done
app.use("/api/playlist", PlaylistRoute); //done
app.use("/api/dashboard", dashboardRoute); //done

app.get("*", (req, res) => {
  res.send("The page you are looking for does not exist");
});

app.use(errorHandler);
