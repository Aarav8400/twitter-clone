import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  login,
  logoutUser,
  registerUser,
  verifyEmail,
  refreshAccessToken,
  forgetPassword,
  passwordReset
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
  
router.route("/verify-email").post(verifyEmail)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refersh-token").post(verifyJWT, refreshAccessToken)





router.route("/forget-password").post(forgetPassword)
router.route("/password/reset/:token").post(passwordReset)


export default router