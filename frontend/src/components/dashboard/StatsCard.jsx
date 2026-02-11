import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon, color, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, boxShadow: "0 8px 25px -8px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-lg border border-gray-100 p-4 transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">{title}</p>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-xs text-gray-500">{trend}</p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}
        >
          <i className={`${icon} text-xl text-white`}></i>
        </motion.div>
      </div>
    </motion.div>
  );
}
