import React, { useState, useEffect } from "react";
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

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop",
      title: "Smart Farm Management",
      description: "Monitor your crops with real-time data and expert insights",
    },
    {
      image:
        "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&h=600&fit=crop",
      title: "Livestock Health Monitoring",
      description: "Expert veterinary care for your cattle and livestock",
    },
    {
      image:
        "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=600&fit=crop",
      title: "Crop Health & Growth",
      description: "Maximize yields with data-driven crop management",
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
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Clear general error
    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await post("/api/v1/auth/login", {
        username: formData.email,
        password: formData.password,
      });

      if (response.error) {
        setError(response.error);
      } else {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        window.dispatchEvent(new Event("storage"));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message && err.message.includes("Failed to fetch")) {
        setError("Cannot connect to the server. Please make sure the backend is running.");
      } else {
        setError("Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="auth-layout">
      {/* Left Side - Form */}
      <div className="auth-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center mb-8"
          >
            <img
              src="https://static.readdy.ai/image/0ebd024b434f6780d5e4c676403a4d8b/c5e6b58d97f288c6fd098b1417131a6c.jpeg"
              alt="AgroMedicana"
              className="w-20 h-20 object-contain mb-4 rounded-full"
            />
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">
              Sign in to your AgroMedicana account
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
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
                  autoComplete="off"
                  className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
                    fieldErrors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
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
                  autoComplete="new-password"
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm ${
                    fieldErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  <i
                    className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-teal-600 hover:text-teal-700 whitespace-nowrap"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-xl"></i>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="ri-arrow-right-line text-xl"></i>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="auth-social">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="social-btn group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-teal-700">
                  Google
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                className="social-btn group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-teal-700">
                  Facebook
                </span>
              </button>
            </div>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-teal-600 hover:text-teal-700 cursor-pointer whitespace-nowrap"
            >
              Create Account
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
      <div className="auth-right">
        <div className="auth-right-inner">
          {/* Slideshow Container */}
          <div className="slideshow-box">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`slide ${index === currentSlide ? "active" : ""}`}
              >
                <img src={slide.image} alt={slide.title} />
                <div className="slide-overlay"></div>
                <div className="slide-text">
                  <h3>{slide.title}</h3>
                  <p>{slide.description}</p>
                </div>
              </div>
            ))}

            {/* Slide Indicators */}
            <div className="slide-indicators">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`indicator ${
                    index === currentSlide ? "active" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-center animate-slide-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Farm, Smarter
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Access expert consultations, monitor your farm in real-time, and
              make data-driven decisions to maximize your agricultural success.
            </p>

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">5,000+</div>
                <div className="stat-label">Active Farmers</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">150+</div>
                <div className="stat-label">Expert Advisors</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">98%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
