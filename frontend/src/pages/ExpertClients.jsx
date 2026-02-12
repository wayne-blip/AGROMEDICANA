import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";
import { get } from "../api/api";

export default function ExpertClients() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    // Fetch only farmers this expert has consulted with
    const fetchMyClients = async () => {
      try {
        const res = await get("/api/v1/my-clients");
        if (res && res.clients) {
          setClients(res.clients);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchMyClients();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.recentTopics || []).some((topic) =>
        topic.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      (client.crops || []).some((crop) =>
        crop.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  };

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
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                My Clients
              </h1>
              <p className="text-sm text-gray-600">
                Manage your client relationships and farm profiles
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-user-follow-line text-xl text-teal-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{clients.length}</h3>
                <p className="text-xs text-gray-500">My Clients</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-calendar-check-line text-xl text-blue-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + (c.consultations || 0), 0)}
                </h3>
                <p className="text-xs text-gray-500">Total Consultations</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-check-double-line text-xl text-green-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + (c.completedConsultations || 0), 0)}
                </h3>
                <p className="text-xs text-gray-500">Completed</p>
              </div>

              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-time-line text-xl text-yellow-600"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + ((c.consultations || 0) - (c.completedConsultations || 0)), 0)}
                </h3>
                <p className="text-xs text-gray-500">Pending / Active</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search clients by name, location, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap cursor-pointer">
                  <i className="ri-filter-line mr-2"></i>
                  Filters
                </button>
              </div>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingClients ? (
                <div className="col-span-full text-center py-12">
                  <i className="ri-loader-4-line text-5xl text-gray-300 mb-4 animate-spin"></i>
                  <p className="text-gray-500">Loading farmers...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <i className="ri-user-search-line text-5xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 font-medium mb-1">No clients yet</p>
                  <p className="text-sm text-gray-400">Clients will appear here when farmers book consultations with you</p>
                </div>
              ) : (
              filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      {client.avatar ? (
                        <img
                          src={client.avatar}
                          alt={client.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {getInitials(client.name)}
                        </div>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(client.status || "active").charAt(0).toUpperCase() +
                          (client.status || "active").slice(1)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <i className="ri-map-pin-line"></i>
                      <span>{client.location}</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Consultations</span>
                        <span className="font-medium text-gray-900">
                          {client.consultations || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completed</span>
                        <span className="font-medium text-green-700">
                          {client.completedConsultations || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Visit</span>
                        <span className="font-medium text-gray-900">
                          {client.lastConsultation ? new Date(client.lastConsultation).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      {client.farmName && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Farm</span>
                          <span className="font-medium text-gray-900">
                            {client.farmName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Recent Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {(client.recentTopics || []).length > 0 ? client.recentTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-medium truncate max-w-[140px]"
                            title={topic}
                          >
                            {topic}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-400">No topics yet</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer">
                        <i className="ri-message-3-line"></i>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Farmer Profile
              </h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {selectedClient.avatar ? (
                  <img
                    src={selectedClient.avatar}
                    alt={selectedClient.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    {getInitials(selectedClient.name)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                    {selectedClient.name}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {selectedClient.location || "Location not set"}
                  </p>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Consultation History
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-calendar-check-line text-teal-600"></i>
                      <span>{selectedClient.consultations || 0} total consultations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-check-double-line text-green-600"></i>
                      <span>{selectedClient.completedConsultations || 0} completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-time-line text-teal-600"></i>
                      <span>Last visit: {selectedClient.lastConsultation ? new Date(selectedClient.lastConsultation).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Farm Details
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-home-line text-teal-600"></i>
                      <span>{selectedClient.farmName || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-landscape-line text-teal-600"></i>
                      <span>{selectedClient.farmSize || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-calendar-line text-teal-600"></i>
                      <span>Joined {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Contact
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-map-pin-line text-teal-600"></i>
                      <span>{selectedClient.location || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-phone-line text-teal-600"></i>
                      <span>{selectedClient.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <i className="ri-mail-line text-teal-600"></i>
                      <span>{selectedClient.email || "—"}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Crops Grown
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(selectedClient.crops || []).length > 0 ? selectedClient.crops.map((crop, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium"
                      >
                        {crop}
                      </span>
                    )) : (
                      <span className="text-sm text-gray-400">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {(selectedClient.recentTopics || []).length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Recent Consultation Topics
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.recentTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer">
                  <i className="ri-calendar-line mr-2"></i>
                  Schedule Consultation
                </button>
                <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap cursor-pointer">
                  <i className="ri-message-3-line mr-2"></i>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
