import React, { useEffect, useState } from "react";
import { get, post } from "../api/api";
import { Link } from "react-router-dom";
import DeviceCard from "../components/DeviceCard";
import MessagingModal from "../components/MessagingModal";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
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
      <div className="dashboard-loading">
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  if (loading || !data || !user)
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
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

  // Calculate summary stats for farmer dashboard
  const activeConsultations = data.upcoming_consultations.filter(
    (c) => c.status === "accepted"
  ).length;
  const pendingConsultations = data.upcoming_consultations.filter(
    (c) => c.status === "pending"
  ).length;
  const completedConsultations = data.upcoming_consultations.filter(
    (c) => c.status === "completed"
  ).length;
  const devicesOnline = data.devices.length;
  const criticalAlerts = data.alert ? 1 : 0;

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, {user?.username || "Farmer"}!
          </h1>
          <p className="dashboard-subtitle">{user?.meta || "Farm"} Dashboard</p>
        </div>
        <Link to="/experts" className="btn-cta">
          <span className="btn-icon">📞</span> Start New Consultation
        </Link>
      </div>

      {/* Quick Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card consultations">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <h3>Consultations</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{activeConsultations}</span>
                <span className="stat-label">Accepted</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{pendingConsultations}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card devices">
          <div className="summary-icon">📡</div>
          <div className="summary-content">
            <h3>Device Monitoring</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{devicesOnline}</span>
                <span className="stat-label">Devices Online</span>
              </div>
              <div className="stat-item">
                <span className="stat-value green">●</span>
                <span className="stat-label">All Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card alerts">
          <div className="summary-icon">🚨</div>
          <div className="summary-content">
            <h3>Alerts</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span
                  className={`stat-value ${criticalAlerts > 0 ? "danger" : ""}`}
                >
                  {criticalAlerts}
                </span>
                <span className="stat-label">Critical</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">Warnings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {data.alert && (
        <div className="alerts-section">
          <h2 className="section-title">
            <span className="title-icon">⚠️</span> Critical Alerts
          </h2>
          <div className="alert-card critical">
            <div className="alert-header">
              <span className="alert-badge urgent">URGENT</span>
              <span className="alert-time">Just now</span>
            </div>
            <div className="alert-content">
              <h3 className="alert-title">Environmental Alert</h3>
              <p className="alert-message">{data.alert}</p>
            </div>
            <div className="alert-actions">
              <button className="btn-alert primary">View Details</button>
              <button className="btn-alert secondary">Contact Expert</button>
            </div>
          </div>
        </div>
      )}

      {/* Device Monitoring Panel */}
      <div className="devices-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">📊</span> Real-Time Device Monitoring
          </h2>
          <button className="btn-link">View All Devices →</button>
        </div>
        <div className="devices-grid">
          {data.devices.map((d) => (
            <div key={d.id} className="device-card-enhanced">
              <div className="device-header">
                <div>
                  <h3 className="device-name">{d.name}</h3>
                  <span className="device-type">
                    {d.type === "soil"
                      ? "🌱 Soil Sensor"
                      : "🐟 Aquaculture Sensor"}
                  </span>
                </div>
                <div className="device-status online">
                  <span className="status-dot"></span> Online
                </div>
              </div>
              <div className="device-readings-grid">
                {d.type === "soil" && (
                  <>
                    <div className="reading-item">
                      <span className="reading-label">Soil Moisture</span>
                      <span className="reading-value">
                        {d.readings.soil_moisture_pct}%
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">Temperature</span>
                      <span className="reading-value">
                        {d.readings.temp_c}°C
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">pH Level</span>
                      <span className="reading-value">{d.readings.ph}</span>
                    </div>
                  </>
                )}
                {d.type === "aquaculture" && (
                  <>
                    <div className="reading-item">
                      <span className="reading-label">Dissolved Oxygen</span>
                      <span
                        className={`reading-value ${
                          d.readings.dissolved_oxygen_mg_l < 4 ? "danger" : ""
                        }`}
                      >
                        {d.readings.dissolved_oxygen_mg_l} mg/L
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">Temperature</span>
                      <span className="reading-value">
                        {d.readings.temp_c}°C
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">pH Level</span>
                      <span className="reading-value">{d.readings.ph}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="device-footer">
                <span className="last-update">Updated: 2 min ago</span>
                <button className="btn-device">View Trends</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consultations Feed */}
      <div className="consultations-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">💬</span> Active Consultations
          </h2>
          <Link to="/experts" className="btn-link">
            Start New →
          </Link>
        </div>

        {data.upcoming_consultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Active Consultations</h3>
            <p>
              Start a consultation with an expert to get personalized advice for
              your farm.
            </p>
            <Link to="/experts" className="btn-cta">
              Browse Experts
            </Link>
          </div>
        ) : (
          <div className="consultations-list">
            {data.upcoming_consultations.map((c) => {
              const unreadCount = unreadCounts.by_consultation?.[c.id] || 0;
              return (
                <div key={c.id} className="consultation-card">
                  <div className="consultation-header">
                    <div className="expert-info">
                      <div className="expert-avatar">👨‍🌾</div>
                      <div>
                        <h4 className="consultation-topic">{c.topic}</h4>
                        <span className="consultation-id">
                          Consultation #{c.id}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} new</span>
                      )}
                      <span className={`status-badge ${c.status}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="consultation-meta">
                    <span className="meta-item">
                      <span className="meta-icon">📅</span> Scheduled
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">💬</span>{" "}
                      {unreadCount > 0
                        ? `${unreadCount} new messages`
                        : "No messages yet"}
                    </span>
                  </div>
                  <div className="consultation-actions">
                    {c.status === "pending" && (
                      <button className="btn-consultation secondary" disabled>
                        Waiting for Expert Approval
                      </button>
                    )}
                    {c.status === "accepted" && (
                      <>
                        <button
                          className="btn-consultation primary"
                          onClick={() => {
                            setSelectedConsultation(c);
                            // Reload unread counts after opening modal
                            setTimeout(() => loadUnreadCounts(), 1000);
                          }}
                        >
                          Send Message {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button className="btn-consultation secondary">
                          View Details
                        </button>
                      </>
                    )}
                    {c.status === "rejected" && (
                      <button className="btn-consultation secondary" disabled>
                        Rejected by Expert
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Messaging Modal */}
      {selectedConsultation && (
        <MessagingModal
          consultation={selectedConsultation}
          user={user}
          onClose={() => setSelectedConsultation(null)}
        />
      )}
    </div>
  );
}

// Expert Dashboard Component
function ExpertDashboard({
  data,
  user,
  onUpdate,
  unreadCounts,
  onUnreadUpdate,
}) {
  const [accepting, setAccepting] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const handleAccept = async (consultationId) => {
    setAccepting(consultationId);
    await post(`/api/v1/consultations/${consultationId}/accept`, {});
    setAccepting(null);
    onUpdate(); // Reload data
  };

  const handleReject = async (consultationId) => {
    setAccepting(consultationId);
    await post(`/api/v1/consultations/${consultationId}/reject`, {});
    setAccepting(null);
    onUpdate(); // Reload data
  };

  const handleOpenMessaging = (consultation) => {
    setSelectedConsultation(consultation);
    // Reload unread counts after opening modal
    setTimeout(() => onUnreadUpdate && onUnreadUpdate(), 1000);
  };

  // Calculate expert-specific stats
  const myConsultations = (data.upcoming_consultations || []).filter(
    (c) => c.expert_id === user?.id
  );
  const pendingRequests = myConsultations.filter(
    (c) => c.status === "pending"
  ).length;
  const activeClients = myConsultations.filter(
    (c) => c.status === "accepted"
  ).length;
  const completedToday = myConsultations.filter(
    (c) =>
      c.status === "completed" &&
      new Date(c.date).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = completedToday * 50; // Mock calculation

  // Get client alerts that need expert attention
  const clientAlerts = data.alert
    ? [
        {
          id: 1,
          clientName: "John's Farm",
          issue: data.alert,
          severity: "critical",
          time: "5 min ago",
        },
      ]
    : [];

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome, Dr. {user?.username || "Expert"}!
          </h1>
          <p className="dashboard-subtitle">
            {user?.meta || "Agricultural Expert"} - Expert Dashboard
          </p>
        </div>
        <Link to="/experts" className="btn-cta">
          <span className="btn-icon">📊</span> View My Profile
        </Link>
      </div>

      {/* Quick Summary Cards for Experts */}
      <div className="summary-grid">
        <div className="summary-card consultations">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <h3>Consultation Requests</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{pendingRequests}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{activeClients}</span>
                <span className="stat-label">Accepted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card devices">
          <div className="summary-icon">💬</div>
          <div className="summary-content">
            <h3>Messages</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span
                  className="stat-value"
                  style={{
                    color:
                      unreadCounts.total_unread > 0 ? "#ff6b6b" : "inherit",
                  }}
                >
                  {unreadCounts.total_unread}
                </span>
                <span className="stat-label">Unread</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{activeClients}</span>
                <span className="stat-label">Active Chats</span>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-card alerts">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <h3>Revenue</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">${totalRevenue}</span>
                <span className="stat-label">Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  ${(totalRevenue * 30).toLocaleString()}
                </span>
                <span className="stat-label">Est. Monthly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Alerts Requiring Attention */}
      {clientAlerts.length > 0 && (
        <div className="alerts-section">
          <h2 className="section-title">
            <span className="title-icon">🚨</span> Client Alerts Requiring
            Attention
          </h2>
          {clientAlerts.map((alert) => (
            <div key={alert.id} className="alert-card critical">
              <div className="alert-header">
                <span className="alert-badge urgent">{alert.severity}</span>
                <span className="alert-time">{alert.time}</span>
              </div>
              <div className="alert-content">
                <h3 className="alert-title">{alert.clientName}</h3>
                <p className="alert-message">{alert.issue}</p>
              </div>
              <div className="alert-actions">
                <button className="btn-alert primary">Respond Now</button>
                <button className="btn-alert secondary">View Farm Data</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Device Monitoring Overview */}
      <div className="devices-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">📊</span> Client Farm Monitoring
          </h2>
          <button className="btn-link">View All Clients →</button>
        </div>
        <div className="devices-grid">
          {(data.devices || []).map((d) => (
            <div key={d.id} className="device-card-enhanced expert-view">
              <div className="device-header">
                <div>
                  <h3 className="device-name">
                    {d.name} - <span className="client-tag">Client Farm</span>
                  </h3>
                  <span className="device-type">
                    {d.type === "soil"
                      ? "🌱 Soil Sensor"
                      : "🐟 Aquaculture Sensor"}
                  </span>
                </div>
                <div className="device-status online">
                  <span className="status-dot"></span> Monitoring
                </div>
              </div>
              <div className="device-readings-grid">
                {d.type === "soil" && (
                  <>
                    <div className="reading-item">
                      <span className="reading-label">Soil Moisture</span>
                      <span className="reading-value">
                        {d.readings.soil_moisture_pct}%
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">Temperature</span>
                      <span className="reading-value">
                        {d.readings.temp_c}°C
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">pH Level</span>
                      <span className="reading-value">{d.readings.ph}</span>
                    </div>
                  </>
                )}
                {d.type === "aquaculture" && (
                  <>
                    <div className="reading-item">
                      <span className="reading-label">Dissolved Oxygen</span>
                      <span
                        className={`reading-value ${
                          d.readings.dissolved_oxygen_mg_l < 4 ? "danger" : ""
                        }`}
                      >
                        {d.readings.dissolved_oxygen_mg_l} mg/L
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">Temperature</span>
                      <span className="reading-value">
                        {d.readings.temp_c}°C
                      </span>
                    </div>
                    <div className="reading-item">
                      <span className="reading-label">pH Level</span>
                      <span className="reading-value">{d.readings.ph}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="device-footer">
                <span className="last-update">Updated: 2 min ago</span>
                <button className="btn-device">Analyze & Advise</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Consultations */}
      <div className="consultations-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">💼</span> My Consultations
          </h2>
          <button className="btn-link">View Schedule →</button>
        </div>

        {myConsultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Consultations Scheduled</h3>
            <p>
              Your consultation requests will appear here. Farmers can book
              consultations through your expert profile.
            </p>
            <Link to="/experts" className="btn-cta">
              Update Availability
            </Link>
          </div>
        ) : (
          <div className="consultations-list">
            {myConsultations.map((c) => {
              const unreadCount = unreadCounts.by_consultation?.[c.id] || 0;
              return (
                <div key={c.id} className="consultation-card expert-view">
                  <div className="consultation-header">
                    <div className="expert-info">
                      <div className="expert-avatar">👨‍🌾</div>
                      <div>
                        <h4 className="consultation-topic">{c.topic}</h4>
                        <span className="consultation-id">
                          Client ID: {c.client_id} • Consultation #{c.id}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} new</span>
                      )}
                      <span className={`status-badge ${c.status}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="consultation-meta">
                    <span className="meta-item">
                      <span className="meta-icon">📅</span>{" "}
                      {new Date(c.date).toLocaleDateString()}
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">⏰</span>{" "}
                      {new Date(c.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">💰</span> $50
                    </span>
                  </div>
                  <div className="expert-notes">
                    <p className="notes-label">Quick Notes:</p>
                    <p className="notes-text">
                      Review client's recent device data before consultation.
                      Focus on soil moisture management.
                    </p>
                  </div>
                  <div className="consultation-actions">
                    {c.status === "pending" && (
                      <>
                        <button
                          className="btn-consultation primary"
                          onClick={() => handleAccept(c.id)}
                          disabled={accepting === c.id}
                        >
                          {accepting === c.id
                            ? "Accepting..."
                            : "Accept Request"}
                        </button>
                        <button
                          className="btn-consultation secondary"
                          onClick={() => handleReject(c.id)}
                          disabled={accepting === c.id}
                        >
                          {accepting === c.id ? "Rejecting..." : "Reject"}
                        </button>
                      </>
                    )}
                    {c.status === "accepted" && (
                      <>
                        <button
                          className="btn-consultation primary"
                          onClick={() => handleOpenMessaging(c)}
                        >
                          Message Client {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button className="btn-consultation secondary">
                          View Client Profile
                        </button>
                      </>
                    )}
                    {c.status === "completed" && (
                      <button className="btn-consultation secondary" disabled>
                        Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Messaging Modal */}
      {selectedConsultation && (
        <MessagingModal
          consultation={selectedConsultation}
          user={user}
          onClose={() => setSelectedConsultation(null)}
        />
      )}
      {/* Expert Performance Metrics */}
      <div className="performance-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">📈</span> Performance Metrics
          </h2>
        </div>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">⭐</div>
            <div className="metric-content">
              <div className="metric-value">4.8</div>
              <div className="metric-label">Average Rating</div>
              <div className="metric-detail">Based on 45 reviews</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <div className="metric-value">92%</div>
              <div className="metric-label">Success Rate</div>
              <div className="metric-detail">Client satisfaction</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-value">45 min</div>
              <div className="metric-label">Avg. Response</div>
              <div className="metric-detail">To client queries</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-value">128</div>
              <div className="metric-label">Total Clients</div>
              <div className="metric-detail">All time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
