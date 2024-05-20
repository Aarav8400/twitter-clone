import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { sendEmailVerification, verifyemail, resetPassword } from "../utils/sendEmailVerification.js"
import crypto from "crypto";

const generateAccessAndRefreshToken = async (userId) => {
    try {
      const user = await User.findById(userId);
      const accessToken = user.GenerateAcessToken();
      const refreshToken = user.GenerateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong while generating refresh and access token"
      );
    }
};
  

const registerUser = asyncHandler(async (req,res)=>{
        const {username,email,password,fullName}=req.body
        if(
            [username,email,password,fullName].some((fields)=>fields?.trim()==="")
        )
        {
            throw new ApiError(400,"All fileds are required");
        }
        const existedUser=await User.findOne({
            $or:[{username},{email}]
        })
        if(existedUser){
            throw new ApiError(400,"user already exist with this email or username")
        }
        const avatarLocalPath=req.files?.avatar[0]?.path
        
        if(!avatarLocalPath){
            throw new ApiError(400,"avatar pic is required")
        }
        const avatar=await uploadOnCloudinary(avatarLocalPath);
        if(!avatar){
            throw new ApiError(400,"avatar file is required")
        }
       
        const user=await User.create({
            username,
            fullName,
            email,
            password,
            avatar:{
                public_id:avatar?.public_id,
                url:avatar?.url
            }

        })
        if(!user){
            throw new ApiError(500,"something went wrong while create user in db")
        }
  const createdUser = await User.findById(user._id).select("-password -refreshToken")
  
    const { otp, otpExpire } = createdUser.generateOtp()
        
        createdUser.otp = otp
        createdUser.otpExpire = otpExpire
        await createdUser.save({validateBeforeSave:false})
        await sendEmailVerification({
            email: createdUser.email,
            subject: "verifY email",
            mailgenContent: verifyemail(createdUser.fullName,otp)
        })

        return res.status(201).json(new ApiResponse(200,createdUser,"user successfully registered"))
        

})

const verifyEmail = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {  otp } = req.body;

    if (!otp) {
        throw new ApiError(400, "OTP filed is requried");
    }

    try {
        const user = await User.findById( userId )
        
        if (!user) {
            throw new ApiError(400, "User does not exits!!!");
        }
    
        if (user.isVerified) {
            throw new ApiError(400, "User is already verified");
        }
    
        if (user.otp !== otp) {
            return res.status(400).json(new ApiResponse(400, "Invalid OTP, new OTP sent to your email"));
        }
    
        // Check if OTP is expired
        const currentTime = Date.now();
        const expirationTime = new Date(user.otpExpire.getTime() + 15 * 60 * 1000);
        
        if (currentTime > expirationTime) {
            return res.status(400).json(new ApiResponse(400, "OTP expired "));
        }
 
        // OTP is valid and not expired, mark email as verified

        user.isVerified = true;
        // Optionally otp and otpExpire undefined
        
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        return res.status(201).json(new ApiResponse(201, user, "User Verified successfully"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Unable to verify email, please try again later");
    }
});

const resendEmail = asyncHandler(async (req, res) => {
    const { userId } = req.params

    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const { otp, otpExpire } = user.generateOtp()
        
        user.otp = otp
        user.otpExpire = otpExpire
        await user.save({validateBeforeSave:false})

        await sendEmailVerification({
            email: user.email,
            subject: "verifY email",
            mailgenContent: verifyemail(user.name,otp)
        })

        
        return res.status(201)
        .json(
            new ApiResponse(
                200, 
                null, 
                "Send OTP successfully"
            )
        )
    } catch (error) {
        console.log("Error : ",error);
        throw new ApiError(500,"Somthing went wrong while sending OTP")
    }
})


const login=asyncHandler(async(req,res)=>{
    const{username,email,password}=req.body
    if(!username && !email){     //if(true || false)  
        throw new ApiError(400,"username or email is required")
    }
    const user=await User.findOne({       //!true=false  user=true
        $or:[{email},{username}]
    })
    if(!user){                            // !true=false
        throw new ApiError(400,"this user does not exist")
    }
    if(!user.isVerified){
        throw new ApiError(400,"please verify your email first")
    }
    const validPassword= await user.isPasswordCorrect(password)
    if(!validPassword){     
       throw new ApiError(400,"please provide correct credentials") 
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
      );
      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
      const options = {
        httpOnly: true,
        secure: true,
      };
      return res
        .status(200)
        .cookie("access token", accessToken, options)
        .cookie("refresh token", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              user: loggedInUser,
              refreshToken,
              accessToken,
            },
            "User Logged In Successfully"
          )
        );
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );
  
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const user = await User.findById(decodedToken?._id);
      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }
      
      console.log(user);
     
      if (incomingRefreshToken !== user?.refreshToken) {
        // If token is valid but is used already
        throw new ApiError(401, "Refresh token is expired or used");
      }
      
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };
  
      const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefereshTokens(user?._id);
  
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken: newRefreshToken },
            "Access token refreshed"
          )
        );
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const forgetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(400, "User does not exist"));
    }

    // Generate a forget password token
    const forgetToken = user.generateForgetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create the reset URL
    const myUrl = `${req.protocol}://${req.get("host")}/api/v1/users/password/reset/${forgetToken}`;

    try {
        // Send the email
        await sendEmailVerification({
            email: user.email, 
            subject: "Todo Password reset email",
            mailgenContent: resetPassword(user.name, myUrl)
        });

        // Return success response
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent to your email id"
            )
        );
    } catch (error) {
        // Handle email sending error
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ApiError(500, error.message));
    }
});

const passwordReset = asyncHandler(async (req, res, next) => {
    const token = req.params.token;
    const encryToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: encryToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ApiError(400, "Token is invalid or expired"));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ApiError(400, "Password and confirm password do not match"));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset successfully"
        )
    );
});

 

export {
  registerUser,
  login,
  verifyEmail,
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  passwordReset,
  resendEmail
}