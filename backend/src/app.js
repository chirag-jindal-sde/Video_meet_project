import express from "express";
import {createServer} from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import connectToSocket from "./controllers/socketManager.js";
import userRoutes from "./routes/usersRoute.js"
import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

const app = express();
const server = createServer(app);
const io = connectToSocket(server); 

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://video-meet-project-2.onrender.com"
  ],
  credentials: true
}));

app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended:true}));
app.use("/api/v1/users",userRoutes);

const start = async () => {
    const connectionDb = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Mongo connected db host : ${connectionDb.connection.host}`);
    server.listen("8080",()=>{
        console.log("listening on the port 8080")
    })
}

start();
