import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { post } from "../api/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await post("/api/v1/auth/login", { username, password });

      setIsLoading(false);

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.status === "ok") {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setMessage({
          type: "success",
          text: `Welcome back, ${res.user.username}! Redirecting to dashboard...`,
        });
        // Clear form fields
        setUsername("");
        setPassword("");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        setMessage({ type: "error", text: "Login failed. Please try again." });
      }
    } catch (error) {
      setIsLoading(false);
      setMessage({
        type: "error",
        text: "Network error. Please ensure the backend server is running.",
      });
    }
  }
  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">
            Access your agricultural health dashboard
          </p>
        </div>

        {message && (
          <div className={`auth-message ${message.type} animate-slide-down`}>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
          <Link to="/" className="auth-link secondary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
