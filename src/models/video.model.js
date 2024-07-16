import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Please add a video file"],
    },
    thumbnail: {
      type: String,
      required: [true, "Please add a thumbnail"],
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongoosePaginate);

export default mongoose.model("Video", videoSchema);
