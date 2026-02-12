import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../api/api";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import { motion } from "framer-motion";

export default function Experts() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [experts, setExperts] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [loadingExperts, setLoadingExperts] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }

    // Fetch real experts from backend
    const fetchExperts = async () => {
      try {
        const res = await get("/api/v1/experts");
        if (res && res.experts) {
          setExperts(res.experts);
        }
      } catch (err) {
        console.error("Error fetching experts:", err);
      } finally {
        setLoadingExperts(false);
      }
    };
    fetchExperts();
  }, [navigate]);

  // Build specialties list dynamically from fetched experts
  const specialtySet = new Set(experts.map((e) => e.specialty).filter(Boolean));
  const specialties = [
    { value: "all", label: "All Specialties" },
    ...[...specialtySet].map((s) => ({ value: s, label: s })),
  ];

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "all" ||
      expert.specialty?.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  async function onBook(expert) {
    if (!user) {
      setBookingError("Please login to book a consultation");
      return;
    }

    const res = await post("/api/v1/consultations", {
      client_id: user.id,
      expert_id: expert.id,
      expert_name: expert.name,
      expert_specialty: expert.specialty,
      expert_photo: expert.photo,
      topic: `${expert.specialty} consultation`,
    });

    if (res.error) {
      setBookingError("Booking failed: " + res.error);
    } else {
      setBookingSuccess(true);
      setShowBookingModal(false);
      setTimeout(() => setBookingSuccess(false), 3000);
    }
  }

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
        />

        <main className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Success Toast */}
            {bookingSuccess && (
              <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                <i className="ri-check-line text-xl"></i>
                <span>Consultation request sent successfully!</span>
              </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Find Experts
                </h1>
                <p className="mt-2 text-gray-600">
                  Connect with verified agricultural specialists
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search experts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
                  />
                </div>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {specialties.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingExperts ? (
                <div className="col-span-full text-center py-12">
                  <i className="ri-loader-4-line text-5xl text-gray-300 mb-4 animate-spin"></i>
                  <p className="text-gray-500">Loading experts...</p>
                </div>
              ) : filteredExperts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <i className="ri-user-search-line text-5xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">
                    No experts found matching your criteria
                  </p>
                </div>
              ) : (
                filteredExperts.map((expert, index) => (
                  <motion.div
                    key={expert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all flex flex-col"
                  >
                    {/* Expert Header */}
                    <div className="flex items-start gap-4 mb-6">
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
                        <p className="text-sm text-teal-600 font-medium">
                          {expert.specialty}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {expert.focus}
                        </p>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="border-t border-gray-100 py-3">
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {expert.experience}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="border-t border-gray-100 py-3">
                      <p className="text-xs text-gray-500">Rating</p>
                      <div className="flex items-center gap-1">
                        <i className="ri-star-fill text-amber-400"></i>
                        <span className="text-sm font-semibold text-gray-900">
                          {expert.rating}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({expert.reviews})
                        </span>
                      </div>
                    </div>

                    {/* Price & Availability */}
                    <div className="border-t border-gray-100 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">
                          Consultation Fee
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            From $20
                          </span>
                          <span className="text-xs text-gray-500">
                            per session
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          expert.available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {expert.available ? "Available" : "Busy"}
                      </span>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => {
                        if (expert.available) {
                          setSelectedExpert(expert);
                          setShowBookingModal(true);
                        }
                      }}
                      disabled={!expert.available}
                      className={`w-full py-3 font-medium rounded-lg transition-colors mt-4 ${
                        expert.available
                          ? "bg-teal-600 text-white hover:bg-teal-700"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {expert.available
                        ? "Book Consultation"
                        : "Currently Unavailable"}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && selectedExpert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Confirm Booking
              </h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingError("");
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-teal-100">
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
                  {selectedExpert.specialty}
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="ri-information-line text-amber-600 mt-0.5"></i>
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Communication Policy</p>
                  <p>
                    All consultations are conducted via our secure in-app
                    messaging. Phone/video calls are not available.
                  </p>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {bookingError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingError("");
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onBook(selectedExpert)}
                className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
