import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";
import { get } from "../api/api";

export default function ExpertEarnings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    const fetchData = async () => {
      try {
        const [consRes, earnRes] = await Promise.all([
          get("/api/v1/consultations"),
          get("/api/v1/earnings"),
        ]);
        if (consRes?.consultations) setConsultations(consRes.consultations);
        if (earnRes && !earnRes.error) setEarnings(earnRes);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeConsults = consultations.filter((c) => c.status === "accepted");
  const totalEarned = earnings?.total_earned || 0;
  const totalPayments = earnings?.total_payments || 0;
  const platformFees = earnings?.total_platform_fees || 0;
  const transactions = earnings?.transactions || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;

  // Build monthly earnings chart from transactions
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthTransactions = transactions.filter((t) => {
      if (!t.created_at) return false;
      const td = new Date(t.created_at);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const total = monthTransactions.reduce((sum, t) => sum + (t.expert_payout || 0), 0);
    monthlyData.push({ month: months[d.getMonth()], total, count: monthTransactions.length });
  }
  const maxTotal = Math.max(...monthlyData.map((d) => d.total), 1);

  return (
    <div className="flex h-screen bg-gray-50">
      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main className="flex-1 overflow-y-auto">
          <motion.div className="px-6 py-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Earnings
                </h1>
                <p className="text-sm text-gray-600">
                  Track your consultation income and payment history
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Earned */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-xl"></i>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Net earnings</span>
                </div>
                <h3 className="text-3xl font-bold">{formatCurrency(totalEarned)}</h3>
                <p className="text-teal-100 text-xs mt-1">After 10% platform fee</p>
              </div>

              {/* Total Payments */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-bank-card-line text-xl text-blue-600"></i>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{totalPayments}</h3>
                <p className="text-xs text-gray-500">Payments received</p>
              </div>

              {/* Platform Fees */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <i className="ri-percent-line text-xl text-amber-600"></i>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(platformFees)}</h3>
                <p className="text-xs text-gray-500">Platform fees (10%)</p>
              </div>

              {/* Active */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-chat-check-line text-xl text-green-600"></i>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{activeConsults.length}</h3>
                <p className="text-xs text-gray-500">Active consultations</p>
              </div>
            </div>

            {/* Monthly Earnings Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Monthly Earnings</h2>
                  <p className="text-xs text-gray-500">Revenue from consultation payments</p>
                </div>
              </div>
              <div className="h-72">
                <div className="flex items-end justify-between h-full gap-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex items-end justify-center mb-2" style={{ height: "240px" }}>
                        <div
                          className="w-full bg-gradient-to-t from-teal-500 to-emerald-400 rounded-t-lg hover:from-teal-600 hover:to-emerald-500 transition-all cursor-pointer relative group"
                          style={{ height: `${Math.max((data.total / maxTotal) * 100, 3)}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            {formatCurrency(data.total)}
                            <span className="text-gray-400 ml-1">({data.count} paid)</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
                  <p className="text-xs text-gray-500">{transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
                  <span className="text-gray-500">Loading earnings...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-wallet-3-line text-3xl text-gray-300"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    When farmers pay for accepted consultations, your earnings will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Fee</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Your Payout</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {t.client_photo ? (
                                  <img src={t.client_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-teal-700">
                                    {(t.client_name || "?").slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{t.client_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 truncate block max-w-[200px]">{t.topic || "Consultation"}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{formatDate(t.created_at)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(t.amount)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-amber-600">-{formatCurrency(t.platform_fee)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-bold text-teal-700">{formatCurrency(t.expert_payout)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              t.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {t.status === "completed" ? "Paid" : "Refunded"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
