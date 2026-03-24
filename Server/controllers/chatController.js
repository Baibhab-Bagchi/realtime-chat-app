import mongoose from "mongoose";
import Chat from "../models/Chat.js";

export async function createOrGetOneToOneChat(req, res) {
  console.log("✅ createOrGetOneToOneChat called");
  try {
    const { userId } = req.body;
    const myId = req.user?.id;

    console.log("myId:", myId);
    console.log("userId:", userId);

    if (!myId) return res.status(401).json({ error: "Unauthorized (no user in token)" });
    if (!userId) return res.status(400).json({ error: "userId is required" });

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (userId === myId) {
      return res.status(400).json({ error: "Cannot chat with yourself" });
    }

    const existing = await Chat.findOne({
      isGroupChat: false,
      members: { $all: [myId, userId], $size: 2 },
    }).populate("members", "name email avatar");

    if (existing) return res.json({ chat: existing });

    const newChat = await Chat.create({
      isGroupChat: false,
      members: [myId, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "members",
      "name email avatar"
    );
    
const io = req.app.get("io");

chat.members.forEach((member) => {
  if (member._id.toString() !== myId) {
    io.to(member._id.toString()).emit("chat_created", chat);
  }
});

    return res.status(201).json({ chat: fullChat });
  } catch (err) {
    console.error("❌ CHAT CREATE ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
}



export async function getMyChats(req, res) {
  try {
    const myId = req.user?.id;
    const chats = await Chat.find({ members: myId })
      .sort({ updatedAt: -1 })
      .populate("members", "name email avatar");

    res.json({ chats });
  } catch (err) {
    console.error("❌ GET CHATS ERROR:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
}