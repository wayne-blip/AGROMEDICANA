import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { get } from "../../api/api";
import { motion } from "framer-motion";

export default function Sidebar({ isOpen, onClose, userRole }) {
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

  const farmerMenuItems = [
    { icon: "ri-dashboard-line", label: "Dashboard", path: "/dashboard" },
    {
      icon: "ri-calendar-check-line",
      label: "Consultations",
      path: "/consultation",
    },
    { icon: "ri-message-3-line", label: "Chats", path: "/chats" },
    { icon: "ri-plant-line", label: "Farm Profile", path: "/farm-profile" },
    { icon: "ri-line-chart-line", label: "Analytics", path: "/analytics" },
    {
      icon: "ri-notification-3-line",
      label: "Notifications",
      path: "/notifications",
    },
    { icon: "ri-wallet-3-line", label: "Payments", path: "/payments" },
    { icon: "ri-settings-3-line", label: "Settings", path: "/settings" },
  ];

  const expertMenuItems = [
    { icon: "ri-dashboard-line", label: "Dashboard", path: "/dashboard" },
    { icon: "ri-calendar-check-line", label: "My Schedule", path: "/schedule" },
    {
      icon: "ri-chat-3-line",
      label: "Consultations",
      path: "/consultation",
    },
    { icon: "ri-file-text-line", label: "Reports", path: "/reports" },
    {
      icon: "ri-money-dollar-circle-line",
      label: "Earnings",
      path: "/earnings",
    },
    { icon: "ri-settings-3-line", label: "Settings", path: "/settings" },
  ];

  const menuItems = userRole === "Expert" ? expertMenuItems : farmerMenuItems;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AgroMedicana"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">
                AgroMedicana
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <motion.ul className="space-y-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.li key={item.path} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <i className={`${item.icon} text-xl`}></i>
                      <span className="text-sm">{item.label}</span>
                      {item.label === "Chats" && unreadChats > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                          {unreadChats > 99 ? "99+" : unreadChats}
                        </span>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <i className="ri-question-line"></i>
                <h3 className="text-sm font-semibold">Need Help?</h3>
              </div>
              <p className="text-xs opacity-90 mb-3">
                Get support from our team
              </p>
              <button className="w-full py-2 bg-white text-teal-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                Get Support
              </button>
            </motion.div>
          </div>
        </div>
      </aside>
    </>
  );
}
