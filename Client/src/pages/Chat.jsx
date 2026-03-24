import { useEffect, useMemo, useState } from "react";
import {
  getMyChatsApi,
  getMessagesApi,
  sendMessageApi,
  findUserByEmailApi,
  createChatApi,
} from "../api.js";
import { socket } from "../socket.js";

export default function Chat() {
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [newChatEmail, setNewChatEmail] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);

  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // typing UI
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop_typing", () => setIsTyping(false));

    return () => {
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, []);

  // online and offline stats
  useEffect(() => {
    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online_users");
    };
  }, []);

  const isSelectedUserOnline = () => {
    const other = selectedChat?.members?.find((m) => m._id !== me?.id);
    return !!other && onlineUsers.includes(other._id.toString());
  };

  useEffect(() => {
    if (!me?.id) return;

    socket.connect();
    socket.emit("setup", me.id);

    const handleConnect = () => {
      console.log("⚡ Connected to socket:", socket.id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [me?.id]);

  useEffect(() => {
    socket.on("chat_created", (chat) => {
      setChats((prev) => {
        const exists = prev.some((c) => c._id === chat._id);
        if (exists) return prev;
        return [chat, ...prev];
      });
    });

    return () => socket.off("chat_created");
  }, []);

  useEffect(() => {
    if (!selectedChat?._id) return;

    socket.emit("join_chat", selectedChat._id);
    console.log("📦 Joined chat room:", selectedChat._id);
  }, [selectedChat?._id]);

  useEffect(() => {
    const handleRealtimeMessage = (newMessage) => {
      if (newMessage.chatId !== selectedChat?._id) return;

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === newMessage.chatId
            ? { ...chat, lastMessage: newMessage }
            : chat
        )
      );
    };

    socket.on("message_received", handleRealtimeMessage);

    return () => {
      socket.off("message_received", handleRealtimeMessage);
    };
  }, [selectedChat?._id]);

  useEffect(() => {
    async function loadChats() {
      try {
        setError("");
        setLoadingChats(true);
        const data = await getMyChatsApi();
        setChats(data.chats || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingChats(false);
      }
    }

    loadChats();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedChat?._id) {
        setMessages([]);
        return;
      }

      try {
        setError("");
        setLoadingMessages(true);
        const data = await getMessagesApi(selectedChat._id);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedChat?._id]);

  function getChatDisplayName(chat) {
    if (chat.isGroupChat) return chat.name || "Group Chat";
    const otherUser = chat.members?.find((m) => m._id !== me?.id);
    return otherUser?.name || otherUser?.email || "Unknown User";
  }

  function getLastMessageText(chat) {
    if (!chat.lastMessage) return "No messages yet";
    return chat.lastMessage.text || "Sent an attachment";
  }

  async function handleCreateChat(e) {
    e.preventDefault();
    if (!newChatEmail.trim()) return;

    try {
      setError("");
      setCreatingChat(true);

      const found = await findUserByEmailApi(newChatEmail.trim());
      const created = await createChatApi(found.user._id);

      setChats((prev) => {
        const exists = prev.some((chat) => chat._id === created.chat._id);
        return exists ? prev : [created.chat, ...prev];
      });

      setSelectedChat(created.chat);
      setNewChatEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingChat(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!selectedChat?._id || !messageText.trim()) return;

    try {
      setError("");
      setSending(true);

      const data = await sendMessageApi(selectedChat._id, messageText);

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === data.message._id);
        return exists ? prev : [...prev, data.message];
      });

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, lastMessage: data.message }
            : chat
        )
      );

      setMessageText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white flex">
      <div className="w-80 border-r border-white/10 flex flex-col bg-white/5 backdrop-blur-2xl shadow-2xl">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <span className="text-sm font-bold">💬</span>
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">Chats</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Logged in as: {me?.name || me?.email || "Unknown"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-white/10 bg-white/[0.03]">
          <form onSubmit={handleCreateChat} className="space-y-2">
            <input
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              placeholder="Enter user email to start chat"
              className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <button
              disabled={creatingChat || !newChatEmail.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 hover:from-blue-500 hover:via-blue-400 hover:to-violet-500 transition-all duration-200 px-3 py-3 text-sm font-semibold disabled:opacity-50 shadow-lg shadow-blue-900/30"
            >
              {creatingChat ? "Creating..." : "Start New Chat"}
            </button>
          </form>
        </div>

        <div className="p-3">
          <input
            placeholder="Search chats..."
            className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {error && (
          <div className="mx-3 mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 backdrop-blur">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loadingChats ? (
            <div className="p-4 text-sm text-gray-400">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No chats found</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left px-4 py-3.5 mb-2 rounded-2xl border transition-all duration-200 ${
                  selectedChat?._id === chat._id
                    ? "bg-white/10 border-blue-500/30 shadow-lg shadow-black/20"
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">
                    {getChatDisplayName(chat)}
                  </div>
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      onlineUsers.includes(
                        chat.members?.find((m) => m._id !== me?.id)?._id?.toString()
                      )
                        ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                        : "bg-gray-500"
                    }`}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1.5 truncate">
                  {getLastMessageText(chat)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="h-18 min-h-[72px] border-b border-white/10 flex items-center justify-between px-6 bg-black/10 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
              {selectedChat
                ? getChatDisplayName(selectedChat).charAt(0).toUpperCase()
                : "?"}
            </div>
            <div>
              <div className="font-semibold text-base">
                {selectedChat ? getChatDisplayName(selectedChat) : "Select a chat"}
              </div>
              <div className="text-xs text-gray-400">
                {selectedChat
                  ? isTyping
                    ? "Typing..."
                    : isSelectedUserOnline()
                    ? "Online"
                    : "Offline"
                  : "Choose someone to start messaging"}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-sm px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition shadow-lg"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3">
          {!selectedChat ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">💬</div>
                <div className="text-base">Select a chat from the left 👈</div>
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="text-gray-400 text-sm">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-400 text-sm">No messages yet</div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId?._id === me?.id;

              return (
                <div
                  key={msg._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl rounded-3xl px-4 py-3 shadow-lg border ${
                      isMine
                        ? "bg-gradient-to-r from-blue-600 to-violet-600 border-blue-400/20 rounded-br-md"
                        : "bg-white/8 border-white/10 rounded-bl-md backdrop-blur"
                    }`}
                  >
                    {!isMine && (
                      <div className="text-xs text-blue-300 mb-1 font-medium">
                        {msg.senderId?.name || msg.senderId?.email}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed break-words">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <input
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);

                if (!selectedChat?._id) return;

                socket.emit("typing", selectedChat._id);

                if (typingTimeout) clearTimeout(typingTimeout);

                const timeout = setTimeout(() => {
                  socket.emit("stop_typing", selectedChat._id);
                }, 1000);

                setTypingTimeout(timeout);
              }}
              disabled={!selectedChat || sending}
              placeholder={selectedChat ? "Type a message..." : "Select a chat first"}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50"
            />
            <button
              disabled={!selectedChat || sending || !messageText.trim()}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 hover:from-blue-500 hover:via-blue-400 hover:to-violet-500 transition-all duration-200 font-semibold disabled:opacity-50 shadow-lg shadow-blue-900/30"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}