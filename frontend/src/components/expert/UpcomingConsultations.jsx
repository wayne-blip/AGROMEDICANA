import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api/api";
import { motion } from "framer-motion";

export default function UpcomingConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await get("/api/v1/consultations");
        if (res && res.consultations) {
          // Show upcoming only (pending or accepted), limit to 3
          const upcoming = res.consultations
            .filter((c) => c.status === "pending" || c.status === "accepted")
            .slice(0, 3);
          setConsultations(upcoming);
        }
      } catch (err) {
        console.error("Error fetching consultations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Upcoming Consultations
        </h2>
        <Link
          to="/expert-consultations"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      ) : consultations.length === 0 ? (
        <div className="text-center py-8">
          <i className="ri-calendar-line text-4xl text-gray-300 mb-3"></i>
          <p className="text-sm text-gray-500">No upcoming consultations</p>
          <p className="text-xs text-gray-400 mt-1">
            Booked consultations will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation, index) => (
            <motion.div
              key={consultation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                consultation.status === "pending"
                  ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                  : "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200"
              }`}
            >
              <div className="flex items-start gap-4">
                {consultation.client_photo ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100">
                    <img
                      src={consultation.client_photo}
                      alt={consultation.client_name || "Client"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-teal-100">
                    {getInitials(consultation.client_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {consultation.client_name || "Farmer"}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {consultation.client_farm || ""}
                      </p>
                    </div>
                    {consultation.status === "pending" ? (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                        Pending
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-teal-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                        Confirmed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {consultation.topic || "General Consultation"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      <span>
                        {formatDate(consultation.date)}, {formatTime(consultation.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/expert-consultations"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    consultation.status === "accepted"
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {consultation.status === "accepted" ? "Join Now" : "View"}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
