import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ExpertSidebar, ExpertHeader } from "../components/expert";
import { get, put, del } from "../api/api";

/* ── Toast ── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const styles = { success: "bg-emerald-50 border-emerald-300 text-emerald-800", error: "bg-red-50 border-red-300 text-red-800", info: "bg-blue-50 border-blue-300 text-blue-800" };
  const icons = { success: "ri-check-double-line", error: "ri-close-circle-line", info: "ri-information-line" };
  return (
    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl max-w-md ${styles[type] || styles.info}`}>
      <i className={`${icons[type] || icons.info} text-xl`}></i>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer"><i className="ri-close-line"></i></button>
    </div>
  );
}

export default function ExpertNotifications() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) { console.error(e); }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const typeParam = filter === "unread" ? "unread" : filter === "all" ? "" : filter;
      const url = typeParam ? `/api/v1/notifications?type=${typeParam}` : "/api/v1/notifications";
      const res = await get(url);
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await put("/api/v1/notifications/mark-all-read", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setToast({ message: "All notifications marked as read", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to mark notifications", type: "error" });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await put(`/api/v1/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/notifications/${id}`);
      const was_unread = notifications.find(n => n.id === id && !n.read);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (was_unread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const getNotifIconStyle = (notif) => {
    const colorMap = {
      booking: "bg-blue-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      completed: "bg-purple-500",
      cancelled: "bg-orange-500",
      payment: "bg-emerald-500",
      message: "bg-teal-500",
    };
    return colorMap[notif.type] || "bg-teal-500";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          <motion.div className="px-6 py-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-1 text-sm text-gray-600">Stay updated with consultation requests and payments</p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                    {unreadCount} unread
                  </span>
                )}
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { value: "all", label: "All" },
                { value: "unread", label: "Unread" },
                { value: "booking", label: "Bookings" },
                { value: "payment", label: "Payments" },
                { value: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    filter === tab.value
                      ? "bg-teal-500 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
                  <span className="text-gray-500">Loading notifications...</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group ${
                        !notification.read ? "bg-teal-50/50" : ""
                      }`}
                      onClick={() => !notification.read && handleMarkRead(notification.id)}
                    >
                      <div
                        className={`w-10 h-10 ${getNotifIconStyle(notification)} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <i className={`${notification.icon || "ri-notification-3-line"} text-xl text-white`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3
                              className={`text-sm font-semibold ${
                                !notification.read ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                              {!notification.read && (
                                <span className="ml-2 w-2 h-2 bg-teal-500 rounded-full inline-block"></span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{notification.time_ago || notification.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete notification"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-notification-off-line text-3xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filter === "unread" ? "No unread notifications" : "No notifications"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filter === "unread"
                      ? "You're all caught up! All notifications have been read."
                      : "When something important happens, you'll be notified here."}
                  </p>
                </div>
              )}
            </div>

            {/* Settings Card */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage how you receive alerts and updates</p>
                </div>
                <Link
                  to="/expert-settings"
                  className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Manage Settings
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
