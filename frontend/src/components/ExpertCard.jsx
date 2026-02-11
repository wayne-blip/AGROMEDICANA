import React from "react";
import { motion } from "framer-motion";

export default function ExpertCard({ expert, onBook }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} transition={{ duration: 0.3 }} className="bg-white rounded-lg border border-gray-200 p-4 transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-teal-100 flex-shrink-0">
          <img
            src={expert.avatar || "/images/photos/experts/expert1.jpg"}
            alt={expert.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {expert.name}
          </h3>
          <p className="text-xs text-teal-600">{expert.specialty}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <i className="ri-briefcase-line"></i>
          {expert.years_experience} yrs experience
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-star-fill text-amber-400"></i>
          {expert.rating || "4.8"}
        </span>
      </div>
      <button
        onClick={() => onBook(expert)}
        className="w-full py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
      >
        Book Consultation
      </button>
    </motion.div>
  );
}
