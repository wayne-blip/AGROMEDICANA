import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ExpertSidebar from "../components/expert/ExpertSidebar";
import ExpertHeader from "../components/expert/ExpertHeader";
import { get, put, post } from "../api/api";

export default function ExpertSettings() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await get("/api/v1/auth/profile");
        if (res.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          setUser(res.user);
          setFormData({
            fullName: res.user.full_name || "",
            email: res.user.email || "",
            phone: res.user.phone || "",
          });
        }
      } catch (e) {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setFormData({
            fullName: parsed.full_name || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
          });
        } else {
          navigate("/login");
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (saveMessage.text) setSaveMessage({ type: "", text: "" });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveMessage({ type: "", text: "" });
    try {
      const res = await put("/api/v1/auth/profile", {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });
      if (res.error) {
        setSaveMessage({ type: "error", text: res.error });
      } else {
        const updatedUser = { ...user, ...res.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save. Please try again." });
    }
    setLoading(false);
  };

  const handleProfilePicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setSaveMessage({ type: "error", text: "Please upload a valid image (JPEG, PNG, or WebP)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: "error", text: "Image size should not exceed 5MB" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await put("/api/v1/auth/profile", { profile_picture: reader.result });
        if (res.user) {
          const updatedUser = { ...user, ...res.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setSaveMessage({ type: "success", text: "Profile photo updated!" });
        }
      } catch {
        setSaveMessage({ type: "error", text: "Failed to update photo" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordError("All fields are required");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await post("/api/v1/auth/change-password", passwordData);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      }
    } catch {
      setPasswordError("Failed to change password");
    }
  };

  const getInitials = (name) => {
    if (!name) return "E";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const rawSpecialty = user?.meta?.split(" — ")[0] || "";
  const specialty = rawSpecialty.replace(/\b\w/g, (c) => c.toUpperCase());

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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
              <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Settings Navigation */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <nav className="space-y-1">
                    {[
                      { id: "profile", label: "Profile", icon: "ri-user-line" },
                      { id: "professional", label: "Professional Info", icon: "ri-briefcase-line" },
                      { id: "security", label: "Security", icon: "ri-lock-line" },
                      { id: "notifications", label: "Notifications", icon: "ri-notification-line" },
                      { id: "billing", label: "Billing", icon: "ri-bank-card-line" },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          activeSection === sec.id
                            ? "bg-teal-50 text-teal-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <i className={`${sec.icon} text-xl`}></i>
                        <span className="font-medium text-sm">{sec.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1">
                {/* Save Message */}
                {saveMessage.text && (
                  <div
                    className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                      saveMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <i className={saveMessage.type === "success" ? "ri-check-line" : "ri-error-warning-line"}></i>
                    {saveMessage.text}
                  </div>
                )}

                {activeSection === "profile" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-teal-100 flex-shrink-0">
                          {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                              {getInitials(user?.full_name || user?.username)}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer mb-2 inline-block">
                            Change Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicture} />
                          </label>
                          <p className="text-xs text-gray-600 mt-2">JPG, PNG or WebP. Max size 5MB</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                          <input
                            type="text"
                            value={specialty}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "professional" && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Information</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                          <input
                            type="text"
                            value={specialty}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                          <input
                            type="text"
                            value={(user?.meta?.split(" — ")[1] || "").replace(/^(\d+) years/, (m, n) => n === "1" ? "1 year" : m)}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Documents</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <i className="ri-shield-check-line text-2xl text-green-600"></i>
                            <div>
                              <p className="text-sm font-medium text-gray-900">National ID</p>
                              <p className="text-xs text-gray-600">Verified</p>
                            </div>
                          </div>
                          <span className="text-green-600 text-sm font-medium">✓ Verified</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <i className="ri-shield-check-line text-2xl text-green-600"></i>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Professional Certificate</p>
                              <p className="text-xs text-gray-600">Verified</p>
                            </div>
                          </div>
                          <span className="text-green-600 text-sm font-medium">✓ Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                        <i className="ri-error-warning-line mr-2"></i>{passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                        <i className="ri-check-line mr-2"></i>{passwordSuccess}
                      </div>
                    )}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData((p) => ({ ...p, current_password: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData((p) => ({ ...p, new_password: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData((p) => ({ ...p, confirm_password: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer"
                      >
                        Update Password
                      </button>
                      <div className="pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "notifications" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                    <div className="space-y-6">
                      {[
                        { title: "New Consultation Requests", desc: "Get notified when clients book consultations" },
                        { title: "Payment Notifications", desc: "Receive updates about your earnings" },
                        { title: "Client Messages", desc: "Get notified of new messages from clients" },
                        { title: "Reviews & Ratings", desc: "Be notified when clients leave reviews" },
                        { title: "Marketing Emails", desc: "Receive tips and platform updates", defaultOff: true },
                      ].map((notif, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{notif.title}</h3>
                            <p className="text-xs text-gray-600">{notif.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={!notif.defaultOff} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "billing" && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Methods</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                              <i className="ri-bank-line text-xl text-teal-600"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">CBZ Bank</p>
                              <p className="text-xs text-gray-600">****1234</p>
                            </div>
                          </div>
                          <button className="text-teal-600 hover:text-teal-700 text-sm font-medium cursor-pointer">Edit</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <i className="ri-smartphone-line text-xl text-green-600"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">EcoCash</p>
                              <p className="text-xs text-gray-600">{user?.phone || "+263 7XX XXX XXX"}</p>
                            </div>
                          </div>
                          <button className="text-teal-600 hover:text-teal-700 text-sm font-medium cursor-pointer">Edit</button>
                        </div>
                      </div>
                      <button className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap cursor-pointer">
                        <i className="ri-add-line mr-2"></i>
                        Add Payment Method
                      </button>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Tax Information</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID / BP Number</label>
                          <input
                            type="text"
                            placeholder="Enter your tax identification number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                        <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer">
                          Save Tax Information
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
