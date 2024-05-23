import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
    console.log(req.body);
  const { content, hashtags } = req.body;
  console.log(hashtags);
  console.log(content);
  const author = req.user._id;
//   if (!content) {
//     throw new ApiError(400, "content field is required");
//   }
  const mediaLocalPath = req.files?.media[0]?.path;
  const media = await uploadOnCloudinary(mediaLocalPath);

  const tweet = await Tweet.create({
    content,
    author,
    media: {
      public_id: media?.public_id,
      url: media?.url,
    },
    hashtags,
  });

  res.status(201).json(new ApiResponse(200, tweet, "successfully tweet"));
});

const getUserTimeline = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).populate("following");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({
    author: { $in: [userId, ...user.following.map((f) => f._id)] },
  })
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, tweets, "successfully fetched users timeline "));
});
export { createTweet, getUserTimeline };
