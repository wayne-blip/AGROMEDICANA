import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";
import { get, put } from "../api/api";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAYS.map((d) => [
    d,
    { enabled: d !== "saturday" && d !== "sunday", start: "09:00", end: "17:00", slot_duration: 60 },
  ]),
);

/* ── Toast ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const styles = {
    success: "bg-green-50 border-green-300 text-green-800",
    error: "bg-red-50 border-red-300 text-red-800",
  };
  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg border shadow-lg animate-slide-in ${styles[type] || styles.success}`}
    >
      <i className={type === "error" ? "ri-close-circle-line text-xl" : "ri-check-double-line text-xl"}></i>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer">
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}

export default function ExpertAvailability() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  /* Load saved schedule from backend */
  const loadSchedule = useCallback(async () => {
    try {
      const res = await get("/api/v1/availability");
      if (res && res.schedule) {
        setAvailability((prev) => {
          const merged = { ...prev };
          for (const day of DAYS) {
            if (res.schedule[day]) {
              merged[day] = {
                enabled: res.schedule[day].enabled ?? prev[day].enabled,
                start: res.schedule[day].start || prev[day].start,
                end: res.schedule[day].end || prev[day].end,
                slot_duration: res.schedule[day].slot_duration || 60,
              };
            }
          }
          return merged;
        });
      }
    } catch (e) {
      console.error("Failed to load availability:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  /* Save schedule */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await put("/api/v1/availability", { schedule: availability });
      if (res && !res.error) {
        showToast("Schedule saved successfully!");
      } else {
        showToast(res?.error || "Failed to save schedule.", "error");
      }
    } catch (e) {
      console.error("Error saving schedule:", e);
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], enabled: !availability[day].enabled },
    });
  };

  const updateTime = (day, field, value) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], [field]: value },
    });
  };

  const updateSlotDuration = (day, value) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], slot_duration: parseInt(value, 10) || 60 },
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
                Availability Settings
              </h1>
              <p className="text-sm text-gray-600">
                Manage your working hours — farmers will see these available
                slots when booking.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Schedule */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Weekly Schedule
                    </h2>
                    <div className="space-y-4">
                      {DAYS.map((day) => {
                        const schedule = availability[day];
                        return (
                          <div
                            key={day}
                            className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3 w-36">
                              <input
                                type="checkbox"
                                checked={schedule.enabled}
                                onChange={() => toggleDay(day)}
                                className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer"
                              />
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {day}
                              </span>
                            </div>
                            {schedule.enabled ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <input
                                  type="time"
                                  value={schedule.start}
                                  onChange={(e) =>
                                    updateTime(day, "start", e.target.value)
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={schedule.end}
                                  onChange={(e) =>
                                    updateTime(day, "end", e.target.value)
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                <select
                                  value={schedule.slot_duration}
                                  onChange={(e) =>
                                    updateSlotDuration(day, e.target.value)
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                  <option value={30}>30 min slots</option>
                                  <option value={45}>45 min slots</option>
                                  <option value={60}>60 min slots</option>
                                  <option value={90}>90 min slots</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Unavailable
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="mt-6 w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving…
                        </span>
                      ) : (
                        "Save Schedule"
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Settings */}
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                      Current Status
                    </h2>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">
                          Available Now
                        </span>
                      </div>
                      <p className="text-xs text-green-600">
                        Accepting new consultations
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                      How It Works
                    </h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <i className="ri-checkbox-circle-line text-teal-600 mt-0.5"></i>
                        Set which days and hours you're available.
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="ri-checkbox-circle-line text-teal-600 mt-0.5"></i>
                        Choose your slot duration (30–90 min).
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="ri-checkbox-circle-line text-teal-600 mt-0.5"></i>
                        Farmers will only see available slots when booking.
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="ri-checkbox-circle-line text-teal-600 mt-0.5"></i>
                        Already-booked slots are hidden automatically.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}