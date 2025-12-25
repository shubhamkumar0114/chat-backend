import express from "express"
import { deleteMessage, reciveMessage, sendMessage, uploadFile } from "./messageController.js"
import { userAuth } from "../middleware/userToken.js";

const router = express.Router()

router.post("/sender/:id", userAuth, sendMessage);
router.get("/reciver/:id", userAuth , reciveMessage);
router.post("/upload/:id", userAuth , uploadFile)
router.post("/deletemessage/:msgId", userAuth, deleteMessage);

export default router