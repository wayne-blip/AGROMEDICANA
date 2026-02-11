import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function QuickActions({ userRole, horizontal = false }) {
  const farmerActions = [
    {
      icon: "ri-calendar-check-line",
      label: "Book Consultation",
      description: "Connect with experts",
      path: "/experts",
      iconColor: "bg-teal-500",
      gradient: "from-teal-50 to-emerald-50",
      border: "border-teal-100",
    },
    {
      icon: "ri-upload-2-line",
      label: "Upload Data",
      description: "Add sensor readings",
      path: "/farm-profile",
      iconColor: "bg-emerald-500",
      gradient: "from-green-50 to-emerald-50",
      border: "border-green-100",
    },
    {
      icon: "ri-file-chart-line",
      label: "View Reports",
      description: "Check analysis",
      path: "/analytics",
      iconColor: "bg-cyan-500",
      gradient: "from-blue-50 to-cyan-50",
      border: "border-blue-100",
    },
  ];

  const expertActions = [
    {
      icon: "ri-calendar-check-line",
      label: "View Schedule",
      description: "Manage appointments",
      path: "/expert-consultations",
      iconColor: "bg-teal-500",
      gradient: "from-teal-50 to-emerald-50",
      border: "border-teal-100",
    },
    {
      icon: "ri-file-text-line",
      label: "Create Report",
      description: "Write recommendations",
      path: "/expert-clients",
      iconColor: "bg-emerald-500",
      gradient: "from-green-50 to-emerald-50",
      border: "border-green-100",
    },
    {
      icon: "ri-bar-chart-line",
      label: "Analytics",
      description: "View statistics",
      path: "/expert-earnings",
      iconColor: "bg-cyan-500",
      gradient: "from-blue-50 to-cyan-50",
      border: "border-blue-100",
    },
  ];

  const actions = userRole === "Expert" ? expertActions : farmerActions;

  // Horizontal layout for under Farm Overview
  if (horizontal) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
            <Link
              to={action.path}
              className={`flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r ${action.gradient} border ${action.border} hover:shadow-md transition-all group cursor-pointer`}
            >
              <div
                className={`w-12 h-12 ${action.iconColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}
              >
                <i className={`${action.icon} text-2xl text-white`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {action.label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical layout (original) - matching Expert Dashboard style
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
          >
          <Link
            to={action.path}
            className={`flex items-center gap-3 p-4 bg-gradient-to-r ${action.gradient} rounded-lg hover:shadow-md transition-all border ${action.border} cursor-pointer`}
          >
            <div
              className={`w-10 h-10 ${action.iconColor} rounded-lg flex items-center justify-center`}
            >
              <i className={`${action.icon} text-xl text-white`}></i>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {action.label}
              </p>
              <p className="text-xs text-gray-600">{action.description}</p>
            </div>
          </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
