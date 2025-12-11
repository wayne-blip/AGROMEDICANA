import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Experts from "./pages/Experts";
import Landing from "./pages/Landing";
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
          <h1 className="title">AgroMediciana</h1>
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

export default function App() {
  return (
    <Router>
      <div className="container">
        <AppHeader />

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/experts"
              element={
                <RequireAuth>
                  <Experts />
                </RequireAuth>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
