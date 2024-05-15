import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/connectDb.js";
dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 5000;
connectDB()
.then(()=>{
    app.on("error", (error) => {
        console.log(error)
        throw error
    })
    app.listen(port,()=>{
        console.log(`server is running on port ${port}`)
    })
})
.catch((error)=>{
    console.log("mongodb connection error",error)
})

