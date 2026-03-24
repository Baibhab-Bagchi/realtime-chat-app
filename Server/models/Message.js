import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, default: "" },
    fileUrl: { type: String, default: "" }, // for later (images/files)
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);