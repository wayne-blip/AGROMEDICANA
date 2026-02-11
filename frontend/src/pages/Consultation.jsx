import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import ChatPage from "../components/ChatPage";
import { get, post, put, del } from "../api/api";


/* ─── Professional Toast ─── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const styles = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
  };
  const icons = { success: "ri-check-double-line", error: "ri-close-circle-line", info: "ri-information-line", warning: "ri-alert-line" };
  return (
    <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-xl backdrop-blur-sm animate-slide-in max-w-md ${styles[type] || styles.info}`}>
      <i className={`${icons[type] || icons.info} text-xl flex-shrink-0`}></i>
      <span className="text-sm font-medium leading-snug">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer flex-shrink-0"><i className="ri-close-line text-lg"></i></button>
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
            confirmColor === "red" ? "text-red-600 hover:bg-red-50" : "text-amber-600 hover:bg-amber-50"
          }`}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Consultation() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState({ type: "", text: "" });
  const [consultations, setConsultations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
  });
  const [chatConsultation, setChatConsultation] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paidMap, setPaidMap] = useState({}); // consultation_id -> true/false
  const [showChatPage, setShowChatPage] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  // Booking form state
  const [bookingData, setBookingData] = useState({
    expert: "",
    date: "",
    time: "",
    type: "chat",
    description: "",
  });
  const [bookingErrors, setBookingErrors] = useState({});
  const [availableExperts, setAvailableExperts] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);     // available slots from API
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState(""); // e.g. "Expert not available on Monday"
  const [bookingDuration, setBookingDuration] = useState(60); // 30, 60, or 90 min

  const DURATION_OPTIONS = [
    { minutes: 30, label: "30 min", price: "$20", amount: 20 },
    { minutes: 60, label: "60 min", price: "$35", amount: 35 },
    { minutes: 90, label: "90 min", price: "$50", amount: 50 },
  ];

  // Get the fee for the currently selected duration
  const selectedDurationOption = DURATION_OPTIONS.find(opt => opt.minutes === bookingDuration) || DURATION_OPTIONS[1];
  const consultationFee = selectedDurationOption.amount;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }

    // Fetch unread counts
    const fetchUnreadCounts = async () => {
      try {
        const res = await get("/api/v1/unread-counts");
        if (res && !res.error) {
          setUnreadCounts(res);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };
    fetchUnreadCounts();

    // Fetch user consultations
    const fetchConsultations = async () => {
      try {
        const res = await get("/api/v1/consultations");
        if (res && !res.error && res.consultations) {
          setConsultations(res.consultations);
          // Check payment status for accepted consultations
          const accepted = res.consultations.filter(c => c.status === "accepted");
          const map = {};
          for (const c of accepted) {
            try {
              const pr = await get(`/api/v1/payments/consultation/${c.id}`);
              if (pr?.paid) map[c.id] = true;
            } catch (e) { /* silent */ }
          }
          setPaidMap(prev => ({ ...prev, ...map }));
        }
      } catch (error) {
        console.error("Error fetching consultations:", error);
      }
    };
    fetchConsultations();

    // Fetch real experts from backend
    const fetchExperts = async () => {
      try {
        const res = await get("/api/v1/experts");
        if (res && res.experts) {
          setAvailableExperts(res.experts);
        }
      } catch (error) {
        console.error("Error fetching experts:", error);
      }
    };
    fetchExperts();
  }, [navigate]);

  /* Fetch expert's available time slots when expert + date + duration are selected */
  useEffect(() => {
    if (!selectedExpert || !bookingData.date) {
      setTimeSlots([]);
      setSlotsMessage("");
      return;
    }
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSlotsMessage("");
      setTimeSlots([]);
      // Clear any previously selected time since slots changed
      setBookingData((prev) => ({ ...prev, time: "" }));
      try {
        const res = await get(
          `/api/v1/availability/${selectedExpert.id}?date=${bookingData.date}&duration=${bookingDuration}`,
        );
        if (res && res.slots) {
          if (res.slots.length === 0) {
            setSlotsMessage(
              res.message || "No available slots on this day.",
            );
          } else {
            setTimeSlots(res.slots);
          }
        } else if (res && res.schedule) {
          // Expert hasn't set availability yet — fallback
          setSlotsMessage(
            "This expert hasn't set specific availability. Please pick any time.",
          );
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setSlotsMessage("Could not load available times.");
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedExpert, bookingData.date, bookingDuration]);

  // Get expert photo from the consultation record itself
  const getExpertPhoto = (consultation) => {
    return consultation.expert_photo || '';
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (bookingErrors[name]) {
      setBookingErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (bookingMessage.text) {
      setBookingMessage({ type: "", text: "" });
    }
  };

  const validateBooking = () => {
    const errors = {};
    if (!selectedExpert) {
      errors.expert = "Please select an expert";
    }
    if (!bookingData.date) {
      errors.date = "Please select a date";
    }
    if (!bookingData.time) {
      errors.time = "Please select a time";
    }
    if (!bookingData.description || bookingData.description.trim() === "") {
      errors.description = "Please describe your issue or topic";
    }
    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async () => {
    if (!validateBooking()) {
      setBookingMessage({
        type: "error",
        text: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    setBookingMessage({ type: "", text: "" });

    try {
      const dateTime = `${bookingData.date} ${bookingData.time}`;
      const res = await post("/api/v1/consultations", {
        expert_id: selectedExpert.id,
        expert_name: selectedExpert.name,
        expert_specialty: selectedExpert.specialty,
        date: dateTime,
        duration: bookingDuration,
        topic: bookingData.description,
        type: bookingData.type,
      });

      if (res.error) {
        setBookingMessage({ type: "error", text: res.error });
      } else {
        // Add the new consultation to the list
        if (res.consultation) {
          setConsultations((prev) => [res.consultation, ...prev]);
        }
        setBookingMessage({
          type: "success",
          text: "Consultation booked successfully!",
        });

        // Reset and close modal after a short delay
        setTimeout(() => {
          setShowBookingModal(false);
          setSelectedExpert(null);
          setBookingData({
            expert: "",
            date: "",
            time: "",
            type: "chat",
            description: "",
          });
          setBookingMessage({ type: "", text: "" });
        }, 1500);
      }
    } catch (error) {
      console.error("Error booking consultation:", error);
      setBookingMessage({
        type: "error",
        text: "Failed to book consultation. Please try again.",
      });
    }
    setLoading(false);
  };

  const handleCancelConsultation = async (consultationId) => {
    const c = consultations.find(x => x.id === consultationId);
    setConfirmDialog({
      title: "Cancel Consultation",
      message: `Are you sure you want to cancel the consultation with ${c?.expert_name || "this expert"}?`,
      confirmLabel: "Yes, Cancel",
      confirmColor: "red",
      icon: "ri-close-circle-line",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await del(`/api/v1/consultations/${consultationId}`);
          if (res.error) {
            showToast(res.error, "error");
          } else {
            setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
            showToast("Consultation cancelled successfully.", "success");
          }
        } catch (error) {
          console.error("Error cancelling consultation:", error);
          showToast("Failed to cancel consultation. Please try again.", "error");
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // Format consultation data for display
  const formatConsultationDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatConsultationTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeRemaining = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = date - now;
    if (diff <= 0) return "Now";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const remainMin = minutes % 60;
      return remainMin > 0 ? `${hours}h ${remainMin}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
  };

  /**
   * Check if current time is within the consultation's scheduled window.
   * Returns { canChat, label } — label is what to show on the button.
   * Window: from 15 min before start time → end of duration.
   */
  const getChatAvailability = (consultation) => {
    const now = new Date();
    const start = new Date(consultation.date);
    const dur = consultation.duration || 60;
    const earlyAccess = 15; // minutes before start
    const windowStart = new Date(start.getTime() - earlyAccess * 60000);
    const windowEnd = new Date(start.getTime() + dur * 60000);

    if (now < windowStart) {
      // Not yet — show countdown
      const diff = windowStart - now;
      const mins = Math.ceil(diff / 60000);
      if (mins >= 1440) return { canChat: false, label: `Chat opens in ${Math.floor(mins / 1440)}d` };
      if (mins >= 60) return { canChat: false, label: `Chat opens in ${Math.floor(mins / 60)}h ${mins % 60}m` };
      return { canChat: false, label: `Chat opens in ${mins}m` };
    }
    if (now > windowEnd) {
      return { canChat: true, label: "Chat (Session ended)" };
    }
    return { canChat: true, label: "Start Chat" };
  };

  // Filter consultations by status
  const upcomingConsultations = consultations.filter(
    (c) => c.status === "pending" || c.status === "accepted",
  );
  const pastConsultations = consultations.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "rejected" ||
      c.status === "cancelled",
  );

  const userRole = user?.role === "Expert" ? "Expert" : "Farmer";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userRole={userRole}
          user={user}
          unreadCounts={unreadCounts}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Consultations
                </h1>
                <p className="mt-2 text-gray-600">
                  Connect with agricultural experts for personalized advice
                </p>
              </div>
              <div
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line text-xl"></i>
                Book Consultation
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="border-b border-gray-200">
                <div className="flex gap-1 p-1">
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "upcoming"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Upcoming ({upcomingConsultations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("past")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "past"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Past ({pastConsultations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "requests"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Find Experts
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === "upcoming" && (
                  <div className="space-y-4">
                    {upcomingConsultations.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="ri-calendar-line text-5xl text-gray-300 mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Upcoming Consultations
                        </h3>
                        <p className="text-gray-600 mb-4">
                          You don't have any scheduled consultations yet.
                        </p>
                        <button
                          onClick={() => setActiveTab("requests")}
                          className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          Find an Expert
                        </button>
                      </div>
                    ) : (
                      upcomingConsultations.map((consultation, index) => (
                        <div
                          key={consultation.id}
                          className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100">
                            {getExpertPhoto(consultation) ? (
                              <img
                                src={getExpertPhoto(consultation)}
                                alt={consultation.expert_name || "Expert"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                {consultation.expert_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EX"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {consultation.expert_name || "Expert"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {consultation.expert_specialty ||
                                    "Agricultural Expert"}
                                </p>
                                <p className="text-sm text-teal-600 mt-1">
                                  {consultation.topic || "Consultation"}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                  consultation.status === "accepted"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {consultation.status === "accepted"
                                  ? "Confirmed"
                                  : "Pending"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <i className="ri-calendar-line"></i>
                                <span>
                                  {formatConsultationDate(consultation.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="ri-time-line"></i>
                                <span>
                                  {formatConsultationTime(consultation.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="ri-timer-line"></i>
                                <span>{getTimeRemaining(consultation.date)}</span>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              {consultation.status === "accepted" && !paidMap[consultation.id] && (
                                <button
                                  onClick={() => setShowPaymentModal(consultation)}
                                  className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap flex items-center gap-1.5"
                                >
                                  <i className="ri-bank-card-line"></i>
                                  Pay Now
                                </button>
                              )}
                              {consultation.status === "accepted" && paidMap[consultation.id] && (() => {
                                const { canChat, label } = getChatAvailability(consultation);
                                return canChat ? (
                                  <button
                                    onClick={() => setShowChatPage(true)}
                                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-1.5"
                                  >
                                    <i className="ri-chat-3-line"></i>
                                    {label}
                                  </button>
                                ) : (
                                  <span className="px-4 py-2 bg-gray-50 text-gray-500 text-sm rounded-lg border border-gray-200 flex items-center gap-1.5">
                                    <i className="ri-time-line"></i>
                                    {label}
                                  </span>
                                );
                              })()}
                              {consultation.status === "accepted" && !paidMap[consultation.id] && (
                                <span className="px-4 py-2 bg-gray-50 text-gray-500 text-xs rounded-lg border border-gray-200 flex items-center gap-1.5">
                                  <i className="ri-lock-line"></i>
                                  Pay to chat
                                </span>
                              )}
                              {consultation.status === "pending" && (
                                <span className="px-4 py-2 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-lg border border-yellow-200 flex items-center gap-1.5">
                                  <i className="ri-hourglass-line"></i>
                                  Awaiting Expert
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  handleCancelConsultation(consultation.id)
                                }
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "past" && (
                  <div className="space-y-4">
                    {pastConsultations.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="ri-history-line text-5xl text-gray-300 mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Past Consultations
                        </h3>
                        <p className="text-gray-600">
                          Your completed consultations will appear here.
                        </p>
                      </div>
                    ) : (
                      pastConsultations.map((consultation, index) => (
                        <div
                          key={consultation.id}
                          className="flex items-start gap-4 p-5 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100">
                            {getExpertPhoto(consultation) ? (
                              <img
                                src={getExpertPhoto(consultation)}
                                alt={consultation.expert_name || "Expert"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                {consultation.expert_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EX"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {consultation.expert_name || "Expert"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {consultation.expert_specialty ||
                                    "Agricultural Expert"}
                                </p>
                                <p className="text-sm text-teal-600 mt-1">
                                  {consultation.topic || "Consultation"}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                  consultation.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : consultation.status === "cancelled"
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {consultation.status === "completed"
                                  ? "Completed"
                                  : consultation.status === "cancelled"
                                    ? "Cancelled"
                                    : "Rejected"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <i className="ri-calendar-line"></i>
                                <span>
                                  {formatConsultationDate(consultation.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="ri-time-line"></i>
                                <span>
                                  {formatConsultationTime(consultation.date)}
                                </span>
                              </div>
                            </div>
                            {consultation.status === "completed" && (
                              <div className="flex gap-3">
                                <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
                                  <i className="ri-file-text-line mr-2"></i>
                                  View Report
                                </button>
                                <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                                  Book Again
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "requests" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {availableExperts.map((expert, index) => (
                      <div
                        key={expert.id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col h-full"
                      >
                        {/* Expert Info - Fixed Height */}
                        <div className="flex items-start gap-4 mb-4 h-20">
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-100">
                            {expert.photo ? (
                              <img
                                src={expert.photo}
                                alt={expert.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                {expert.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EX"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {expert.name}
                            </h3>
                            <p className="text-sm text-teal-600 font-medium truncate">
                              {expert.specialty}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {expert.focus}
                            </p>
                          </div>
                        </div>

                        {/* Experience & Rating - Always Aligned */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-center h-16">
                            <p className="text-xs text-gray-600 mb-1">
                              Experience
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {expert.experience}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-center h-16">
                            <p className="text-xs text-gray-600 mb-1">Rating</p>
                            <div className="flex items-center gap-1">
                              <i className="ri-star-fill text-yellow-400"></i>
                              <span className="text-sm font-semibold text-gray-900">
                                {expert.rating}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({expert.reviews})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price Section - Always Aligned */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg h-16">
                          <div>
                            <p className="text-sm text-gray-600">
                              Consultation Fee
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">
                                From $20
                              </span>
                              <span className="text-xs text-gray-500">
                                per session
                              </span>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              expert.available
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {expert.available ? "Available" : "Busy"}
                          </div>
                        </div>

                        {/* Button - Always at Bottom */}
                        <button
                          onClick={() => {
                            setSelectedExpert(expert);
                            setBookingData((prev) => ({
                              ...prev,
                              expert: expert.name,
                            }));
                            setBookingErrors({});
                            setBookingMessage({ type: "", text: "" });
                            setShowBookingModal(true);
                          }}
                          disabled={!expert.available}
                          className={`w-full py-3 font-medium rounded-lg transition-colors whitespace-nowrap mt-auto ${
                            expert.available
                              ? "bg-teal-600 text-white hover:bg-teal-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {expert.available
                            ? "Book Consultation"
                            : "Currently Unavailable"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Book Consultation
              </h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedExpert(null);
                  setBookingErrors({});
                  setBookingMessage({ type: "", text: "" });
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Booking Message */}
              {bookingMessage.text && (
                <div
                  className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    bookingMessage.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <i
                    className={
                      bookingMessage.type === "success"
                        ? "ri-check-line"
                        : "ri-error-warning-line"
                    }
                  ></i>
                  {bookingMessage.text}
                </div>
              )}

              {/* Selected Expert Display */}
              {selectedExpert && (
                <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-teal-300">
                      {selectedExpert.photo ? (
                        <img
                          src={selectedExpert.photo}
                          alt={selectedExpert.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
                          {selectedExpert.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EX"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {selectedExpert.name}
                      </h3>
                      <p className="text-sm text-teal-600">
                        {selectedExpert.specialty} - {selectedExpert.focus}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <i className="ri-star-fill text-yellow-400 text-sm"></i>
                        <span className="text-sm text-gray-600">
                          {selectedExpert.rating} ({selectedExpert.reviews}{" "}
                          reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration / Timeframe picker */}
                  <div className="mt-4 pt-4 border-t border-teal-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Select Consultation Duration <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {DURATION_OPTIONS.map((opt) => {
                        const isActive = bookingDuration === opt.minutes;
                        return (
                          <button
                            key={opt.minutes}
                            type="button"
                            onClick={() => setBookingDuration(opt.minutes)}
                            className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                              isActive
                                ? "border-teal-600 bg-teal-50 shadow-sm"
                                : "border-gray-200 bg-white hover:border-teal-300"
                            }`}
                          >
                            <i className={`ri-time-line text-lg mb-1 ${isActive ? "text-teal-600" : "text-gray-400"}`}></i>
                            <span className={`text-sm font-semibold ${isActive ? "text-teal-700" : "text-gray-800"}`}>
                              {opt.label}
                            </span>
                            <span className={`text-base font-bold mt-1 ${isActive ? "text-teal-600" : "text-gray-600"}`}>
                              {opt.price}
                            </span>
                            {isActive && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                                <i className="ri-check-line text-white text-xs"></i>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      bookingErrors.date ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {bookingErrors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>
                      {bookingErrors.date}
                    </p>
                  )}
                </div>

                {/* Time slot picker — shown after expert + date are selected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>

                  {/* If no expert or date selected yet, show hint */}
                  {!selectedExpert || !bookingData.date ? (
                    <div className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-400 text-center">
                      Select an expert & date first
                    </div>
                  ) : slotsLoading ? (
                    <div className="flex items-center justify-center py-3">
                      <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading slots…</span>
                    </div>
                  ) : slotsMessage && timeSlots.length === 0 ? (
                    /* Expert not available / no slots */
                    <div className="space-y-2">
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <i className="ri-information-line mr-1"></i>
                        {slotsMessage}
                      </p>
                      {/* Fallback free time input */}
                      <input
                        type="time"
                        name="time"
                        value={bookingData.time}
                        onChange={handleBookingChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          bookingErrors.time ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                  ) : timeSlots.length > 0 ? (
                    /* Clickable time slot buttons */
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                      {timeSlots.map((slot) => {
                        const isBooked = slot.booked;
                        const isPast = slot.past;
                        const isDisabled = isBooked || isPast;
                        const isSelected = bookingData.time === slot.start;
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setBookingData((prev) => ({ ...prev, time: slot.start }));
                              if (bookingErrors.time) setBookingErrors((prev) => ({ ...prev, time: null }));
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isDisabled
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                                : isSelected
                                  ? "bg-teal-600 text-white ring-2 ring-teal-300 cursor-pointer"
                                  : "bg-white border border-gray-300 text-gray-700 hover:border-teal-400 hover:text-teal-700 cursor-pointer"
                            }`}
                            title={isPast ? "Time has passed" : isBooked ? "Already booked" : `${slot.start} – ${slot.end}`}
                          >
                            {slot.start}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* No slots data at all — fallback */
                    <input
                      type="time"
                      name="time"
                      value={bookingData.time}
                      onChange={handleBookingChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        bookingErrors.time ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}

                  {bookingErrors.time && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>
                      {bookingErrors.time}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Type
                </label>
                <div className="p-4 bg-teal-50 border-2 border-teal-500 rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className="ri-chat-3-line text-2xl text-teal-600"></i>
                    <div>
                      <p className="font-medium text-teal-700">
                        Secure In-App Chat
                      </p>
                      <p className="text-sm text-teal-600">
                        All consultations are conducted via our secure messaging
                        platform
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <i className="ri-shield-check-line text-amber-600 mt-0.5"></i>
                    <div className="text-xs text-amber-700">
                      <p className="font-medium">Communication Policy</p>
                      <p>
                        For your protection, all communication must happen
                        through AgroMedicana. Sharing phone numbers, emails, or
                        social media handles is not permitted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  maxLength={500}
                  value={bookingData.description}
                  onChange={handleBookingChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                    bookingErrors.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Please provide details about your farm issue or question..."
                ></textarea>
                <div className="flex justify-between mt-1">
                  {bookingErrors.description ? (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>
                      {bookingErrors.description}
                    </p>
                  ) : (
                    <span></span>
                  )}
                  <p className="text-xs text-gray-500">
                    {bookingData.description.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">
                    Estimated Fee ({selectedDurationOption.label})
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${consultationFee.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <i className="ri-information-line text-blue-500 mt-0.5 flex-shrink-0"></i>
                  <p className="text-xs text-blue-700">
                    Payment will be collected after the expert accepts your request. You'll be notified and can pay securely from your consultation card.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedExpert(null);
                    setBookingErrors({});
                    setBookingMessage({ type: "", text: "" });
                  }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <i className="ri-loader-4-line animate-spin"></i>}
                  {loading ? "Sending..." : "Request Consultation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-600 flex items-center justify-center text-white font-bold ring-2 ring-teal-100">
                  {showPaymentModal.expert_photo ? (
                    <img src={showPaymentModal.expert_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (showPaymentModal.expert_name || "EX").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{showPaymentModal.expert_name}</h3>
                  <p className="text-sm text-gray-500">{showPaymentModal.expert_specialty}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Consultation Fee</span>
                  <span className="text-xl font-bold text-teal-700">${consultationFee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">Secure payment processed by AgroMedicana</p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={async () => {
                    setPaymentProcessing(true);
                    try {
                      const res = await post("/api/v1/payments", {
                        consultation_id: showPaymentModal.id,
                        amount: consultationFee,
                      });
                      if (res?.status === "ok") {
                        setPaidMap(prev => ({ ...prev, [showPaymentModal.id]: true }));
                        setShowPaymentModal(null);
                        showToast("Payment successful! You can now start chatting with your expert.", "success");
                      } else {
                        showToast(res?.error || "Payment failed. Please try again.", "error");
                      }
                    } catch (err) {
                      console.error(err);
                      showToast("Payment failed. Please try again.", "error");
                    }
                    setPaymentProcessing(false);
                  }}
                  disabled={paymentProcessing}
                  className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {paymentProcessing ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Processing…
                    </>
                  ) : (
                    <>
                      <i className="ri-bank-card-line"></i>
                      Pay ${consultationFee.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-center text-gray-400">
                <i className="ri-lock-line mr-1"></i>
                Payments are secure and encrypted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Confirm Dialog ── */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}

      {/* ── Chat Page (WhatsApp style) ── */}
      {showChatPage && (
        <ChatPage
          consultations={consultations.filter(c => c.status === "accepted" && paidMap[c.id])}
          user={user}
          onClose={() => setShowChatPage(false)}
        />
      )}
    </div>
  );
}
