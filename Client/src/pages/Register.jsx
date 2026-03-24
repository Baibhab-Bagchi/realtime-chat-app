import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../api.js";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/chat", { replace: true });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.(com|net|org|in)$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!nameRegex.test(name.trim())) {
      return setError("Name should contain only letters and spaces");
    }

    if (!emailRegex.test(email.trim())) {
      return setError("Enter a valid email like gmail.com, yahoo.com, rediff.com");
    }

    if (!passwordRegex.test(password)) {
      return setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      );
    }

    try {
      setLoading(true);
      const data = await registerApi(name.trim(), email.trim(), password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-gray-950 to-slate-900 text-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30 p-6 md:p-8">
        <div className="mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/30 mb-4">
            <span className="text-lg font-bold">✨</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Register</h1>
          <p className="text-gray-300 text-sm">
            Already have an account?{" "}
            <Link className="text-blue-300 hover:text-blue-200 hover:underline transition" to="/login">
              Login
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Name</label>
            <input
              className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              pattern="^[A-Za-z\s]+$"
              title="Name should contain only letters and spaces"
              required
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.(com|net|org|in)$"
              title="Enter a valid email like gmail.com, yahoo.com, rediff.com"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              className="mt-1.5 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none placeholder:text-gray-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
              title="Password must contain 8+ characters, uppercase, lowercase and a number"
              required
              placeholder="Create a password"
            />
          </div>

          <button
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold transition-all duration-200 shadow-lg ${
              loading
                ? "bg-white/10 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 hover:from-blue-500 hover:via-blue-400 hover:to-violet-500 shadow-blue-900/30"
            }`}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}