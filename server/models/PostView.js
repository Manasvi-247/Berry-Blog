// models/PostView.js (for tracking live views)
const mongoose = require("mongoose");

const postViewSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      unique: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const PostView = mongoose.model("PostView", postViewSchema);

module.exports = PostView;
