import React, { useState, useEffect } from "react";
import { get } from "../../api/api";
import { motion } from "framer-motion";

export default function EarningsChart() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await get("/api/v1/consultations");
        if (res && res.consultations) {
          setConsultations(res.consultations);
        }
      } catch (err) {
        console.error("Error fetching earnings data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build monthly data from real consultations (completed ones)
  const completedConsults = consultations.filter(
    (c) => c.status === "completed",
  );
  const monthlyMap = {};
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  completedConsults.forEach((c) => {
    if (c.date) {
      const d = new Date(c.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: months[d.getMonth()],
          consultations: 0,
        };
      }
      monthlyMap[key].consultations += 1;
    }
  });

  // Get last 6 months
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyData.push(
      monthlyMap[key] || { month: months[d.getMonth()], consultations: 0 },
    );
  }

  const maxConsults = Math.max(...monthlyData.map((d) => d.consultations), 1);
  const totalCompleted = completedConsults.length;
  const totalPending = consultations.filter((c) => c.status === "pending").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Consultations Overview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monthly completed consultations
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-2xl text-teal-600 mr-2"></i>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-6">
            <div
              className="flex items-end justify-between gap-4"
              style={{ height: "200px" }}
            >
              {monthlyData.map((data, index) => {
                const heightPx =
                  maxConsults > 0
                    ? (data.consultations / maxConsults) * 180
                    : 4;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div className="relative group w-full flex justify-center">
                      <div
                        className="w-10 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-teal-600 hover:to-emerald-500 cursor-pointer"
                        style={{
                          height: `${Math.max(heightPx, 4)}px`,
                        }}
                      ></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                          <p className="font-semibold">
                            {data.consultations} consultation
                            {data.consultations !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex-1 text-center">
                  <span className="text-sm font-medium text-gray-600">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4 border border-teal-200">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {consultations.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">All consultations</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCompleted}
              </p>
              <p className="text-xs text-green-600 mt-1">Done</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalPending}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting action</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
