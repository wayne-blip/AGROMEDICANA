import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ExpertSidebar,
  ExpertHeader,
  ExpertStatsCard,
  UpcomingConsultations,
  RecentActivity,
  EarningsChart,
} from "../components/expert";
import { get } from "../api/api";

export default function ExpertDashboard({
  data = {},
  user,
  onUpdate,
  unreadCounts,
  onUnreadUpdate,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, fRes, eRes] = await Promise.all([
          get("/api/v1/consultations"),
          get("/api/v1/farmers"),
          get("/api/v1/earnings"),
        ]);
        if (cRes && cRes.consultations) setConsultations(cRes.consultations);
        if (fRes && fRes.farmers) setFarmers(fRes.farmers);
        if (eRes && !eRes.error) setTotalEarned(eRes.total_earned || 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  const completedCount = consultations.filter((c) => c.status === "completed").length;
  const pendingCount = consultations.filter((c) => c.status === "pending").length;

  const expertStats = [
    {
      title: "Total Consultations",
      value: String(consultations.length),
      icon: "ri-chat-check-line",
      color: "bg-emerald-500",
      trend: `${pendingCount} pending`,
    },
    {
      title: "Registered Farmers",
      value: String(farmers.length),
      icon: "ri-user-follow-line",
      color: "bg-teal-500",
      trend: "",
    },
    {
      title: "Completed",
      value: String(completedCount),
      icon: "ri-checkbox-circle-line",
      color: "bg-green-500",
      trend: "",
    },
    {
      title: "Total Earnings",
      value: `$${totalEarned.toFixed(0)}`,
      icon: "ri-money-dollar-circle-line",
      color: "bg-amber-500",
      trend: "Net payout",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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
                Welcome back, {user?.full_name || "Expert"}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Here's your consultation overview for today
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {expertStats.map((stat, index) => (
                <div
                  key={index}
                >
                  <ExpertStatsCard {...stat} />
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Earnings Chart */}
              <div className="lg:col-span-2">
                <EarningsChart />
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    to="/expert-consultations"
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg hover:shadow-md transition-all border border-teal-100 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                      <i className="ri-calendar-check-line text-xl text-white"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        View Schedule
                      </p>
                      <p className="text-xs text-gray-600">
                        Manage appointments
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/expert-clients"
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition-all border border-blue-100 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <i className="ri-user-search-line text-xl text-white"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Client List
                      </p>
                      <p className="text-xs text-gray-600">View all clients</p>
                    </div>
                  </Link>

                  <Link
                    to="/expert-earnings"
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-all border border-green-100 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <i className="ri-line-chart-line text-xl text-white"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Earnings Report
                      </p>
                      <p className="text-xs text-gray-600">
                        View financial details
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/expert-settings"
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all border border-purple-100 cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <i className="ri-settings-3-line text-xl text-white"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Settings
                      </p>
                      <p className="text-xs text-gray-600">Update profile</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UpcomingConsultations />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
