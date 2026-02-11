import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, Header } from "../components/dashboard";
import { get, put, post } from "../api/api";
import { motion } from "framer-motion";

// Validation helpers
const validateEmail = (email) => {
  if (!email) return true; // Optional
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Optional
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^\+?[0-9]{7,15}$/.test(cleaned);
};

const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`;
  }
  return null;
};

export default function FarmerSettings() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    farmName: "",
    location: "",
    farmSize: "",
    primaryCrops: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch fresh profile from API to ensure we have the latest data
    const fetchProfile = async () => {
      try {
        const res = await get("/api/v1/auth/profile");
        if (res.error) {
          // Fallback to localStorage if API fails
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            populateForm(parsed);
          } else {
            navigate("/login");
          }
          return;
        }
        const profile = res.user;
        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(profile));
        setUser(profile);
        populateForm(profile);
      } catch (e) {
        console.error("Error fetching profile:", e);
        // Fallback to localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          populateForm(parsed);
        } else {
          navigate("/login");
        }
      }
    };

    const populateForm = (data) => {
      setFormData({
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        farmName: data.farm_name || "",
        location: data.location || "",
        farmSize: data.farm_size || "",
        primaryCrops: data.primary_crops || "",
      });
    };

    fetchProfile();
  }, [navigate]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklyReports: true,
    consultationReminders: true,
    sensorAlerts: true,
  });

  const sections = [
    { id: "profile", label: "Profile", icon: "ri-user-line" },
    { id: "farm", label: "Farm Details", icon: "ri-plant-line" },
    {
      id: "notifications",
      label: "Notifications",
      icon: "ri-notification-3-line",
    },
    { id: "security", label: "Security", icon: "ri-shield-check-line" },
    { id: "preferences", label: "Preferences", icon: "ri-settings-3-line" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Clear save message when user edits
    if (saveMessage.text) {
      setSaveMessage({ type: "", text: "" });
    }
  };

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validateProfileForm = () => {
    const newErrors = {};
    const nameError = validateRequired(formData.fullName, "Full Name");
    if (nameError) newErrors.fullName = nameError;
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFarmForm = () => {
    const newErrors = {};
    const farmNameError = validateRequired(formData.farmName, "Farm Name");
    if (farmNameError) newErrors.farmName = farmNameError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      setSaveMessage({ type: "error", text: "Please fix the errors below" });
      return;
    }
    setLoading(true);
    setSaveMessage({ type: "", text: "" });
    try {
      const res = await put("/api/v1/auth/profile", {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
      });
      if (res.error) {
        setSaveMessage({ type: "error", text: res.error });
      } else {
        const updatedUser = { ...user, ...res.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaveMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to save profile. Please try again.",
      });
    }
    setLoading(false);
  };

  const handleSaveFarmDetails = async () => {
    if (!validateFarmForm()) {
      setSaveMessage({ type: "error", text: "Please fix the errors below" });
      return;
    }
    setLoading(true);
    setSaveMessage({ type: "", text: "" });
    try {
      const res = await put("/api/v1/auth/profile", {
        farm_name: formData.farmName,
        farm_size: formData.farmSize,
        primary_crops: formData.primaryCrops,
      });
      if (res.error) {
        setSaveMessage({ type: "error", text: res.error });
      } else {
        const updatedUser = { ...user, ...res.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSaveMessage({
          type: "success",
          text: "Farm details updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error saving farm details:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to save farm details. Please try again.",
      });
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordError("Please fill in all fields");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await post("/api/v1/auth/change-password", passwordData);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setShowPasswordModal(false);
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setSaveMessage({
          type: "success",
          text: "Password changed successfully!",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("Failed to change password. Please try again.");
    }
    setLoading(false);
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <i className="ri-error-warning-line"></i>
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

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
        />

        <main className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="px-6 py-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Settings
              </h1>
              <p className="text-sm text-gray-600">
                Manage your account and farm preferences
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Settings Navigation */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          activeSection === section.id
                            ? "bg-teal-50 text-teal-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <i className={`${section.icon} text-xl`}></i>
                        <span className="font-medium text-sm">
                          {section.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1">
                {/* Profile Section */}
                {activeSection === "profile" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Profile Information
                    </h2>

                    {/* Save Message */}
                    {saveMessage.text && (
                      <div
                        className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                          saveMessage.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <i
                          className={
                            saveMessage.type === "success"
                              ? "ri-check-line"
                              : "ri-error-warning-line"
                          }
                        ></i>
                        {saveMessage.text}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-teal-100">
                          {user?.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                              {(user?.full_name || user?.username || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap cursor-pointer mb-2 inline-block">
                            Change Photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  setSaveMessage({ type: "error", text: "Image size should not exceed 5MB" });
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64 = reader.result;
                                  try {
                                    const res = await put("/api/v1/auth/profile", { profile_picture: base64 });
                                    if (res.error) {
                                      setSaveMessage({ type: "error", text: res.error });
                                    } else {
                                      const updatedUser = { ...user, ...res.user };
                                      localStorage.setItem("user", JSON.stringify(updatedUser));
                                      setUser(updatedUser);
                                      setSaveMessage({ type: "success", text: "Profile photo updated!" });
                                    }
                                  } catch (err) {
                                    setSaveMessage({ type: "error", text: "Failed to update photo" });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-600 mt-2">
                            JPG, PNG or WebP. Max size 5MB
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              errors.fullName
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {renderError("fullName")}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              errors.email
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {renderError("email")}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              errors.phone
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {renderError("phone")}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading && (
                            <i className="ri-loader-4-line animate-spin"></i>
                          )}
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Farm Details Section */}
                {activeSection === "farm" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Farm Details
                    </h2>

                    {/* Save Message */}
                    {saveMessage.text && (
                      <div
                        className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                          saveMessage.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <i
                          className={
                            saveMessage.type === "success"
                              ? "ri-check-line"
                              : "ri-error-warning-line"
                          }
                        ></i>
                        {saveMessage.text}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Farm Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="farmName"
                          value={formData.farmName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            errors.farmName
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {renderError("farmName")}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Farm Size
                        </label>
                        <input
                          type="text"
                          name="farmSize"
                          value={formData.farmSize}
                          onChange={handleInputChange}
                          placeholder="e.g., 50 hectares"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Crops
                        </label>
                        <input
                          type="text"
                          name="primaryCrops"
                          value={formData.primaryCrops}
                          onChange={handleInputChange}
                          placeholder="e.g., Maize, Tobacco, Soya Beans"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Connected Devices */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Connected Devices
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                              <i className="ri-sensor-line text-lg text-white"></i>
                            </div>
                            <span className="font-semibold text-gray-900">
                              Soil Sensor #1
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Sector 1 - Active
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <i className="ri-drop-line text-lg text-white"></i>
                            </div>
                            <span className="font-semibold text-gray-900">
                              Water Monitor
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Dam - Active</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="text-center">
                            <i className="ri-add-line text-2xl text-gray-400"></i>
                            <p className="text-sm text-gray-500 mt-1">
                              Add Device
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSaveFarmDetails}
                        disabled={loading}
                        className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading && (
                          <i className="ri-loader-4-line animate-spin"></i>
                        )}
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === "notifications" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Notification Preferences
                    </h2>

                    <div className="space-y-4">
                      {[
                        {
                          key: "emailAlerts",
                          label: "Email Alerts",
                          desc: "Receive important alerts via email",
                        },
                        {
                          key: "smsAlerts",
                          label: "SMS Alerts",
                          desc: "Get critical alerts via SMS",
                        },
                        {
                          key: "pushNotifications",
                          label: "Push Notifications",
                          desc: "Browser and mobile notifications",
                        },
                        {
                          key: "weeklyReports",
                          label: "Weekly Reports",
                          desc: "Receive weekly farm performance reports",
                        },
                        {
                          key: "consultationReminders",
                          label: "Consultation Reminders",
                          desc: "Reminders before scheduled consultations",
                        },
                        {
                          key: "sensorAlerts",
                          label: "Sensor Alerts",
                          desc: "Alerts when sensors detect anomalies",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {item.label}
                            </h3>
                            <p className="text-xs text-gray-600">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => handleToggle(item.key)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications[item.key]
                                ? "bg-teal-500"
                                : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifications[item.key]
                                  ? "translate-x-7"
                                  : "translate-x-1"
                              }`}
                            ></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Section */}
                {activeSection === "security" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Security Settings
                    </h2>

                    {/* Save Message */}
                    {saveMessage.text && (
                      <div
                        className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                          saveMessage.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <i
                          className={
                            saveMessage.type === "success"
                              ? "ri-check-line"
                              : "ri-error-warning-line"
                          }
                        ></i>
                        {saveMessage.text}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Change Password
                            </h3>
                            <p className="text-xs text-gray-600">
                              Update your password regularly for security
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Two-Factor Authentication
                            </h3>
                            <p className="text-xs text-gray-600">
                              Add an extra layer of security
                            </p>
                          </div>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors cursor-pointer">
                            Enable
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Active Sessions
                            </h3>
                            <p className="text-xs text-gray-600">
                              Manage devices where you're logged in
                            </p>
                          </div>
                          <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            View All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Section */}
                {activeSection === "preferences" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Preferences
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option>English</option>
                          <option>Shona</option>
                          <option>Ndebele</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperature Unit
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option>Celsius (°C)</option>
                          <option>Fahrenheit (°F)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Format
                        </label>
                        <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                          <option>DD/MM/YYYY</option>
                          <option>MM/DD/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm cursor-pointer">
                          Save Preferences
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                <i className="ri-error-warning-line"></i>
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <i className="ri-loader-4-line animate-spin"></i>}
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
