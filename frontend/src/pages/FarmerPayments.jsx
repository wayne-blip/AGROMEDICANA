import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, Header } from "../components/dashboard";
import { get } from "../api/api";

export default function FarmerPayments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) { console.error(e); }
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await get("/api/v1/my-payments");
      if (res && !res.error) {
        setTransactions(res.transactions || []);
        setTotalSpent(res.total_spent || 0);
        setTotalPayments(res.total_payments || 0);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    get("/api/v1/unread-counts").then((res) => {
      if (res && !res.error) setUnreadCounts(res);
    }).catch(() => {});
  }, [fetchPayments]);

  const avgTransaction = totalPayments > 0 ? totalSpent / totalPayments : 0;

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.expert_name || "").toLowerCase().includes(q) ||
      (t.topic || "").toLowerCase().includes(q) ||
      (t.status || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          onMenuClick={() => setSidebarOpen(true)}
          userRole={user?.role || "farmer"}
          user={user}
          unreadCounts={unreadCounts}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your consultation payment history
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-xl"></i>
                  </div>
                </div>
                <h3 className="text-xs opacity-90 mb-1">Total Spent</h3>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-file-list-line text-lg text-blue-600"></i>
                  </div>
                </div>
                <h3 className="text-xs text-gray-600 mb-1">Total Transactions</h3>
                <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i className="ri-line-chart-line text-lg text-emerald-600"></i>
                  </div>
                </div>
                <h3 className="text-xs text-gray-600 mb-1">Avg Transaction</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(avgTransaction)}
                </p>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Payment History
                  </h2>
                  <div className="relative flex-1 max-w-md">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
                  <span className="text-gray-500 text-sm">Loading payments...</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <i className="ri-wallet-3-line text-5xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? "No matching transactions" : "No payments yet"}
                  </h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    {searchQuery
                      ? "Try a different search term."
                      : "When you pay for consultations, your transaction history will appear here."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Expert
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Service
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Amount
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                            {formatDate(payment.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {payment.expert_photo ? (
                                <img
                                  src={payment.expert_photo}
                                  alt={payment.expert_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                  <i className="ri-user-line text-sm text-teal-600"></i>
                                </div>
                              )}
                              <span className="text-sm text-gray-900 font-medium">
                                {payment.expert_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                            {payment.topic || "Consultation"}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : payment.status === "refunded"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {payment.status === "completed"
                                ? "Completed"
                                : payment.status === "refunded"
                                ? "Refunded"
                                : payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Secure Payments Card */}
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-check-line text-xl text-teal-600"></i>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Secure Payments
                  </h3>
                  <p className="text-sm text-gray-600">
                    All payments are processed securely through our platform.
                    A 10% platform fee is applied to each consultation payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
