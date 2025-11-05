import mongoose from "mongoose";
import { USER } from ".././users/userModel.js";
import { Message } from "./messageModel.js";

const conversationSchema = new mongoose.Schema(
  {
    member: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: USER,
        require: true,
      },
    ],
    message: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Message,
      },
    ],
  },
  { timestamps: true }
);

export const CONVERSATION = mongoose.model("conversation", conversationSchema);
