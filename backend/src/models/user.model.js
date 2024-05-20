import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index:true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName:{
      type:String,
      required:true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: String },
    refreshToken: {
      type: String,
    },
     otp: {
        type: String
    },
    otpExpire: {
            type: Date
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.GenerateAcessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.GenerateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateOtp = function () { 
    const otpgenrate = Math.floor(1000 + Math.random() * 9000);
    const expireOtp = Date.now() + (20 * 1000 * 60)

    return {otp: otpgenrate, otpExpire: expireOtp}
}

userSchema.methods.generateForgetPasswordToken = function(){

    const forgetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(forgetToken)
    .digest("hex");

    this.resetPasswordExpire = Date.now() + 20 * 60 * 1000

    return forgetToken;
}

export const User = mongoose.model("User", userSchema);
