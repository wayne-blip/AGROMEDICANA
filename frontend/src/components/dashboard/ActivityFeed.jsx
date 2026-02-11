import React from "react";
import { motion } from "framer-motion";

export default function ActivityFeed() {
  const activities = [
    {
      icon: "ri-chat-check-line",
      color: "bg-green-100 text-green-600",
      title: "Consultation completed",
      description:
        "Dr. Sarah Moyo provided recommendations for livestock health",
      time: "2 hours ago",
    },
    {
      icon: "ri-upload-cloud-line",
      color: "bg-blue-100 text-blue-600",
      title: "Sensor data uploaded",
      description: "New soil moisture and temperature readings available",
      time: "5 hours ago",
    },
    {
      icon: "ri-file-text-line",
      color: "bg-purple-100 text-purple-600",
      title: "Report received",
      description: "Crop health analysis report from Prof. James Ndlovu",
      time: "1 day ago",
    },
    {
      icon: "ri-calendar-check-line",
      color: "bg-orange-100 text-orange-600",
      title: "Consultation scheduled",
      description: "Upcoming session with aquatic specialist",
      time: "2 days ago",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.3 + index * 0.08 }}
            className="flex items-start gap-4"
          >
            <div
              className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <i className={`${activity.icon} text-lg`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
