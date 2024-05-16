import express from 'express'
const app=express();

app.use(express.json())   //for parsing application/json

app.use(express.urlencoded({extended:true})) //for parsing application/x-www-form-urlencoded


import userRouter from './routes/user.routes.js'
app.use("/api/v1/users",userRouter)

export {app}