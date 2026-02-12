import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp, SlideRight, SlideLeft, StaggerContainer, StaggerItem, AnimatedCounter, ScaleUp } from "../components/animations";

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroImages = [
    {
      url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80",
      alt: "Crop Fields - Agriculture",
    },
    {
      url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1920&q=80",
      alt: "Goats - Livestock Farming",
    },
    {
      url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1920&q=80",
      alt: "Fish Farming - Aquaculture",
    },
    {
      url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80",
      alt: "Cattle Farming - Livestock",
    },
    {
      url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80",
      alt: "Vegetable Farming - Horticulture",
    },
    {
      url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1920&q=80",
      alt: "Poultry Farming - Chickens",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Slideshow effect with visibility handling
  useEffect(() => {
    let intervalId = null;

    const startSlideshow = () => {
      // Clear any existing interval first
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      }, 5000);
    };

    const stopSlideshow = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSlideshow();
      } else {
        startSlideshow();
      }
    };

    // Only start if page is visible
    if (!document.hidden) {
      startSlideshow();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopSlideshow();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [heroImages.length]);

  const features = [
    {
      icon: "ri-chat-3-line",
      title: "Secure In-App Consultations",
      description:
        "Connect instantly with veterinarians, agronomists, and aquatic specialists through our secure in-app messaging from anywhere in Zimbabwe.",
    },
    {
      icon: "ri-dashboard-line",
      title: "Smart Farm Monitoring",
      description:
        "Track soil moisture, temperature, pH levels, and crop health with real-time sensor data and AI-powered insights for better decision-making.",
    },
    {
      icon: "ri-money-dollar-circle-line",
      title: "Affordable Pricing",
      description:
        "Access expert agricultural advice at discounted rates with flexible subscription plans designed specifically for Zimbabwean farmers.",
    },
    {
      icon: "ri-cloud-line",
      title: "Cloud-Based Platform",
      description:
        "Secure, scalable cloud infrastructure ensures your farm data is always accessible, protected, and backed up with 99.9% uptime.",
    },
    {
      icon: "ri-line-chart-line",
      title: "Data-Driven Insights",
      description:
        "Leverage advanced analytics and AI to optimize crop yields, prevent diseases, and make informed farming decisions based on real data.",
    },
    {
      icon: "ri-community-line",
      title: "Community Knowledge Sharing",
      description:
        "Join a growing community of farmers sharing best practices, success stories, and sustainable agricultural techniques across Zimbabwe.",
    },
  ];

  const experts = [
    {
      name: "Dr. Sarah Moyo",
      specialty: "Veterinary Medicine",
      image:
        "https://readdy.ai/api/search-image?query=professional%20african%20woman%20veterinarian%20doctor%20in%20white%20medical%20coat%20smiling%20warmly%20with%20stethoscope%20around%20neck%20standing%20confidently%20in%20veterinary%20clinic%20with%20soft%20natural%20lighting%20clean%20simple%20medical%20background&width=200&height=200&seq=expert-sarah-moyo-vet&orientation=squarish",
      rating: 4.9,
      consultations: 156,
    },
    {
      name: "Prof. James Ndlovu",
      specialty: "Agronomy & Crop Science",
      image:
        "https://readdy.ai/api/search-image?query=distinguished%20african%20male%20agronomist%20professor%20in%20professional%20attire%20with%20glasses%20examining%20crop%20plant%20samples%20in%20agricultural%20research%20laboratory%20warm%20professional%20lighting%20simple%20clean%20background&width=200&height=200&seq=expert-james-ndlovu-agro&orientation=squarish",
      rating: 4.8,
      consultations: 203,
    },
    {
      name: "Dr. Tendai Chikwanha",
      specialty: "Aquatic Specialist",
      image:
        "https://readdy.ai/api/search-image?query=professional%20african%20aquatic%20specialist%20in%20outdoor%20work%20attire%20standing%20near%20fish%20farming%20pond%20with%20clipboard%20smiling%20confidently%20bright%20natural%20daylight%20simple%20clean%20background&width=200&height=200&seq=expert-tendai-aqua&orientation=squarish",
      rating: 4.9,
      consultations: 98,
    },
  ];

  const testimonials = [
    {
      name: "John Moyo",
      location: "Harare",
      image:
        "https://readdy.ai/api/search-image?query=African%20farmer%20portrait%20professional%20headshot%20smiling%20confident%20male%20wearing%20casual%20shirt%20against%20neutral%20background&width=100&height=100&seq=client1zim&orientation=squarish",
      text: "AgroMedicana transformed my farming business. Within three months of using their expert consultations and monitoring system, my maize and bean yields increased by 45%. The real-time advice saved my entire harvest from pest damage.",
    },
    {
      name: "Mary Ncube",
      location: "Bulawayo",
      image:
        "https://readdy.ai/api/search-image?query=African%20female%20farmer%20portrait%20professional%20headshot%20smiling%20confident%20woman%20wearing%20traditional%20attire%20against%20neutral%20background&width=100&height=100&seq=client2zim&orientation=squarish",
      text: "As a small-scale farmer, I never thought I could afford expert agricultural advice. AgroMedicana made it possible with their affordable pricing. The crop consultations helped me optimize my 12-hectare wheat and barley farm.",
    },
    {
      name: "Peter Chikwanha",
      location: "Mutare",
      image:
        "https://readdy.ai/api/search-image?query=African%20male%20farmer%20portrait%20professional%20headshot%20smiling%20middle%20aged%20man%20wearing%20plaid%20shirt%20against%20neutral%20background&width=100&height=100&seq=client3zim&orientation=squarish",
      text: "The soil specialist helped me optimize my rice and sugarcane operation. The expert guidance on irrigation and nutrient management increased my production by 60%. This platform is a game-changer for Zimbabwean agriculture.",
    },
  ];

  const stats = [
    { number: "5,000+", label: "Active Farmers" },
    { number: "150+", label: "Verified Experts" },
    { number: "25,000+", label: "Consultations Completed" },
    { number: "98%", label: "Satisfaction Rate" },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$15",
      period: "/month",
      features: [
        "2 expert consultations per month",
        "Basic farm monitoring",
        "Weather updates",
        "Community access",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "$35",
      period: "/month",
      features: [
        "6 expert consultations per month",
        "Advanced farm monitoring",
        "Real-time sensor integration",
        "AI-powered insights",
        "Priority support",
        "Expert reports",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$75",
      period: "/month",
      features: [
        "Unlimited consultations",
        "Full IoT device integration",
        "Custom analytics dashboard",
        "Dedicated account manager",
        "24/7 priority support",
        "Training sessions",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div
                className={`overflow-hidden rounded-xl transition-all duration-300 ${
                  scrolled
                    ? "bg-white shadow-md ring-1 ring-gray-100"
                    : "bg-white/95 shadow-lg"
                }`}
              >
                <img
                  src="/logo.png"
                  alt="AgroMedicana"
                  className="w-14 h-14 object-cover"
                />
              </div>
              <span
                className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Agro
                <span
                  className={`${scrolled ? "text-teal-600" : "text-teal-300"}`}
                >
                  Medicana
                </span>
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a
                href="#features"
                className={`text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap cursor-pointer ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Features
              </a>
              <a
                href="#experts"
                className={`text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap cursor-pointer ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Our Experts
              </a>
              <a
                href="#testimonials"
                className={`text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap cursor-pointer ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className={`text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap cursor-pointer ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Pricing
              </a>
              <Link
                to="/login"
                className={`text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap ${
                  scrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i
                className={`${mobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              ></i>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className={`pb-4 flex flex-col gap-2 ${scrolled ? 'text-gray-700' : 'text-white'}`}>
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 text-sm font-medium hover:text-teal-600 transition-colors rounded">Features</a>
                  <a href="#experts" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 text-sm font-medium hover:text-teal-600 transition-colors rounded">Our Experts</a>
                  <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 text-sm font-medium hover:text-teal-600 transition-colors rounded">Testimonials</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 text-sm font-medium hover:text-teal-600 transition-colors rounded">Pricing</a>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 text-sm font-medium hover:text-teal-600 transition-colors rounded">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="mt-1 px-4 py-2.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-medium text-center">Get Started</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Slideshow Background */}
        <div className="absolute inset-0 w-full h-full">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-6 text-center w-full py-24">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Revolutionizing Agriculture
            <br />
            Through AgroMedicana
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Connect with Veterinarians, Agronomists, and Aquatic Specialists in
            real-time. Monitor your farm with smart sensors. Make data-driven
            decisions for sustainable growth.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Link
              to="/register"
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
            >
              Start Free Trial
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="flex flex-wrap justify-center gap-8 mt-12 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center min-w-[120px]">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={stat.number} duration={2} />
                </div>
                <div className="text-xs md:text-sm text-white/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <FadeUp className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform your agricultural operations with
              cutting-edge technology and expert guidance
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                    <i className={`${feature.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Experts Section */}
      <section id="experts" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <FadeUp className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Meet Our Expert Team
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Verified agricultural professionals ready to help you succeed with
              personalized consultations and proven expertise
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-8" stagger={0.15}>
            {experts.map((expert, index) => (
              <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.12)" }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="w-full h-80 bg-gray-100">
                  <img
                    src={expert.image}
                    alt={expert.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {expert.name}
                  </h3>
                  <p className="text-teal-600 font-medium mb-4">
                    {expert.specialty}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <i className="ri-star-fill text-yellow-400"></i>
                      <span className="font-semibold">{expert.rating}</span>
                    </div>
                    <div>{expert.consultations} consultations</div>
                  </div>
                </div>
              </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <FadeUp className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              How AgroMedicana Works
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Get started in minutes and transform your farming operations with
              expert guidance
            </p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" stagger={0.15} delayStart={0.2}>
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Sign up and set up your farm profile with location, crops, and livestock details",
                icon: "ri-user-add-line",
              },
              {
                step: "02",
                title: "Connect Sensors",
                desc: "Link your IoT devices or manually input farm data for real-time monitoring",
                icon: "ri-sensor-line",
              },
              {
                step: "03",
                title: "Book Consultation",
                desc: "Choose an expert and schedule secure in-app consultations at discounted rates",
                icon: "ri-calendar-check-line",
              },
              {
                step: "04",
                title: "Get Expert Advice",
                desc: "Receive personalized recommendations and track improvements with analytics",
                icon: "ri-lightbulb-line",
              },
            ].map((item, index) => (
              <StaggerItem key={index}>
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <i className={`${item.icon} text-white text-2xl`}></i>
                  </motion.div>
                  <div className="text-teal-600 font-bold text-sm mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <FadeUp className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Success Stories from Zimbabwean Farmers
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Real results from farmers who transformed their operations with
              AgroMedicana
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-6" stagger={0.12}>
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-50 rounded-lg p-5 border border-gray-100 h-full"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className="ri-star-fill text-yellow-400 text-sm"
                    ></i>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {testimonial.text}
                </p>
              </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          <FadeUp className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Affordable Plans for Every Farmer
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your farming needs with special
              discounts for Zimbabwean farmers
            </p>
          </FadeUp>

          <StaggerContainer className="grid md:grid-cols-3 gap-5" stagger={0.12}>
            {pricingPlans.map((plan, index) => (
              <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.25 }}
                className={`bg-white rounded-lg p-5 ${
                  plan.popular
                    ? "ring-2 ring-teal-600 shadow-lg"
                    : "shadow-sm border border-gray-100"
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <i className="ri-check-line text-teal-600 text-base flex-shrink-0 mt-0.5"></i>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-lg font-semibold transition-colors whitespace-nowrap text-center ${
                    plan.popular
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-emerald-700 overflow-hidden">
        <ScaleUp className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-base text-white/90 mb-6 leading-relaxed">
            Join thousands of Zimbabwean farmers already using AgroMedicana to
            increase yields, reduce costs, and build sustainable agricultural
            practices.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="inline-block px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition-all text-sm font-bold shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Start Your Free Trial Today
            </Link>
          </motion.div>
        </ScaleUp>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <FadeUp className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="overflow-hidden rounded-xl bg-white shadow-md">
                  <img
                    src="/logo.png"
                    alt="AgroMedicana"
                    className="w-12 h-12 object-cover"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Agro<span className="text-teal-400">Medicana</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Empowering Zimbabwean farmers with expert agricultural
                telemedicine and smart farming solutions.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-base mb-3">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#experts"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Our Experts
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-3">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    API Docs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-3">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">Harare, Zimbabwe</li>
                <li>
                  <a
                    href="mailto:info@agromedicana.co.zw"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    info@agromedicana.co.zw
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+263123456789"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    +263 123 456 789
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-xs mb-3 md:mb-0">
              © 2025 AgroMedicana. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="ri-facebook-fill text-lg"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="ri-twitter-fill text-lg"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="ri-linkedin-fill text-lg"></i>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="ri-instagram-line text-lg"></i>
              </a>
            </div>
          </div>
        </FadeUp>
      </footer>
    </div>
  );
}
