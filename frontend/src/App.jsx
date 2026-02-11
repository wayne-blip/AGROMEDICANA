import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { post, getBase } from "./api/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Experts from "./pages/Experts";
import Landing from "./pages/Landing";
import Consultation from "./pages/Consultation";
import FarmProfile from "./pages/FarmProfile";
import ExpertDashboard from "./pages/ExpertDashboard";
import ExpertConsultations from "./pages/ExpertConsultations";
import ExpertClients from "./pages/ExpertClients";
import ExpertEarnings from "./pages/ExpertEarnings";
import ExpertAvailability from "./pages/ExpertAvailability";
import ExpertReviews from "./pages/ExpertReviews";
import ExpertSettings from "./pages/ExpertSettings";
import ExpertNotifications from "./pages/ExpertNotifications";
import FarmerChats from "./pages/FarmerChats";
import ExpertChats from "./pages/ExpertChats";
import FarmerAnalytics from "./pages/FarmerAnalytics";
import FarmerNotifications from "./pages/FarmerNotifications";
import FarmerPayments from "./pages/FarmerPayments";
import FarmerSettings from "./pages/FarmerSettings";
import RequireAuth from "./components/RequireAuth";

function AppHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="site-header">
      <Link
        to="/"
        className="brand"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <img src="/logo.png" alt="AgroMedicana Logo" className="logo-image" />
        <div>
          <h1 className="title">AgroMedicana</h1>
          <div className="subtitle">
            Farm-to-future monitoring & expert care
          </div>
        </div>
      </Link>

      <nav className="main-nav">
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="nav-link outline">
              Sign in
            </Link>
            <Link to="/register" className="nav-link primary">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/experts" className="nav-link">
              Experts
            </Link>
            <button
              onClick={handleLogout}
              className="nav-link primary"
              style={{ border: "none", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isLanding = location.pathname === "/";

  // ── Global presence heartbeat (every 30s while logged in) ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Send immediately on mount / page change
    post("/api/v1/presence/heartbeat", {}).catch(() => {});
    const iv = setInterval(() => {
      if (localStorage.getItem("token")) {
        post("/api/v1/presence/heartbeat", {}).catch(() => {});
      }
    }, 30000);
    // On tab close / navigate away, try one last ping
    const onUnload = () => {
      try { navigator.sendBeacon?.(`${getBase()}/api/v1/presence/heartbeat-beacon`); } catch (_) {}
    };
    window.addEventListener("beforeunload", onUnload);
    return () => { clearInterval(iv); window.removeEventListener("beforeunload", onUnload); };
  }, [location.pathname]);

  // Dashboard has its own full-screen layout
  if (isDashboard) {
    return (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    );
  }

  // Landing page has its own full-screen layout with navigation
  if (isLanding) {
    return <Landing />;
  }

  // Login and Register have their own full-screen layout
  const isAuth =
    location.pathname === "/login" || location.pathname === "/register";
  if (isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  // Consultation and Farm Profile have their own full-screen layouts
  const isConsultation = location.pathname === "/consultation";
  const isFarmProfile = location.pathname === "/farm-profile";
  const isExperts = location.pathname === "/experts";

  if (isConsultation) {
    return (
      <RequireAuth>
        <Consultation />
      </RequireAuth>
    );
  }

  if (isFarmProfile) {
    return (
      <RequireAuth>
        <FarmProfile />
      </RequireAuth>
    );
  }

  if (isExperts) {
    return (
      <RequireAuth>
        <Experts />
      </RequireAuth>
    );
  }

  // Expert Dashboard pages have their own full-screen layouts
  const isExpertDashboard = location.pathname === "/expert-dashboard";
  const isExpertConsultations = location.pathname === "/expert-consultations";
  const isExpertClients = location.pathname === "/expert-clients";

  if (isExpertDashboard) {
    return (
      <RequireAuth>
        <ExpertDashboard />
      </RequireAuth>
    );
  }

  if (isExpertConsultations) {
    return (
      <RequireAuth>
        <ExpertConsultations />
      </RequireAuth>
    );
  }

  if (isExpertClients) {
    return (
      <RequireAuth>
        <ExpertClients />
      </RequireAuth>
    );
  }

  const isExpertEarnings = location.pathname === "/expert-earnings";
  const isExpertAvailability = location.pathname === "/expert-availability";

  if (isExpertEarnings) {
    return (
      <RequireAuth>
        <ExpertEarnings />
      </RequireAuth>
    );
  }

  if (isExpertAvailability) {
    return (
      <RequireAuth>
        <ExpertAvailability />
      </RequireAuth>
    );
  }

  const isExpertReviews = location.pathname === "/expert-reviews";
  const isExpertSettings = location.pathname === "/expert-settings";

  if (isExpertReviews) {
    return (
      <RequireAuth>
        <ExpertReviews />
      </RequireAuth>
    );
  }

  if (isExpertSettings) {
    return (
      <RequireAuth>
        <ExpertSettings />
      </RequireAuth>
    );
  }

  const isExpertNotifications = location.pathname === "/expert-notifications";
  if (isExpertNotifications) {
    return (
      <RequireAuth>
        <ExpertNotifications />
      </RequireAuth>
    );
  }

  const isFarmerChats = location.pathname === "/chats";
  if (isFarmerChats) {
    return (
      <RequireAuth>
        <FarmerChats />
      </RequireAuth>
    );
  }

  const isExpertChats = location.pathname === "/expert-chats";
  if (isExpertChats) {
    return (
      <RequireAuth>
        <ExpertChats />
      </RequireAuth>
    );
  }

  const isAnalytics = location.pathname === "/analytics";
  const isNotifications = location.pathname === "/notifications";
  const isPayments = location.pathname === "/payments";
  const isSettings = location.pathname === "/settings";

  if (isAnalytics) {
    return (
      <RequireAuth>
        <FarmerAnalytics />
      </RequireAuth>
    );
  }

  if (isNotifications) {
    return (
      <RequireAuth>
        <FarmerNotifications />
      </RequireAuth>
    );
  }

  if (isPayments) {
    return (
      <RequireAuth>
        <FarmerPayments />
      </RequireAuth>
    );
  }

  if (isSettings) {
    return (
      <RequireAuth>
        <FarmerSettings />
      </RequireAuth>
    );
  }

  // Fallback - redirect to dashboard
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
