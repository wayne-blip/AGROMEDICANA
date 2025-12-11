import React, { useState } from "react";
import { Link } from "react-router-dom";
import { post } from "../api/api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Client");
  const [meta, setMeta] = useState("");
  const [farmingTypes, setFarmingTypes] = useState({
    livestock: false,
    crops: false,
    aquaculture: false,
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFarmingTypeChange = (type) => {
    const updated = { ...farmingTypes, [type]: !farmingTypes[type] };
    setFarmingTypes(updated);

    // Build comma-separated string from selected types
    const selected = [];
    if (updated.livestock) selected.push("Animal Health (Livestock)");
    if (updated.crops) selected.push("Plant Health (Crops)");
    if (updated.aquaculture) selected.push("Aquatic Health (Aquaculture)");
    setMeta(selected.join(", "));
  };

  async function submit(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await post("/api/v1/auth/register", {
        username,
        password,
        role,
        meta,
      });

      setIsLoading(false);

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.status === "ok") {
        setMessage({
          type: "success",
          text: `Welcome ${res.user.username}! Your account has been created. Redirecting to login...`,
        });
        // Clear form fields
        setUsername("");
        setPassword("");
        setRole("Client");
        setMeta("");
        setFarmingTypes({ livestock: false, crops: false, aquaculture: false });
        setTimeout(() => (window.location.href = "/login"), 1500);
      } else {
        setMessage({
          type: "error",
          text: "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      setIsLoading(false);
      setMessage({
        type: "error",
        text: "Network error. Please check if the server is running.",
      });
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h2 className="auth-title">Join AgroMedicana</h2>
          <p className="auth-subtitle">
            Zimbabwe's leading platform for agricultural health
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
              placeholder="Choose a username"
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="Client">Farmer</option>
              <option value="Expert">Agricultural Expert</option>
            </select>
            <p className="form-hint">
              {role === "Client"
                ? "Access monitoring devices, book expert consultations, and get AI-powered insights"
                : "Provide professional consultations in animal, plant, or aquatic health"}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              {role === "Client" ? "Farming Type" : "Area of Expertise"}
            </label>
            {role === "Client" ? (
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={farmingTypes.livestock}
                    onChange={() => handleFarmingTypeChange("livestock")}
                    disabled={isLoading}
                  />
                  <span>Animal Health (Livestock)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={farmingTypes.crops}
                    onChange={() => handleFarmingTypeChange("crops")}
                    disabled={isLoading}
                  />
                  <span>Plant Health (Crops)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={farmingTypes.aquaculture}
                    onChange={() => handleFarmingTypeChange("aquaculture")}
                    disabled={isLoading}
                  />
                  <span>Aquatic Health (Aquaculture)</span>
                </label>
                <p className="form-hint">
                  Select one or more farming types that apply to your farm
                </p>
              </div>
            ) : (
              <input
                className="form-input"
                type="text"
                placeholder="e.g., Veterinarian, Agronomist, Aquaculture Specialist"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in here
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
