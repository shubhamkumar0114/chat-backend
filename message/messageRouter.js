import express from "express"
import { reciveMessage, sendMessage, uploadFile } from "./messageController.js"
import { userAuth } from "../middleware/userToken.js";

const router = express.Router()

router.post("/sender/:id", userAuth, sendMessage);
router.get("/reciver/:id", userAuth , reciveMessage);
router.post("/upload/:id", userAuth , uploadFile)

export default router