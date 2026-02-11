import React, { useState, useEffect, useCallback } from "react";
import { ExpertSidebar, ExpertHeader } from "../components/expert";
import ChatPage from "../components/ChatPage";
import { get } from "../api/api";

export default function ExpertChats() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (_) {}
    }
  }, []);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await get("/api/v1/consultations");
      const list = res?.consultations || res || [];
      const accepted = Array.isArray(list) ? list.filter(c => c.status === "accepted") : [];
      setConsultations(accepted);
    } catch (err) {
      console.error("Error fetching consultations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  return (
    <div className="flex h-screen bg-gray-50">
      <ExpertSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ExpertHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />

        <main className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="ri-loader-4-line animate-spin text-3xl text-teal-600"></i>
                <p className="text-gray-500 mt-3 text-sm">Loading your chats...</p>
              </div>
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-message-3-line text-4xl text-gray-300"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No active chats</h2>
                <p className="text-gray-500 text-sm mb-6">
                  When a farmer books and pays for a consultation, you'll be able to chat here.
                </p>
                <a
                  href="/expert-consultations"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <i className="ri-calendar-check-line"></i>
                  View Consultations
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <ChatPage
                consultations={consultations}
                user={user}
                onClose={() => window.history.back()}
                embedded
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
