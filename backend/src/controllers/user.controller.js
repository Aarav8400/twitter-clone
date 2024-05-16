import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
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
        const createdUser=await User.findById(user._id).select("-password -refreshToken")

        return res.status(201).json(new ApiResponse(200,createdUser,"user successfully registered"))

})
 

export {registerUser}