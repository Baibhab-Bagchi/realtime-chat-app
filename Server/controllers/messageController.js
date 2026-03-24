import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { getIO } from "../index.js";
export async function sendMessage(req, res) {
  try {
    const myId = req.user.id;
    const { chatId, text } = req.body;

    if (!chatId) return res.status(400).json({ error: "chatId is required" });
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });

    const msg = await Message.create({
      chatId,
      senderId: myId,
      text: text.trim(),
    });

    // update lastMessage in chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id });

    const fullMsg = await Message.findById(msg._id).populate(
      "senderId",
      "name email avatar"
    );
const io = getIO();
io.to(chatId).emit("message_received", fullMsg);
    res.status(201).json({ message: fullMsg });
  } catch (err) {
    console.error("❌ SEND MESSAGE ERROR:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
}
export async function getMessages(req, res) {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar");

    res.json({ messages });
  } catch (err) {
    console.error("❌ GET MESSAGES ERROR:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
}