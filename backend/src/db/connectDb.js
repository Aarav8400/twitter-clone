import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB=async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log("mongodb connected")
    } catch (error) {
        console.log(error)
        process.exit(1);
    }
}
export default connectDB