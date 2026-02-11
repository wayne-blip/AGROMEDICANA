import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { get } from "../../api/api";
import { motion } from "framer-motion";

export default function ExpertSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [unreadChats, setUnreadChats] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const data = await get("/api/v1/unread-counts");
      setUnreadChats(data.total_unread || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 15000);
    return () => clearInterval(iv);
  }, [fetchUnread]);

  const menuItems = [
    {
      icon: "ri-dashboard-line",
      label: "Dashboard",
      path: "/expert-dashboard",
    },
    {
      icon: "ri-calendar-check-line",
      label: "Consultations",
      path: "/expert-consultations",
    },
    { icon: "ri-message-3-line", label: "Chats", path: "/expert-chats" },
    { icon: "ri-user-follow-line", label: "Clients", path: "/expert-clients" },
    { icon: "ri-line-chart-line", label: "Earnings", path: "/expert-earnings" },
    {
      icon: "ri-time-line",
      label: "Availability",
      path: "/expert-availability",
    },
    {
      icon: "ri-notification-3-line",
      label: "Notifications",
      path: "/expert-notifications",
    },
    { icon: "ri-star-line", label: "Reviews", path: "/expert-reviews" },
    { icon: "ri-settings-3-line", label: "Settings", path: "/expert-settings" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link to="/expert-dashboard" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AgroMedicana"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  AgroMedicana
                </h1>
                <p className="text-xs text-teal-600">Expert Portal</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <motion.ul className="space-y-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.li key={item.path} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <i className={`${item.icon} text-xl`}></i>
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.label === "Chats" && unreadChats > 0 && (
                        <span className={`ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 ${
                          location.pathname === "/expert-chats" ? "bg-white/30 text-white" : "bg-rose-500 text-white"
                        }`}>
                          {unreadChats > 99 ? "99+" : unreadChats}
                        </span>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          {/* Help Card */}
          <div className="p-2 border-t border-gray-200">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-2 border border-teal-200">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center mb-1">
                <i className="ri-question-line text-sm text-white"></i>
              </div>
              <h3 className="font-semibold text-gray-900 text-xs">
                Need Help?
              </h3>
              <p className="text-xs text-gray-600 mb-1">Contact support</p>
              <button className="w-full py-1 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition-colors cursor-pointer">
                Get Support
              </button>
            </motion.div>
          </div>
        </div>
      </aside>
    </>
  );
}
