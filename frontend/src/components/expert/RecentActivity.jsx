import React, { useState, useEffect } from "react";
import { get } from "../../api/api";
import { motion } from "framer-motion";

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await get("/api/v1/consultations");
        if (res && res.consultations) {
          // Build activity items from real consultations
          const items = res.consultations.slice(0, 5).map((c) => {
            let icon, color, title, description;
            if (c.status === "completed") {
              icon = "ri-chat-check-line";
              color = "bg-teal-500";
              title = "Completed consultation";
              description = `${c.topic || "Consultation"} with ${c.client_name || "Farmer"}`;
            } else if (c.status === "accepted") {
              icon = "ri-calendar-check-line";
              color = "bg-green-500";
              title = "Accepted booking";
              description = `${c.client_name || "Farmer"} — ${c.topic || "Consultation"}`;
            } else if (c.status === "pending") {
              icon = "ri-calendar-check-line";
              color = "bg-blue-500";
              title = "New booking request";
              description = `${c.client_name || "Farmer"} wants to book: ${c.topic || "Consultation"}`;
            } else if (c.status === "rejected" || c.status === "cancelled") {
              icon = "ri-close-circle-line";
              color = "bg-red-500";
              title = "Consultation cancelled";
              description = `${c.topic || "Consultation"} with ${c.client_name || "Farmer"}`;
            } else {
              icon = "ri-chat-3-line";
              color = "bg-gray-500";
              title = "Consultation";
              description = `${c.client_name || "Farmer"} — ${c.topic || "Consultation"}`;
            }

            const time = c.date ? formatTimeAgo(c.date) : "";

            return {
              id: c.id,
              icon,
              color,
              title,
              description,
              time,
            };
          });
          setActivities(items);
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <i className="ri-history-line text-4xl text-gray-300 mb-3"></i>
          <p className="text-sm text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">
            Your consultation activity will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div
                className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <i className={`${activity.icon} text-xl text-white`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {activity.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
