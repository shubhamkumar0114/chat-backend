import { Message } from "./messageModel.js";
import { CONVERSATION } from "../message/conversation.js";
import { v2 as cloudinary } from "cloudinary";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const imageFile = req.files?.image;
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

    let imageData = null;
    if (imageFile) {
      const upload = await cloudinary.uploader.upload(imageFile.tempFilePath, {
        folder: "user_profiles",
        resource_type: "image",
      });
      imageData = {
        public_id: upload.public_id,
        url: upload.secure_url,
      };
    }

    // 🔥 Validate — Both empty allowed? (custom logic)
    if (!message.trim() && !imageData) {
      return res.status(400).json({
        success: false,
        message: "Message or image required",
      });
    }
    message ? message.trim() : "";
    const newMessage = new Message({
      senderId,
      reciverId,
      message: message,
      image: imageData,
    });

    conversation.message.push(newMessage);
    await Promise.all([conversation.save(), newMessage.save()]);

    // emit socket
    const io = req.app.get("io");
    io.to(reciverId).emit("message", newMessage);
    io.to(senderId).emit("message", newMessage);

    return res.status(201).json({
      msg: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
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
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all msg
// export const getAllMessage = async (req, res) => {
//   try {
//     const { sender, receiver } = req.params;
//     const messages = await Message.find({
//       $or: [
//         { sender, receiver },
//         { senderId: receiver, reciverId: sender },
//       ],
//     }).sort({ createdAt: 1 });

//     return res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

export const uploadFile = async (req, res) => {
  try {
    const reciverId = req.params.id;
    const senderId = req.user.userId;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No image uploads" });
    }
    const { image } = req.files;

    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      folder: "user_profiles",
      resource_type: "image",
    });

    await Message.create({
      senderId,
      reciverId,
      image: {
        url: result?.secure_url,
        public_id: result?.public_id,
      },
    });
    return res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
  }
};

// delete message
export const deleteMessage = async(req , res)=>{
  try {
    const {msgId} = req.params;
    console.log(msgId);
  } catch (error) {
    console.log(error)
  }
}