import React, { useEffect, useState } from "react";
import { get, post } from "../api/api";
import FarmerDashboard from "./FarmerDashboard";
import ExpertDashboard from "./ExpertDashboard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({
    total_unread: 0,
    by_consultation: {},
  });

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("Loaded user:", parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        setError("Invalid user data");
      }
    }

    loadData();
    loadUnreadCounts();

    // Poll for unread counts every 5 seconds
    const interval = setInterval(loadUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await get("/api/v1/dashboard/data");
      console.log("Dashboard data loaded:", res);
      setData(res);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const res = await get("/api/v1/unread-counts");
      setUnreadCounts(res);
    } catch (e) {
      console.error("Error loading unread counts:", e);
    }
  };

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{ color: "#dc2626", fontSize: "18px", marginBottom: "16px" }}
          >
            Error: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0d9488",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data || !user)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #0d9488",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "#6b7280", fontSize: "18px" }}>
            Loading your dashboard...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  console.log("User role:", user.role);

  // Render expert dashboard if user is an expert
  if (user.role === "Expert") {
    console.log("Rendering ExpertDashboard");
    return (
      <ExpertDashboard
        data={data}
        user={user}
        onUpdate={loadData}
        unreadCounts={unreadCounts}
        onUnreadUpdate={loadUnreadCounts}
      />
    );
  }

  console.log("Rendering farmer dashboard");

  // Render farmer dashboard
  return (
    <FarmerDashboard
      data={data}
      user={user}
      onUpdate={loadData}
      unreadCounts={unreadCounts}
      onUnreadUpdate={loadUnreadCounts}
    />
  );
}
