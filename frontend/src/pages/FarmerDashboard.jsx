import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api/api";
import {
  Sidebar,
  Header,
  StatsCard,
  WeatherWidget,
  ActivityFeed,
  QuickActions,
} from "../components/dashboard";
import ChatPage from "../components/ChatPage";

export default function FarmerDashboard({
  data,
  user,
  onUpdate,
  unreadCounts,
  onUnreadUpdate,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    get("/api/v1/my-payments").then((res) => {
      if (res && !res.error) setTotalSpent(res.total_spent || 0);
    }).catch(() => {});
  }, []);

  const activeConsultations = (data.upcoming_consultations || []).filter(
    (c) => c.status === "accepted",
  ).length;
  const pendingConsultations = (data.upcoming_consultations || []).filter(
    (c) => c.status === "pending",
  ).length;
  const completedConsultations = (data.upcoming_consultations || []).filter(
    (c) => c.status === "completed",
  ).length;
  const totalConsultations = (data.upcoming_consultations || []).length;

  const farmerStats = [
    {
      title: "Active Consultations",
      value: String(activeConsultations),
      icon: "ri-chat-3-line",
      color: "bg-emerald-500",
      trend: `${pendingConsultations} pending`,
    },
    {
      title: "Total Consultations",
      value: String(totalConsultations),
      icon: "ri-calendar-check-line",
      color: "bg-teal-500",
      trend: `${completedConsultations} completed`,
    },
    {
      title: "Experts Consulted",
      value: String(new Set((data.upcoming_consultations || []).map(c => c.expert_id).filter(Boolean)).size),
      icon: "ri-user-star-line",
      color: "bg-cyan-500",
      trend: "Unique experts",
    },
    {
      title: "Total Spent",
      value: `$${totalSpent.toFixed(0)}`,
      icon: "ri-money-dollar-circle-line",
      color: "bg-green-500",
      trend: "On consultations",
    },
  ];

  // Expert photo from consultation record
  const getExpertPhoto = (consultation) => {
    return consultation.expert_photo || null;
  };

  const handleOpenMessaging = () => {
    setShowChat(true);
    setTimeout(() => onUnreadUpdate && onUnreadUpdate(), 1000);
  };

  const acceptedConsultations = (data.upcoming_consultations || []).filter(
    (c) => c.status === "accepted",
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role || "farmer"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userRole={user?.role || "farmer"}
          user={user}
          unreadCounts={unreadCounts}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Welcome Section */}
            <div
              className="mb-6"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Welcome back, {user?.full_name || user?.username || "Farmer"}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Here's what's happening with your farm today
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {farmerStats.map((stat, index) => (
                <div
                  key={index}
                >
                  <StatsCard {...stat} />
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Farm Overview - 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Farm Overview
                    </h2>
                    <Link
                      to="/farm-profile"
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap"
                    >
                      View Details →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Completed
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {completedConsultations}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <i className="ri-check-double-line text-2xl text-white"></i>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Pending
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {pendingConsultations}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <i className="ri-time-line text-2xl text-white"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Farm Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Farm Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <i className="ri-home-3-line text-xl text-teal-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Farm</p>
                          <p className="text-sm font-bold text-gray-900">
                            {user?.farm_name || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <i className="ri-map-pin-line text-xl text-emerald-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-bold text-gray-900">
                            {user?.location || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <i className="ri-seedling-line text-xl text-green-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Crops</p>
                          <p className="text-sm font-bold text-gray-900">
                            {user?.primary_crops || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Widget - 1 column */}
              <div className="space-y-6">
                <WeatherWidget />
              </div>
            </div>

            {/* Quick Actions - Full width horizontal */}
            <div className="mb-8">
              <QuickActions userRole={user?.role} horizontal={true} />
            </div>

            {/* Activity & Consultations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed />

              {/* Upcoming Consultations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Upcoming Consultations
                </h2>
                <div className="space-y-4">
                  {(data.upcoming_consultations || [])
                    .filter(
                      (c) => c.status === "accepted" || c.status === "pending",
                    )
                    .slice(0, 3)
                    .map((consultation) => {
                      const unreadCount =
                        unreadCounts?.by_consultation?.[consultation.id] || 0;
                      return (
                        <div
                          key={consultation.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border ${
                            consultation.status === "accepted"
                              ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                            {getExpertPhoto(consultation) ? (
                              <img
                                src={getExpertPhoto(consultation)}
                                alt={consultation.expert_name || "Expert"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                {(consultation.expert_name || "E").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {consultation.expert_name || "Expert"}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {consultation.expert_specialty || "Agricultural Expert"}
                            </p>
                            <p className="text-xs text-teal-600 mt-0.5">
                              {consultation.topic || "Consultation"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <i className="ri-calendar-line text-sm text-gray-500"></i>
                              <span className="text-sm text-gray-700">
                                {consultation.status === "pending"
                                  ? "Awaiting approval"
                                  : "Accepted"}
                              </span>
                            </div>
                          </div>
                          {consultation.status === "accepted" ? (
                            <button
                              onClick={() => handleOpenMessaging()}
                              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                            >
                              Message
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}

                  {(!data.upcoming_consultations ||
                    data.upcoming_consultations.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <i className="ri-calendar-line text-4xl mb-2"></i>
                      <p>No consultations scheduled</p>
                      <Link
                        to="/experts"
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        Book a consultation →
                      </Link>
                    </div>
                  )}

                  {(data.upcoming_consultations || []).length > 0 && (
                    <Link
                      to="/experts"
                      className="block w-full py-3 text-center text-teal-600 hover:text-teal-700 font-medium text-sm border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition-colors whitespace-nowrap"
                    >
                      View All Consultations
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chat Page */}
      {showChat && acceptedConsultations.length > 0 && (
        <div className="fixed inset-0 z-50 bg-white">
          <ChatPage
            consultations={acceptedConsultations}
            user={user}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}
