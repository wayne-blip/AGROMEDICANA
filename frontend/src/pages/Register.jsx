import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { post } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import "./Auth.css";

// Validation helpers
const validateEmail = (email) => {
  if (!email) return "Email is required";
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(email)) return "Please enter a valid email address";
  return null;
};

const validatePhone = (phone) => {
  if (!phone) return null; // Optional
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (!/^\+?[0-9]{7,15}$/.test(cleaned))
    return "Please enter a valid phone number";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  return null;
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    // Step 1: Account Type
    accountType: "farmer",

    // Step 2: Personal Info
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 3: Farm/Professional Info
    farmName: "",
    location: "",
    farmSize: "",
    specialty: "",
    experience: "",

    // Step 4: Profile & Activities
    primaryCrops: [],

    // Terms
    agreeTerms: false,
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Document uploads for experts
  const [documents, setDocuments] = useState({
    nationalId: null,
    professionalCertificate: null,
  });
  const [documentPreviews, setDocumentPreviews] = useState({
    nationalId: null,
    professionalCertificate: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop",
      title: "Join Our Community",
      description: "Connect with thousands of farmers and experts",
    },
    {
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
      title: "Sustainable Crop Growth",
      description: "Maximize yields with expert guidance",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Clear general message
    if (message) {
      setMessage(null);
    }
  };

  const validateStep2 = () => {
    const errors = {};
    const fullNameErr = validateRequired(formData.fullName, "Full Name");
    if (fullNameErr) errors.fullName = fullNameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errors.phone = phoneErr;

    const passwordErr = validatePassword(formData.password);
    if (passwordErr) errors.password = passwordErr;

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (formData.accountType === "farmer") {
      const farmNameErr = validateRequired(formData.farmName, "Farm Name");
      if (farmNameErr) errors.farmName = farmNameErr;
      const locationErr = validateRequired(formData.location, "Location");
      if (locationErr) errors.location = locationErr;
    } else {
      const specialtyErr = validateRequired(formData.specialty, "Specialty");
      if (specialtyErr) errors.specialty = specialtyErr;
      const experienceErr = validateRequired(formData.experience, "Experience");
      if (experienceErr) errors.experience = experienceErr;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          type: "error",
          text: "Please upload a valid file (JPEG, PNG, or PDF)",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size should not exceed 5MB" });
        return;
      }

      setDocuments((prev) => ({
        ...prev,
        [documentType]: file,
      }));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreviews((prev) => ({
            ...prev,
            [documentType]: reader.result,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // For PDF, just show the filename
        setDocumentPreviews((prev) => ({
          ...prev,
          [documentType]: "pdf",
        }));
      }

      setMessage(null);
    }
  };

  const removeDocument = (documentType) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: null,
    }));
    setDocumentPreviews((prev) => ({
      ...prev,
      [documentType]: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStep2()) {
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!validateStep3()) {
        return;
      }
      setStep(4);
      return;
    }

    // Step 4 - Final submission
    if (!formData.agreeTerms) {
      setFieldErrors({ agreeTerms: "You must agree to the terms" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Build registration payload with all fields
    const payload = {
      username: formData.email,
      password: formData.password,
      role: formData.accountType === "farmer" ? "Client" : "Expert",
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
    };

    // Include profile picture if uploaded
    if (profilePicturePreview) {
      payload.profile_picture = profilePicturePreview;
    }

    if (formData.accountType === "farmer") {
      payload.farm_name = formData.farmName;
      payload.location = formData.location;
      payload.farm_size = formData.farmSize ? `${formData.farmSize} hectares` : "";
      payload.primary_crops = Array.isArray(formData.primaryCrops) ? formData.primaryCrops.join(", ") : formData.primaryCrops;
      payload.meta = formData.farmSize ? `${formData.farmSize} hectares` : "Smallholder";
    } else {
      payload.meta = `${formData.specialty} — ${formData.experience} ${parseInt(formData.experience) === 1 ? 'year' : 'years'} experience`;
    }

    try {
      const res = await post("/api/v1/auth/register", payload);

      setIsLoading(false);

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.status === "ok") {
        setMessage({
          type: "success",
          text: `Welcome ${
            res.user.full_name || res.user.username
          }! Your account has been created. Redirecting to login...`,
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage({
          type: "error",
          text: "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      setIsLoading(false);
      setMessage({
        type: "error",
        text: "Network error. Please check if the server is running.",
      });
    }
  };

  const stepLabels = ["Account", "Personal", formData.accountType === "farmer" ? "Farm" : "Professional", "Profile"];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((num) => (
        <div key={num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-all duration-300 text-sm ${
                step >= num
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > num ? <i className="ri-check-line"></i> : num}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              step >= num ? "text-teal-600" : "text-gray-400"
            }`}>{stepLabels[num - 1]}</span>
          </div>
          {num < 4 && (
            <div
              className={`w-10 h-0.5 mx-1.5 transition-all duration-300 mb-4 ${
                step > num ? "bg-teal-600" : "bg-gray-200"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );

  const handleAccountTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, accountType: type }));
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Account Type
        </h2>
        <p className="text-gray-600">Select how you'll be using AgroMedicana</p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div
          onClick={() => handleAccountTypeSelect("farmer")}
          className={`p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer text-left ${
            formData.accountType === "farmer"
              ? "border-teal-600 bg-teal-50"
              : "border-gray-200 hover:border-teal-300"
          }`}
        >
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
            <i className="ri-plant-line text-2xl text-teal-600"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">I'm a Farmer</h3>
          <p className="text-sm text-gray-600">
            Get expert consultations and monitor your farm
          </p>
        </div>

        <div
          onClick={() => handleAccountTypeSelect("expert")}
          className={`p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer text-left ${
            formData.accountType === "expert"
              ? "border-teal-600 bg-teal-50"
              : "border-gray-200 hover:border-teal-300"
          }`}
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <i className="ri-user-star-line text-2xl text-emerald-600"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            I'm an Expert
          </h3>
          <p className="text-sm text-gray-600">
            Provide consultations and earn income
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep(2)}
        className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
      >
        <span>Continue</span>
        <i className="ri-arrow-right-line text-xl"></i>
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personal Information
        </h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      {/* Full Name */}
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="ri-user-line text-gray-400 text-lg"></i>
          </div>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
              fieldErrors.fullName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="John Doe"
          />
        </div>
        {fieldErrors.fullName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {fieldErrors.fullName}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="ri-mail-line text-gray-400 text-lg"></i>
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
              fieldErrors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="john@example.com"
          />
        </div>
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="ri-phone-line text-gray-400 text-lg"></i>
          </div>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
              fieldErrors.phone ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+263 123 456 789"
          />
        </div>
        {fieldErrors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {fieldErrors.phone}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="ri-lock-line text-gray-400 text-lg"></i>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
              fieldErrors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Create a strong password (min 6 chars)"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-0 bottom-0 right-0 pr-4 flex items-center cursor-pointer bg-transparent border-none"
          >
            <i
              className={`${
                showPassword ? "ri-eye-off-line" : "ri-eye-line"
              } text-gray-400 text-lg hover:text-gray-600`}
            ></i>
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="ri-lock-line text-gray-400 text-lg"></i>
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
              fieldErrors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute top-0 bottom-0 right-0 pr-4 flex items-center cursor-pointer bg-transparent border-none"
          >
            <i
              className={`${
                showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"
              } text-gray-400 text-lg hover:text-gray-600`}
            ></i>
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
          <span>Back</span>
        </button>
        <button
          type="submit"
          className="w-2/3 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          <span>Continue</span>
          <i className="ri-arrow-right-line text-xl"></i>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formData.accountType === "farmer"
            ? "Farm Details"
            : "Professional Details"}
        </h2>
        <p className="text-gray-600">
          {formData.accountType === "farmer"
            ? "Tell us about your farm"
            : "Share your expertise"}
        </p>
      </div>

      {formData.accountType === "farmer" ? (
        <>
          {/* Farm Name */}
          <div>
            <label
              htmlFor="farmName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Farm Name
            </label>
            <input
              type="text"
              id="farmName"
              name="farmName"
              value={formData.farmName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
              placeholder="Green Valley Farm"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm cursor-pointer"
            >
              <option value="">Select Province</option>
              <option value="Harare">Harare</option>
              <option value="Bulawayo">Bulawayo</option>
              <option value="Manicaland">Manicaland</option>
              <option value="Mashonaland Central">Mashonaland Central</option>
              <option value="Mashonaland East">Mashonaland East</option>
              <option value="Mashonaland West">Mashonaland West</option>
              <option value="Masvingo">Masvingo</option>
              <option value="Matabeleland North">Matabeleland North</option>
              <option value="Matabeleland South">Matabeleland South</option>
              <option value="Midlands">Midlands</option>
            </select>
          </div>

          {/* Farm Size */}
          <div>
            <label
              htmlFor="farmSize"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Farm Size (hectares)
            </label>
            <input
              type="number"
              id="farmSize"
              name="farmSize"
              value={formData.farmSize}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
              placeholder="50"
            />
          </div>
        </>
      ) : (
        <>
          {/* Specialty */}
          <div>
            <label
              htmlFor="specialty"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Specialty
            </label>
            <select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm cursor-pointer"
            >
              <option value="">Select Specialty</option>
              <option value="Veterinary Medicine">Veterinary Medicine</option>
              <option value="Agronomy & Crop Science">Agronomy &amp; Crop Science</option>
              <option value="Aquatic Specialist">Aquatic Specialist</option>
              <option value="Livestock Management">Livestock Management</option>
              <option value="Soil Science">Soil Science</option>
            </select>
          </div>

          {/* Experience */}
          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Years of Experience
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
              min="0"
              max="60"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
              placeholder="10"
            />
          </div>

          {/* Document Upload Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Verification Documents
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload documents for account verification (JPEG, PNG, or PDF - Max
              5MB each)
            </p>

            {/* National ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                National Identification <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {!documents.nationalId ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-teal-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-teal-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        National ID Card or Passport
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={(e) => handleFileUpload(e, "nationalId")}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-teal-50">
                    <div className="flex items-center space-x-3">
                      {documentPreviews.nationalId === "pdf" ? (
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <i className="ri-file-pdf-line text-2xl text-red-600"></i>
                        </div>
                      ) : (
                        <img
                          src={documentPreviews.nationalId}
                          alt="National ID Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                          {documents.nationalId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(documents.nationalId.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument("nationalId")}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Certificate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {!documents.professionalCertificate ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-teal-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-teal-600">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Degree, Diploma, or Professional License
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={(e) =>
                        handleFileUpload(e, "professionalCertificate")
                      }
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-teal-50">
                    <div className="flex items-center space-x-3">
                      {documentPreviews.professionalCertificate === "pdf" ? (
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <i className="ri-file-pdf-line text-2xl text-red-600"></i>
                        </div>
                      ) : (
                        <img
                          src={documentPreviews.professionalCertificate}
                          alt="Certificate Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                          {documents.professionalCertificate.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(
                            documents.professionalCertificate.size / 1024
                          ).toFixed(1)}{" "}
                          KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument("professionalCertificate")}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <i className="ri-information-line text-blue-500 text-lg mt-0.5"></i>
              <p className="text-xs text-blue-700">
                Your documents will be reviewed within 24-48 hours. You'll
                receive a notification once your account is verified.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
          <span>Back</span>
        </button>
        <button
          type="submit"
          className="w-2/3 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          <span>Continue</span>
          <i className="ri-arrow-right-line text-xl"></i>
        </button>
      </div>
    </div>
  );

  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage({ type: "error", text: "Please upload a valid image (JPEG, PNG, or WebP)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should not exceed 5MB" });
      return;
    }
    setProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicturePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const activitiesRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activitiesRef.current && !activitiesRef.current.contains(e.target)) {
        setActivitiesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activityOptions = [
    { value: "Crop Farming", icon: "ri-plant-line" },
    { value: "Livestock", icon: "ri-service-line" },
    { value: "Aquaculture", icon: "ri-water-flash-line" },
    { value: "Poultry", icon: "ri-twitter-line" },
    { value: "Horticulture", icon: "ri-seedling-line" },
    { value: "Dairy Farming", icon: "ri-cup-line" },
  ];

  const toggleActivity = (value) => {
    setFormData((prev) => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(value)
        ? prev.primaryCrops.filter((c) => c !== value)
        : [...prev.primaryCrops, value],
    }));
  };

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">Add a photo and select your farming activities</p>
      </div>

      {/* Profile Picture */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-teal-100 shadow-lg bg-gray-100">
            {profilePicturePreview ? (
              <img
                src={profilePicturePreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
                <i className="ri-user-3-line text-3xl text-teal-300"></i>
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-teal-700 transition-all group-hover:scale-110">
            <i className="ri-camera-line text-white text-sm"></i>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleProfilePicture}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {profilePicture ? profilePicture.name : "Upload a profile photo (optional)"}
        </p>
        {profilePicture && (
          <button
            type="button"
            onClick={() => { setProfilePicture(null); setProfilePicturePreview(null); }}
            className="text-xs text-red-500 hover:text-red-600 mt-1 flex items-center gap-1"
          >
            <i className="ri-close-line"></i> Remove
          </button>
        )}
      </div>

      {/* Primary Activities - for farmers */}
      {formData.accountType === "farmer" && (
        <div className="relative" ref={activitiesRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Activities
            <span className="text-gray-400 font-normal ml-1">(select all that apply)</span>
          </label>

          {/* Dropdown trigger */}
          <button
            type="button"
            onClick={() => setActivitiesOpen(!activitiesOpen)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left text-sm flex items-center justify-between focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer"
          >
            <span className={formData.primaryCrops.length > 0 ? "text-gray-900" : "text-gray-400"}>
              {formData.primaryCrops.length > 0
                ? `${formData.primaryCrops.length} activit${formData.primaryCrops.length === 1 ? "y" : "ies"} selected`
                : "Select your farming activities"}
            </span>
            <i className={`ri-arrow-down-s-line text-gray-400 transition-transform duration-200 ${activitiesOpen ? "rotate-180" : ""}`}></i>
          </button>

          {/* Selected tags */}
          {formData.primaryCrops.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.primaryCrops.map((crop) => (
                <span
                  key={crop}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200"
                >
                  {crop}
                  <button
                    type="button"
                    onClick={() => toggleActivity(crop)}
                    className="hover:text-teal-900 transition-colors"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown menu */}
          {activitiesOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {activityOptions.map((item) => {
                const isSelected = formData.primaryCrops.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleActivity(item.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-teal-50 text-teal-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <i className={`${item.icon} text-base`}></i>
                    <span className="flex-1 text-left font-medium">{item.value}</span>
                    {isSelected && <i className="ri-checkbox-circle-fill text-teal-600"></i>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            required
            className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer mt-0.5"
          />
          <span className="text-sm text-gray-700">
            I agree to the{" "}
            <a href="#" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap">Privacy Policy</a>
          </span>
        </label>
        {fieldErrors.agreeTerms && (
          <p className="text-red-500 text-xs mt-1 ml-8">{fieldErrors.agreeTerms}</p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-600 border border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="w-1/3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
          <span>Back</span>
        </button>
        <button
          type="submit"
          disabled={
            isLoading ||
            !formData.agreeTerms ||
            (formData.accountType === "expert" &&
              (!documents.nationalId || !documents.professionalCertificate))
          }
          className="w-2/3 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
        >
          {isLoading ? (
            <>
              <i className="ri-loader-4-line animate-spin text-xl"></i>
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <i className="ri-check-line text-xl"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-layout">
      {/* Left Side - Form */}
      <div className="auth-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center justify-center mb-12"
          >
            <img
              src="https://static.readdy.ai/image/0ebd024b434f6780d5e4c676403a4d8b/c5e6b58d97f288c6fd098b1417131a6c.jpeg"
              alt="AgroMedicana"
              className="w-20 h-20 object-contain mb-4 rounded-full"
            />
            <h1 className="text-3xl font-bold text-gray-900">AgroMedicana</h1>
          </motion.div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
              </motion.div>
            </AnimatePresence>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-teal-600 hover:text-teal-700 cursor-pointer whitespace-nowrap"
            >
              Sign In
            </Link>
          </p>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-1 mx-auto cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Back to Home</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Slideshow */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-teal-50 to-emerald-50 overflow-y-auto">
        <div className="w-full min-h-full flex items-start justify-center p-12 pt-16">
          <div className="max-w-2xl w-full">
            {/* Slideshow Container */}
            <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl h-80">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-0 right-0 px-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{slide.title}</h3>
                    <p className="text-white/90 text-sm">{slide.description}</p>
                  </div>
                </div>
              ))}

              {/* Slide Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentSlide
                        ? "bg-white w-4"
                        : "bg-white/50 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Join Our Community
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Connect with thousands of farmers and agricultural experts
                across Zimbabwe.
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3 bg-white rounded-xl p-3 shadow-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-xl text-teal-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Expert Consultations
                    </h3>
                    <p className="text-xs text-gray-600">
                      Connect with verified agricultural professionals
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white rounded-xl p-3 shadow-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-xl text-teal-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Smart Monitoring
                    </h3>
                    <p className="text-xs text-gray-600">
                      Track your farm data in real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white rounded-xl p-3 shadow-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-xl text-teal-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Affordable Pricing
                    </h3>
                    <p className="text-xs text-gray-600">
                      Special rates for Zimbabwean farmers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
