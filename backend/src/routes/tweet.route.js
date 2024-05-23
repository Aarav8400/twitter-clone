import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTimeline } from "../controllers/TweetController.js";

const router = Router();
router.route('/create').post( verifyJWT, createTweet);

router.route('/user/:id/timeline').get( verifyJWT, getUserTimeline);

export default router