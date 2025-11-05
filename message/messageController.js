import {Message} from "./messageModel.js";
import { CONVERSATION } from "../message/conversation.js";


export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const senderId = req.user.userId;
    const { id: reciverId } = req.params;

    let conversation = await CONVERSATION.findOne({
      member: { $all: [senderId, reciverId] },
    });

    if (!conversation) {
      conversation = await CONVERSATION.create({
        member: [senderId, reciverId],
      });
    }

    const newMessage = new Message({
      senderId,
      reciverId,
      message,
    });

    if (newMessage) {
      conversation.message.push(newMessage);
    }

    await Promise.all([conversation.save(), newMessage.save()]);
    // ✅ Socket emit
    const io = req.app.get("io"); // access global io instance
    io.emit("message", newMessage); // broadcast to all connected clients
   
    return res
      .status(201)
      .json({ msg: "message send successfully", newMessage });
  } catch (error) {
    console.log(error);
  }
};

export const reciveMessage = async (req, res) => {
  try {
    const reciverId = req.params.id;
    const senderId = req.user.userId;

    let conversation = await CONVERSATION.findOne({
      member: { $all: [senderId, reciverId] },
    }).populate("message");
    if (!conversation) {
      return res.status(201).json([]);
    }

    const message = conversation.message;
    return res.status(200).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all msg
export const getAllMessage = async (req ,res)=> {
     try {
       const { sender, receiver } = req.params;
       const messages = await Message.find({
         $or: [
           { sender, receiver },
           { sender: receiver, receiver: sender },
         ],
       }).sort({ createdAt: 1 });
       res.json(messages);
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
}