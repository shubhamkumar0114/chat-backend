import mongoose from "mongoose";

const userGroupConversation = new mongoose.Schema({
  
  phone: {
    type: Number,
    require: true,
  },
});

export const UserGroupConversation = mongoose.model("userGroupConversation", userGroupConversation);