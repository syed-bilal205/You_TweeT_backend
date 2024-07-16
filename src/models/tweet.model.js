import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      required: [true, "Please add a text"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tweet", tweetSchema);
