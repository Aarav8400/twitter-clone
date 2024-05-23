import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  login,
  logoutUser,
  registerUser,
  verifyEmail,
  refreshAccessToken,
  forgetPassword,
  passwordReset,
  resendEmail,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
    ]),
    registerUser
);
  
router.route("/verify-email/:userId").post(verifyEmail)
router.route('/resendEmail/:userId').post(resendEmail)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refersh-token").post(verifyJWT, refreshAccessToken)





router.route("/forget-password").post(forgetPassword)
router.route("/password/reset/:token").post(passwordReset)


router.route("/c/:username").get(verifyJWT, getUserProfile)

router.route('/follow/:id').post(verifyJWT,followUser);
router.route('/unfollow/:id').post(verifyJWT,unfollowUser)

router.route('/:id/followers').get(verifyJWT,getFollowers);
router.route('/:id/following').get(verifyJWT, getFollowing);

export default router