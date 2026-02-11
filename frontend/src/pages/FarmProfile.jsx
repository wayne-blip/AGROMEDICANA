import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import { get } from "../api/api";
import { motion } from "framer-motion";

export default function FarmProfile() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
  });

  // Location state for map
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading"); // loading, refining, gps, ip, default, denied
  const [locationError, setLocationError] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null); // accuracy in meters

  // Manual coordinate adjustment
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [tempCoords, setTempCoords] = useState({ lat: "", lng: "" });

  // Upload form state
  const [uploadData, setUploadData] = useState({
    dataType: "Sensor Reading",
    category: "Crop Data",
    notes: "",
    file: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch fresh profile from API
    const fetchProfile = async () => {
      try {
        const res = await get("/api/v1/auth/profile");
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        } else {
          const userData = localStorage.getItem("user");
          if (userData) setUser(JSON.parse(userData));
          else navigate("/login");
        }
      } catch (e) {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
        else navigate("/login");
      }
    };
    fetchProfile();

    // Fetch consultations for reports/activity data
    const fetchConsultations = async () => {
      try {
        const res = await get("/api/v1/consultations");
        if (res?.consultations) setConsultations(res.consultations);
      } catch (_) {}
    };
    fetchConsultations();

    // Fetch unread counts
    const fetchUnreadCounts = async () => {
      try {
        const res = await get("/api/v1/unread-counts");
        if (res && !res.error) {
          setUnreadCounts(res);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };
    fetchUnreadCounts();

    // Use watchPosition for progressively more accurate location readings
    let watchId = null;
    if (navigator.geolocation) {
      setLocationStatus("refining");
      watchId = navigator.geolocation.watchPosition(
        function (position) {
          const acc = position.coords.accuracy; // accuracy in meters
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationAccuracy(Math.round(acc));
          setLocationError(null);

          if (acc <= 50) {
            // Accurate enough — stop watching
            setLocationStatus("gps");
            if (watchId != null) navigator.geolocation.clearWatch(watchId);
          } else {
            setLocationStatus("refining");
          }
        },
        function (error) {
          let errorMsg = "Error: The Geolocation service failed.";
          if (error.code === 1) {
            errorMsg = "Location access denied. Please allow location in browser settings.";
          } else if (error.code === 2) {
            errorMsg = "Location unavailable. Check your GPS/network settings.";
          } else if (error.code === 3) {
            errorMsg = "Location request timed out. Try again or enter coordinates manually.";
          }
          setLocationError(errorMsg);
          setLocationStatus("denied");
          setUserLocation({ lat: -17.8252, lng: 30.9755 });
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Error: Your browser doesn't support geolocation.");
      setLocationStatus("denied");
      setUserLocation({ lat: -17.8252, lng: 30.9755 });
    }

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [navigate]);

  // Ref to track active watch so we can clear it
  const watchRef = React.useRef(null);

  // Function to retry GPS location
  const requestGPSLocation = () => {
    setLocationStatus("refining");
    setLocationError(null);
    setUserLocation(null);
    setLocationAccuracy(null);

    // Clear any existing watch
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        function (position) {
          const acc = position.coords.accuracy;
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationAccuracy(Math.round(acc));
          setLocationError(null);

          if (acc <= 50) {
            setLocationStatus("gps");
            if (watchRef.current != null) {
              navigator.geolocation.clearWatch(watchRef.current);
              watchRef.current = null;
            }
          } else {
            setLocationStatus("refining");
          }
        },
        function (error) {
          let errorMsg = "Error: The Geolocation service failed.";
          if (error.code === 1) {
            errorMsg = "Location access denied. Please allow location in browser settings.";
          } else if (error.code === 2) {
            errorMsg = "Location unavailable. Check your GPS/network settings.";
          } else if (error.code === 3) {
            errorMsg = "Location request timed out. Try again or enter coordinates manually.";
          }
          setLocationError(errorMsg);
          setLocationStatus("denied");
          setUserLocation({ lat: -17.8252, lng: 30.9755 });
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    }
  };

  // Build reports from real consultation data
  const reportIcons = [
    { icon: "ri-heart-pulse-line", color: "bg-red-100 text-red-600" },
    { icon: "ri-plant-line", color: "bg-green-100 text-green-600" },
    { icon: "ri-water-flash-line", color: "bg-blue-100 text-blue-600" },
    { icon: "ri-stethoscope-line", color: "bg-purple-100 text-purple-600" },
    { icon: "ri-leaf-line", color: "bg-teal-100 text-teal-600" },
  ];
  const reports = consultations
    .filter((c) => c.status === "completed")
    .slice(0, 5)
    .map((c, i) => ({
      id: c.id,
      title: c.topic || "Consultation",
      expert: c.expert_name || "Expert",
      date: c.date ? new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
      type: c.expert_specialty || "General",
      status: c.status,
      icon: reportIcons[i % reportIcons.length].icon,
      color: reportIcons[i % reportIcons.length].color,
    }));

  const handleUploadChange = (e) => {
    const { name, value } = e.target;
    setUploadData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUploadSubmit = () => {
    // Here you would submit the upload to the backend
    console.log("Upload submitted:", uploadData);
    setShowUploadModal(false);
    setUploadData({
      dataType: "Sensor Reading",
      category: "Crop Data",
      notes: "",
      file: null,
    });
  };

  const userRole = user?.role === "Expert" ? "Expert" : "Farmer";

  // Get farm info from user's meta
  const getFarmInfo = () => {
    if (!user) return { farmName: "My Farm", location: "Zimbabwe", farmSize: "N/A", primaryCrops: "" };
    return {
      farmName: user.farm_name || "My Farm",
      location: user.location || "Zimbabwe",
      farmSize: user.farm_size || "N/A",
      primaryCrops: user.primary_crops || "",
    };
  };

  const farmInfo = getFarmInfo();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userRole={userRole}
          user={user}
          unreadCounts={unreadCounts}
        />

        <main className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Farm Profile
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your farm data and monitor real-time metrics
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-upload-2-line text-xl"></i>
                Upload Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Farmer Profile Card */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/30 mb-4">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user?.full_name || "Farmer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                        {(user?.full_name || user?.username || "F").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">
                    {user?.full_name || user?.username || "Farmer"}
                  </h3>
                  <p className="text-sm opacity-90 mb-3">{farmInfo.farmName}</p>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <i className="ri-map-pin-line"></i>
                    <span className="capitalize">
                      {farmInfo.location.replace("-", " ")}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 w-full">
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-lg">12</p>
                        <p className="text-xs opacity-80">Consultations</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">4</p>
                        <p className="text-xs opacity-80">Reports</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">3</p>
                        <p className="text-xs opacity-80">Years</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Farm Details
                  </h3>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg">
                    <i className="ri-edit-line"></i>
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Farm Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {farmInfo.farmName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {farmInfo.location.replace("-", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Farm Size</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {farmInfo.farmSize}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Primary Activities
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {farmInfo.primaryCrops ? (
                        farmInfo.primaryCrops.split(", ").map((crop, idx) => {
                          const colors = [
                            "bg-emerald-100 text-emerald-700",
                            "bg-teal-100 text-teal-700",
                            "bg-cyan-100 text-cyan-700",
                            "bg-amber-100 text-amber-700",
                            "bg-pink-100 text-pink-700",
                            "bg-blue-100 text-blue-700",
                          ];
                          return (
                            <span
                              key={idx}
                              className={`px-3 py-1 ${colors[idx % colors.length]} text-xs font-medium rounded-full whitespace-nowrap`}
                            >
                              {crop.trim()}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-gray-400 italic">No activities set yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Farm Health Score</h3>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-heart-pulse-line text-2xl"></i>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-5xl font-bold mb-2">87%</p>
                  <p className="text-sm opacity-90">Excellent condition</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Crop Health</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Livestock Health</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Water Quality</span>
                    <span className="font-semibold">84%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i className="ri-database-2-line text-white"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Active Sensors</p>
                        <p className="text-lg font-bold text-gray-900">12</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <i className="ri-file-text-line text-white"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Reports</p>
                        <p className="text-lg font-bold text-gray-900">24</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <i className="ri-alert-line text-white"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Alerts</p>
                        <p className="text-lg font-bold text-gray-900">2</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="border-b border-gray-200">
                <div className="flex gap-1 p-1">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "overview"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("sensors")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "sensors"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-sensor-line mr-2"></i>
                    Sensor Data
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === "reports"
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-file-list-3-line mr-2"></i>
                    Reports
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Farm Location
                      </h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                        <div className="h-[400px] bg-white rounded-lg shadow-sm overflow-hidden relative">
                          {!userLocation ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                              <i className="ri-loader-4-line animate-spin text-4xl text-teal-600 mb-3"></i>
                              <p className="text-sm font-medium text-gray-700">
                                Detecting your precise location...
                              </p>
                              <p className="text-xs text-gray-500 mt-1">This may take a few seconds for GPS accuracy</p>
                            </div>
                          ) : (
                            <>
                              <iframe
                                key={`${userLocation.lat}-${userLocation.lng}`}
                                src={`https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&t=k&z=19&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Farm Location"
                              ></iframe>
                              <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                  <i className="ri-satellite-line text-teal-600"></i>
                                  Satellite View
                                </div>
                                {locationStatus === "refining" && (
                                  <div className="bg-amber-50/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-medium text-amber-700 flex items-center gap-1.5 animate-pulse">
                                    <i className="ri-focus-3-line"></i>
                                    Refining accuracy{locationAccuracy ? ` (~${locationAccuracy}m)` : '...'}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Location Error/Warning Message */}
                        {locationError && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <i className="ri-error-warning-line text-amber-500 text-lg mt-0.5"></i>
                            <div className="flex-1">
                              <p className="text-sm text-amber-800">{locationError}</p>
                              {locationStatus !== "gps" && (
                                <button
                                  onClick={requestGPSLocation}
                                  className="mt-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 flex items-center gap-2"
                                >
                                  <i className="ri-focus-3-line"></i>
                                  Use My Exact GPS Location
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {userLocation && (
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <i className="ri-map-pin-line text-teal-600"></i>
                              <span>
                                {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                              </span>
                              {locationStatus === "gps" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  <i className="ri-checkbox-circle-fill"></i>
                                  GPS{locationAccuracy ? ` (±${locationAccuracy}m)` : ' (Exact)'}
                                </span>
                              )}
                              {locationStatus === "refining" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full animate-pulse">
                                  <i className="ri-loader-4-line animate-spin"></i>
                                  Refining{locationAccuracy ? ` (±${locationAccuracy}m)` : '...'}
                                </span>
                              )}
                              {locationStatus === "ip" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                  <i className="ri-wifi-line"></i>
                                  Approximate
                                </span>
                              )}
                              {(locationStatus === "default" || locationStatus === "denied") && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                  <i className="ri-error-warning-line"></i>
                                  Not Your Location
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {locationStatus !== "gps" && (
                                <button
                                  onClick={requestGPSLocation}
                                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 px-3 py-1.5 bg-teal-50 rounded-lg"
                                >
                                  <i className="ri-focus-3-line"></i>
                                  Use GPS
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setTempCoords({
                                    lat: userLocation.lat.toString(),
                                    lng: userLocation.lng.toString(),
                                  });
                                  setShowLocationEdit(!showLocationEdit);
                                }}
                                className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                              >
                                <i className="ri-pencil-line"></i>
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                        {showLocationEdit && (
                          <div className="mt-3 bg-white rounded-lg border border-gray-200 p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              Enter exact coordinates:
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Latitude
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={tempCoords.lat}
                                  onChange={(e) =>
                                    setTempCoords({
                                      ...tempCoords,
                                      lat: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="-17.825200"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                  Longitude
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={tempCoords.lng}
                                  onChange={(e) =>
                                    setTempCoords({
                                      ...tempCoords,
                                      lng: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="30.975500"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const lat = parseFloat(tempCoords.lat);
                                  const lng = parseFloat(tempCoords.lng);
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    setUserLocation({ lat, lng });
                                    setLocationStatus("success");
                                    setShowLocationEdit(false);
                                  }
                                }}
                                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setShowLocationEdit(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Crop Information
                        </h3>
                        <div className="space-y-3">
                          {(user?.primary_crops || "")
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean)
                            .map((crop, i) => {
                              const colors = [
                                "from-green-50 to-emerald-50 border-green-200",
                                "from-yellow-50 to-orange-50 border-yellow-200",
                                "from-blue-50 to-cyan-50 border-blue-200",
                                "from-purple-50 to-pink-50 border-purple-200",
                              ];
                              return (
                                <div key={i} className={`p-4 bg-gradient-to-r ${colors[i % colors.length]} rounded-lg border`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {crop}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                                      Active
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {user?.farm_name || "Farm"} — {user?.farm_size || ""}
                                  </p>
                                </div>
                              );
                            })}
                          {!(user?.primary_crops || "").trim() && (
                            <p className="text-sm text-gray-500 italic">No crops added yet. Update your profile to add crop information.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Consultation Summary
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                Total Consultations
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {consultations.length}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              Completed: {consultations.filter((c) => c.status === "completed").length}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-900">
                                Active
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {consultations.filter((c) => c.status === "accepted" || c.status === "pending").length}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              Pending: {consultations.filter((c) => c.status === "pending").length} | Accepted: {consultations.filter((c) => c.status === "accepted").length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "sensors" && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                      <i className="ri-sensor-line text-3xl text-teal-600"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      IoT Sensors Coming Soon
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      Connect soil moisture, temperature, pH and nutrient sensors to monitor your farm in real time. This feature is under development.
                    </p>
                  </div>
                )}

                {activeTab === "reports" && (
                  <div className="space-y-4">
                    {reports.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <i className="ri-file-text-line text-4xl text-gray-300 mb-3"></i>
                        <p className="text-sm text-gray-500">No completed consultations yet. Your consultation reports will appear here.</p>
                      </div>
                    )}
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center gap-4 p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div
                          className={`w-14 h-14 ${report.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                        >
                          <i className={`${report.icon} text-2xl`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {report.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            By {report.expert}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <i className="ri-calendar-line"></i>
                              <span>{report.date}</span>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full whitespace-nowrap">
                              {report.type}
                            </span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Upload Farm Data
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <select
                  name="dataType"
                  value={uploadData.dataType}
                  onChange={handleUploadChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option>Sensor Reading</option>
                  <option>Manual Entry</option>
                  <option>Image Upload</option>
                  <option>Document Upload</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={uploadData.category}
                  onChange={handleUploadChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option>Crop Data</option>
                  <option>Livestock Data</option>
                  <option>Water Quality</option>
                  <option>Soil Analysis</option>
                  <option>Weather Data</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                  <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-3"></i>
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    CSV, Excel, PDF, or Images (max 10MB)
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  maxLength={500}
                  value={uploadData.notes}
                  onChange={handleUploadChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Add any additional notes or observations..."
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Upload Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
