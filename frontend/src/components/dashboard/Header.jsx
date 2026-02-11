import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { get, put } from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15 } },
};

export default function Header({ onMenuClick, userRole, user, unreadCounts }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const roleLabels = {
    farmer: "Farmer",
    Farmer: "Farmer",
    Expert: "Expert",
    expert: "Expert",
    admin: "Administrator",
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await get("/api/v1/notifications?per_page=6");
      if (res?.notifications) setNotifications(res.notifications);
    } catch (_) {}
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await get("/api/v1/notifications/unread-count");
      if (res?.unread_count !== undefined) setUnreadCount(res.unread_count);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [showNotifications, fetchNotifications, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      try {
        await put(`/api/v1/notifications/${notif.id}/read`, {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (_) {}
    }
    if (notif.link) {
      setShowNotifications(false);
      navigate(notif.link);
    }
  };

  const markAllRead = async () => {
    try {
      await put("/api/v1/notifications/mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotifIcon = (notif) => {
    const iconMap = {
      booking: "ri-calendar-line",
      consultation: "ri-calendar-check-line",
      accepted: "ri-check-double-line",
      rejected: "ri-close-circle-line",
      completed: "ri-trophy-line",
      cancelled: "ri-forbid-line",
      payment: "ri-money-dollar-circle-line",
      message: "ri-chat-3-line",
    };
    const colorMap = {
      booking: "bg-blue-100 text-blue-600",
      consultation: "bg-blue-100 text-blue-600",
      accepted: "bg-green-100 text-green-600",
      rejected: "bg-red-100 text-red-600",
      completed: "bg-purple-100 text-purple-600",
      cancelled: "bg-orange-100 text-orange-600",
      payment: "bg-emerald-100 text-emerald-600",
      message: "bg-teal-100 text-teal-600",
    };
    return {
      icon: notif.icon || iconMap[notif.type] || "ri-notification-3-line",
      color: colorMap[notif.type] || "bg-gray-100 text-gray-600",
    };
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <i className="ri-menu-line text-xl"></i>
        </button>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search consultations, reports, experts..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-notification-3-line text-xl"></i>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
            {showNotifications && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-0 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <i className="ri-notification-off-line text-3xl text-gray-300"></i>
                      <p className="text-sm text-gray-400 mt-2">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const { icon, color } = getNotifIcon(notif);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${
                            !notif.read ? "bg-teal-50/40" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                              <i className={`${icon} text-sm`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notif.read ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                {notif.title}
                              </p>
                              {notif.description && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {notif.time}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50/50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/notifications");
                    }}
                    className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 pl-3 pr-2 py-1 hover:bg-gray-100 rounded-lg"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {roleLabels[userRole] || "Farmer"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-teal-100">
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user?.full_name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.full_name || user?.username)}
                  </div>
                )}
              </div>
            </button>

            {showProfile && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.full_name || user?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {roleLabels[userRole] || "Farmer"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/farm-profile");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <i className="ri-user-line"></i>
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/settings");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <i className="ri-settings-3-line"></i>
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    // Help page coming soon
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <i className="ri-question-line"></i>
                  <span>Help & Support</span>
                </button>
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <i className="ri-logout-box-line"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
