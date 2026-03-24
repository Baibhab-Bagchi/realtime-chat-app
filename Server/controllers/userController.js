import User from "../models/User.js";

export async function findUserByEmail(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const user = await User.findOne({ email }).select("_id name email avatar");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("❌ FIND USER ERROR:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
}