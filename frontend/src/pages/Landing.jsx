import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in">
            Zimbabwe's Leading Agricultural Health Platform
          </h1>
          <p className="hero-subtitle animate-fade-in-delay">
            Comprehensive telemedicine for animal, plant, and aquatic health.
            Real-time monitoring, expert consultations, and AI-powered insights
            to enhance food security and sustainable agriculture.
          </p>
          <div className="hero-cta animate-fade-in-delay-2">
            <Link to="/register" className="btn-hero primary">
              Start Your Journey
            </Link>
            <Link to="/login" className="btn-hero outline">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hero-features animate-slide-up">
          <div className="feature-card">
            <div className="feature-icon">🐄</div>
            <h3>Animal Health</h3>
            <p>
              Livestock health management, disease prevention, and expert
              veterinary consultations
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌾</div>
            <h3>Plant Health</h3>
            <p>
              Crop disease identification, soil health analysis, and agronomist
              support
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🐟</div>
            <h3>Aquatic Health</h3>
            <p>
              Real-time water quality monitoring, fish management, and
              aquaculture expertise
            </p>
          </div>
        </div>
      </div>

      <div className="mission-section animate-fade-in-delay-3">
        <h3 className="mission-title">
          Empowering Zimbabwe's Agricultural Future
        </h3>
        <div className="mission-grid">
          <div className="mission-card">
            <div className="mission-icon">📊</div>
            <h4>Real-time Monitoring</h4>
            <p>
              SoilSense Pro & AquaMonitor 5000 devices track pH, temperature,
              dissolved oxygen, and more
            </p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">🤖</div>
            <h4>AI-Powered Insights</h4>
            <p>
              Machine learning algorithms provide disease alerts and
              personalized recommendations
            </p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">👨‍🌾</div>
            <h4>Expert Access</h4>
            <p>
              Connect with qualified veterinarians, agronomists, and aquaculture
              specialists
            </p>
          </div>
          <div className="mission-card">
            <div className="mission-icon">🌍</div>
            <h4>Sustainable Practices</h4>
            <p>
              Enhance food security, economic resilience, and ecological health
            </p>
          </div>
        </div>
      </div>

      <div className="demo-section animate-fade-in-delay-3">
        <div className="demo-card">
          <h3>Try Demo Account</h3>
          <p className="demo-desc">
            Experience the platform as a small-scale farmer
          </p>
          <p>
            Username: <strong>client1</strong>
          </p>
          <p>
            Password: <strong>password</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
