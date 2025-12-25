import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId, // Ya userId rakh sakte ho agar auth hai
      ref: "USER",
      required: true,
    },
    reciverId: {
      type: mongoose.Schema.Types.ObjectId, // userId bhi ho sakta hai
      ref: "USER",
      required: true,
    },
    message: {
      type: String,
    },
    video: {
      public_id: {
        type: String,
        require: false,
      },
      url: {
        type: String,
        require: false,
      },
    },
    image: {
      public_id: {
        type: String,
        require: false,
      },
      url: {
        type: String,
        require: false,
      },
    },
  },
  { timestamps: true } // createdAt, updatedAt automatically save ho jayega
);

export const Message = mongoose.model("Message", messageSchema);


