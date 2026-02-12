import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";
import ChatPage from "../components/ChatPage";
import { get, put } from "../api/api";

/* ── Live countdown component ── */
function Countdown({ targetDate }) {
  const computeDiff = useCallback(() => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, total: diff };
  }, [targetDate]);

  const [remaining, setRemaining] = useState(computeDiff);

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeDiff()), 1000);
    return () => clearInterval(id);
  }, [computeDiff]);

  if (!remaining) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
        <i className="ri-alarm-warning-line"></i> Time passed
      </span>
    );
  }

  const urgent = remaining.total < 3600000; // less than 1 hour
  const soon = remaining.total < 86400000;  // less than 1 day
  const color = urgent
    ? "bg-red-100 text-red-700"
    : soon
      ? "bg-orange-100 text-orange-700"
      : "bg-teal-100 text-teal-700";

  const parts = [];
  if (remaining.d > 0) parts.push(`${remaining.d}d`);
  if (remaining.h > 0) parts.push(`${remaining.h}h`);
  parts.push(`${remaining.m}m`);
  if (remaining.d === 0) parts.push(`${remaining.s}s`);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums ${color}`}
    >
      <i className={`ri-timer-line ${urgent ? "animate-pulse" : ""}`}></i>
      {parts.join(" ")}
    </span>
  );
}

/* ── Toast notification ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-50 border-green-300 text-green-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  const icons = {
    success: "ri-check-double-line",
    error: "ri-close-circle-line",
    info: "ri-information-line",
  };

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg border shadow-lg animate-slide-in ${styles[type] || styles.info}`}>
      <i className={`${icons[type] || icons.info} text-xl`}></i>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer">
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}

/* ─── Professional Confirm Dialog ─── */
function ConfirmDialog({ title, message, confirmLabel, confirmColor, icon, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmColor === "red" ? "bg-red-100" : "bg-amber-100"}`}>
            <i className={`${icon || "ri-question-line"} text-2xl ${confirmColor === "red" ? "text-red-600" : "text-amber-600"}`}></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-3.5 text-sm font-bold transition-colors cursor-pointer border-l border-gray-100 ${
            confirmColor === "red" ? "text-red-600 hover:bg-red-50" : "text-teal-600 hover:bg-teal-50"
          }`}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

export default function ExpertConsultations() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await get("/api/v1/consultations");
      if (res && res.consultations) {
        setConsultations(res.consultations);
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    const c = consultations.find((x) => x.id === id);
    try {
      const res = await put(`/api/v1/consultations/${id}`, { status: "accepted" });
      if (res && !res.error) {
        setConsultations((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "accepted" } : x)),
        );
        showToast(
          `Consultation with ${c?.client_name || "farmer"} accepted! They will be notified.`,
          "success",
        );
      } else {
        showToast(res?.error || "Failed to accept consultation.", "error");
      }
    } catch (err) {
      console.error("Error accepting consultation:", err);
      showToast("Network error. Please try again.", "error");
    }
  };

  const handleReject = async (id) => {
    const c = consultations.find((x) => x.id === id);
    setConfirmDialog({
      title: "Reject Consultation",
      message: `Are you sure you want to reject the consultation with ${c?.client_name || "this farmer"}? Topic: ${c?.topic || "General"}`,
      confirmLabel: "Yes, Reject",
      confirmColor: "red",
      icon: "ri-close-circle-line",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await put(`/api/v1/consultations/${id}`, { status: "rejected" });
          if (res && !res.error) {
            setConsultations((prev) =>
              prev.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)),
            );
            showToast(`Consultation with ${c?.client_name || "farmer"} has been rejected.`, "info");
          } else {
            showToast(res?.error || "Failed to reject consultation.", "error");
          }
        } catch (err) {
          console.error("Error rejecting consultation:", err);
          showToast("Network error. Please try again.", "error");
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleComplete = async (id) => {
    const c = consultations.find((x) => x.id === id);
    try {
      const res = await put(`/api/v1/consultations/${id}`, { status: "completed" });
      if (res && !res.error) {
        setConsultations((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "completed" } : x)),
        );
        showToast(
          `Consultation with ${c?.client_name || "farmer"} marked as completed!`,
          "success",
        );
      } else {
        showToast(res?.error || "Failed to complete consultation.", "error");
      }
    } catch (err) {
      console.error("Error completing consultation:", err);
      showToast("Network error. Please try again.", "error");
    }
  };

  // Filter consultations by tab
  const upcoming = consultations.filter(
    (c) => c.status === "pending" || c.status === "accepted",
  );
  const completed = consultations.filter((c) => c.status === "completed");
  const cancelled = consultations.filter(
    (c) => c.status === "rejected" || c.status === "cancelled",
  );

  const tabData = { upcoming, completed, cancelled };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    <div className="flex h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main className="flex-1 overflow-y-auto">
          <motion.div className="px-6 py-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Consultations
              </h1>
              <p className="text-sm text-gray-600">
                Manage your consultation schedule and client meetings
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-calendar-check-line text-xl text-teal-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {consultations.length}
                </h3>
                <p className="text-xs text-gray-500">Total</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-hourglass-line text-xl text-yellow-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {consultations.filter((c) => c.status === "pending").length}
                </h3>
                <p className="text-xs text-gray-500">Pending</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-checkbox-circle-line text-xl text-green-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {completed.length}
                </h3>
                <p className="text-xs text-gray-500">Completed</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-time-line text-xl text-blue-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {upcoming.length}
                </h3>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-4">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === "upcoming"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Upcoming ({upcoming.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === "completed"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Completed ({completed.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("cancelled")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === "cancelled"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Cancelled ({cancelled.length})
                  </button>
                </div>
              </div>

              {/* Consultations List */}
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <i className="ri-loader-4-line animate-spin text-3xl text-teal-600 mr-3"></i>
                    <span className="text-gray-600">
                      Loading consultations...
                    </span>
                  </div>
                ) : tabData[activeTab].length === 0 ? (
                  <div className="text-center py-16">
                    <i className="ri-calendar-line text-5xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {activeTab} consultations
                    </h3>
                    <p className="text-gray-600">
                      {activeTab === "upcoming"
                        ? "When farmers book consultations with you, they will appear here."
                        : activeTab === "completed"
                          ? "Your completed consultations will appear here."
                          : "Cancelled or rejected consultations will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tabData[activeTab].map((consultation, index) => (
                      <motion.div
                        key={consultation.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={`bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border ${
                          consultation.status === "pending"
                            ? "border-yellow-300 bg-yellow-50/30"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Countdown banner for upcoming */}
                        {activeTab === "upcoming" && (
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}
                              >
                                {consultation.status === "pending"
                                  ? "Awaiting Your Response"
                                  : "Accepted"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Starts in:</span>
                              <Countdown targetDate={consultation.date} />
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {/* Client Photo */}
                            {consultation.client_photo ? (
                              <img
                                src={consultation.client_photo}
                                alt={consultation.client_name || "Client"}
                                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {getInitials(consultation.client_name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {consultation.client_name || "Farmer"}
                                </h3>
                                {activeTab !== "upcoming" && (
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}
                                  >
                                    {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                                  </span>
                                )}
                              </div>

                              {/* Farmer info row */}
                              {activeTab === "upcoming" && (
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                                  {consultation.client_location && (
                                    <span className="flex items-center gap-1">
                                      <i className="ri-map-pin-line"></i>
                                      {consultation.client_location}
                                    </span>
                                  )}
                                  {consultation.client_farm && (
                                    <span className="flex items-center gap-1">
                                      <i className="ri-plant-line"></i>
                                      {consultation.client_farm}
                                    </span>
                                  )}
                                  {consultation.client_farm_size && (
                                    <span className="flex items-center gap-1">
                                      <i className="ri-landscape-line"></i>
                                      {consultation.client_farm_size}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Description / Topic — prominent for upcoming */}
                              {activeTab === "upcoming" && consultation.topic ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    <i className="ri-file-text-line mr-1"></i>
                                    Consultation Description
                                  </p>
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {consultation.topic}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-700 font-medium mb-3">
                                  {consultation.topic || "General Consultation"}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <i className="ri-calendar-line"></i>
                                  <span>{formatDate(consultation.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ri-time-line"></i>
                                  <span>{formatTime(consultation.date)}</span>
                                </div>
                                {activeTab !== "upcoming" && consultation.client_location && (
                                  <div className="flex items-center gap-2">
                                    <i className="ri-map-pin-line"></i>
                                    <span>{consultation.client_location}</span>
                                  </div>
                                )}
                                {activeTab !== "upcoming" && consultation.client_farm && (
                                  <div className="flex items-center gap-2">
                                    <i className="ri-plant-line"></i>
                                    <span>{consultation.client_farm}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0 ml-4">
                            {consultation.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setSelectedConsultation(consultation)}
                                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-eye-line mr-1"></i>
                                  View Farmer
                                </button>
                                <button
                                  onClick={() => handleAccept(consultation.id)}
                                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-check-line mr-1"></i>
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(consultation.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {consultation.status === "accepted" && (
                              <>
                                <button
                                  onClick={() => setShowChat(true)}
                                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-chat-3-line mr-1"></i>
                                  Start Chat
                                </button>
                                <button
                                  onClick={() => handleComplete(consultation.id)}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                                >
                                  Mark Done
                                </button>
                              </>
                            )}
                            {activeTab === "completed" && (
                              <button
                                onClick={() => setSelectedConsultation(consultation)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Consultation Details Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Consultation Details
              </h2>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {selectedConsultation.client_photo ? (
                  <img
                    src={selectedConsultation.client_photo}
                    alt={selectedConsultation.client_name || "Client"}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    {getInitials(selectedConsultation.client_name)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedConsultation.client_name || "Farmer"}
                  </h3>
                  <p className="text-gray-600">
                    {selectedConsultation.client_location || ""}
                  </p>
                  {selectedConsultation.client_farm && (
                    <p className="text-sm text-teal-600">
                      {selectedConsultation.client_farm}
                      {selectedConsultation.client_farm_size
                        ? ` · ${selectedConsultation.client_farm_size}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Topic
                  </label>
                  <p className="text-gray-900">
                    {selectedConsultation.topic}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <p className="text-gray-900">
                      {formatDate(selectedConsultation.date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <p className="text-gray-900">
                      {formatTime(selectedConsultation.date)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedConsultation.status,
                      )}`}
                    >
                      {selectedConsultation.status.charAt(0).toUpperCase() +
                        selectedConsultation.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add consultation notes..."
                  ></textarea>
                </div>
                <button className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer">
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Page ── */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-white">
          <ChatPage
            consultations={consultations.filter(c => c.status === "accepted")}
            user={user}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  );
}
