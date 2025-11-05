import express from "express"
import { reciveMessage, sendMessage } from "./messageController.js"
import { userAuth } from "../middleware/userToken.js";

const router = express.Router()

router.post("/sender/:id", userAuth, sendMessage);
router.get("/reciver/:id", userAuth , reciveMessage);

export default router