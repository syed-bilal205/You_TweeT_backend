import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "Please add a content"],
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

commentSchema.plugin(mongoosePaginate);

export default mongoose.model("Comment", commentSchema);
