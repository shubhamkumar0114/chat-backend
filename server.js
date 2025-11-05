import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";
import { app, server } from "./socket/socket.js";

dotenv.config();
import userRouter from "./users/userRouter.js";
import messageRouter from "./message/messageRouter.js";
import connectMongodb from "./db_connection/db.js";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
const PORT = process.env.PORT;

// mogodb connection
await connectMongodb(process.env.mongodbUrl);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST","PUT"],
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
    temFileDir: "/temp/",
  })
);
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.SECRET_KEY,
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
