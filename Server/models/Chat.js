import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    isGroupChat: { type: Boolean, default: false },
    name: { type: String, default: "" }, // for group name (optional)
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // only for groups
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);