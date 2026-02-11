import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sidebar, Header } from "../components/dashboard";
import { get } from "../api/api";

export default function FarmerAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [payments, setPayments] = useState({ transactions: [], total_spent: 0, total_payments: 0 });
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) { console.error(e); }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [consRes, payRes] = await Promise.all([
        get("/api/v1/consultations"),
        get("/api/v1/my-payments"),
      ]);
      if (consRes?.consultations) setConsultations(consRes.consultations);
      if (payRes && !payRes.error) setPayments(payRes);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    get("/api/v1/unread-counts").then((res) => {
      if (res && !res.error) setUnreadCounts(res);
    }).catch(() => {});
  }, [fetchData]);

  // Derived stats
  const totalConsultations = consultations.length;
  const completedConsultations = consultations.filter((c) => c.status === "completed").length;
  const pendingConsultations = consultations.filter((c) => c.status === "pending").length;
  const acceptedConsultations = consultations.filter((c) => c.status === "accepted").length;
  const rejectedConsultations = consultations.filter((c) => c.status === "rejected" || c.status === "cancelled").length;

  // Monthly consultation data (last 6 months)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthConsults = consultations.filter((c) => {
      if (!c.date) return false;
      const cd = new Date(c.date);
      return cd >= d && cd < nextMonth;
    });
    const monthPayments = (payments.transactions || []).filter((t) => {
      if (!t.created_at) return false;
      const td = new Date(t.created_at);
      return td >= d && td < nextMonth;
    });
    monthlyData.push({
      month: months[d.getMonth()],
      consultations: monthConsults.length,
      completed: monthConsults.filter((c) => c.status === "completed").length,
      spent: monthPayments.reduce((sum, t) => sum + (t.amount || 0), 0),
    });
  }

  const maxConsults = Math.max(...monthlyData.map((d) => d.consultations), 1);

  // Expert utilization - group consultations by expert
  const expertMap = {};
  consultations.forEach((c) => {
    const name = c.expert_name || "Unknown";
    if (!expertMap[name]) {
      expertMap[name] = { name, total: 0, completed: 0, specialty: c.expert_specialty || "" };
    }
    expertMap[name].total += 1;
    if (c.status === "completed") expertMap[name].completed += 1;
  });
  const expertBreakdown = Object.values(expertMap).sort((a, b) => b.total - a.total);

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;

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
          <div className="px-6 py-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Farm Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your consultation activity and spending
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <i className="ri-loader-4-line animate-spin text-3xl text-teal-600 mr-3"></i>
                <span className="text-gray-500">Loading analytics...</span>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Consultations</p>
                        <p className="text-xl font-bold text-gray-900">{totalConsultations}</p>
                        <p className="text-xs text-gray-500 mt-1">{pendingConsultations} pending</p>
                      </div>
                      <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                        <i className="ri-calendar-check-line text-xl text-white"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Completed</p>
                        <p className="text-xl font-bold text-gray-900">{completedConsultations}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {totalConsultations > 0
                            ? `${Math.round((completedConsultations / totalConsultations) * 100)}% completion rate`
                            : "No data yet"}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <i className="ri-check-double-line text-xl text-white"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Active Now</p>
                        <p className="text-xl font-bold text-gray-900">{acceptedConsultations}</p>
                        <p className="text-xs text-blue-600 mt-1">In progress</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i className="ri-chat-3-line text-xl text-white"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(payments.total_spent)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {payments.total_payments} payment{payments.total_payments !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <i className="ri-money-dollar-circle-line text-xl text-white"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Consultation Chart */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Consultation Activity
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Monthly consultations over last 6 months
                        </p>
                      </div>
                    </div>

                    {totalConsultations === 0 ? (
                      <div className="text-center py-12">
                        <i className="ri-bar-chart-line text-4xl text-gray-300 mb-3"></i>
                        <p className="text-sm text-gray-500">No consultation data yet</p>
                        <Link to="/experts" className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block">
                          Book your first consultation →
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="flex items-end justify-between gap-4" style={{ height: "200px" }}>
                            {monthlyData.map((data, index) => {
                              const totalHeight = Math.max((data.consultations / maxConsults) * 180, 4);
                              const completedHeight = data.consultations > 0
                                ? Math.max((data.completed / maxConsults) * 180, 4) : 0;
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                                  <div className="flex gap-1 items-end">
                                    <div
                                      className="w-4 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-t transition-all duration-300 hover:from-teal-600 hover:to-emerald-500 cursor-pointer"
                                      style={{ height: `${totalHeight}px` }}
                                      title={`Total: ${data.consultations}`}
                                    ></div>
                                    <div
                                      className="w-4 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t transition-all duration-300 hover:from-cyan-600 hover:to-blue-500 cursor-pointer"
                                      style={{ height: `${completedHeight}px` }}
                                      title={`Completed: ${data.completed}`}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-2">
                            {monthlyData.map((data, index) => (
                              <div key={index} className="flex-1 text-center">
                                <span className="text-sm font-medium text-gray-600">{data.month}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-teal-500 rounded"></div>
                            <span className="text-sm text-gray-600">Total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                            <span className="text-sm text-gray-600">Completed</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick Insights */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Summary</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <i className="ri-check-double-line text-lg text-white"></i>
                          </div>
                          <span className="font-semibold text-gray-900">Completed</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {completedConsultations} consultation{completedConsultations !== 1 ? "s" : ""} completed successfully
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i className="ri-timer-line text-lg text-white"></i>
                          </div>
                          <span className="font-semibold text-gray-900">Active</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {acceptedConsultations} active consultation{acceptedConsultations !== 1 ? "s" : ""} in progress
                        </p>
                      </div>

                      {pendingConsultations > 0 && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                              <i className="ri-time-line text-lg text-white"></i>
                            </div>
                            <span className="font-semibold text-gray-900">Pending</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {pendingConsultations} consultation{pendingConsultations !== 1 ? "s" : ""} awaiting expert response
                          </p>
                        </div>
                      )}

                      {payments.total_spent > 0 && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <i className="ri-wallet-3-line text-lg text-white"></i>
                            </div>
                            <span className="font-semibold text-gray-900">Spending</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {formatCurrency(payments.total_spent)} spent across {payments.total_payments} payment{payments.total_payments !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expert Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Expert Breakdown
                    </h2>
                    <Link
                      to="/experts"
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Find Experts →
                    </Link>
                  </div>

                  {expertBreakdown.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="ri-user-star-line text-4xl text-gray-300 mb-3"></i>
                      <p className="text-sm text-gray-500">No consultation history yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expert</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Specialty</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Completed</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expertBreakdown.map((expert, index) => {
                            const rate = expert.total > 0 ? Math.round((expert.completed / expert.total) * 100) : 0;
                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                      <i className="ri-user-star-line text-lg text-teal-600"></i>
                                    </div>
                                    <span className="font-medium text-gray-900">{expert.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-600">{expert.specialty || "—"}</td>
                                <td className="py-4 px-4 text-sm font-medium text-gray-900 text-center">{expert.total}</td>
                                <td className="py-4 px-4 text-sm font-medium text-gray-900 text-center">{expert.completed}</td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-24">
                                      <div
                                        className={`h-2 rounded-full ${
                                          rate >= 75 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-gray-400"
                                        }`}
                                        style={{ width: `${rate}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{rate}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
