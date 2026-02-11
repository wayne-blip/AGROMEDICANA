import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// WMO Weather codes → condition + icon
const WMO_CODES = {
  0: { label: "Clear Sky", icon: "ri-sun-line" },
  1: { label: "Mainly Clear", icon: "ri-sun-line" },
  2: { label: "Partly Cloudy", icon: "ri-sun-cloudy-line" },
  3: { label: "Overcast", icon: "ri-cloudy-line" },
  45: { label: "Foggy", icon: "ri-mist-line" },
  48: { label: "Rime Fog", icon: "ri-mist-line" },
  51: { label: "Light Drizzle", icon: "ri-drizzle-line" },
  53: { label: "Drizzle", icon: "ri-drizzle-line" },
  55: { label: "Dense Drizzle", icon: "ri-drizzle-line" },
  61: { label: "Light Rain", icon: "ri-showers-line" },
  63: { label: "Rain", icon: "ri-rainy-line" },
  65: { label: "Heavy Rain", icon: "ri-heavy-showers-line" },
  71: { label: "Light Snow", icon: "ri-snowy-line" },
  73: { label: "Snow", icon: "ri-snowy-line" },
  75: { label: "Heavy Snow", icon: "ri-snowy-line" },
  80: { label: "Rain Showers", icon: "ri-showers-line" },
  81: { label: "Moderate Showers", icon: "ri-showers-line" },
  82: { label: "Violent Showers", icon: "ri-heavy-showers-line" },
  95: { label: "Thunderstorm", icon: "ri-thunderstorms-line" },
  96: { label: "Thunderstorm + Hail", icon: "ri-thunderstorms-line" },
  99: { label: "Severe Thunderstorm", icon: "ri-thunderstorms-line" },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: "Partly Cloudy", icon: "ri-sun-cloudy-line" };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: "--",
    condition: "Loading...",
    humidity: "--",
    wind: "--",
    rain: "--",
    icon: "ri-sun-cloudy-line",
    location: "Locating...",
  });
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      // 1. Get user's actual position via browser geolocation
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        })
      );
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // 2. Reverse geocode for location name
      let placeName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
        );
        const geoData = await geoRes.json();
        const addr = geoData.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || "";
        const country = addr.country || "";
        if (city) placeName = country ? `${city}, ${country}` : city;
      } catch {
        // keep coordinate fallback
      }

      // 3. Fetch real-time weather from Open-Meteo (free, no key)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
          `&daily=precipitation_probability_max&timezone=auto&forecast_days=1`
      );
      const data = await res.json();

      if (data.current) {
        const info = getWeatherInfo(data.current.weather_code);
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: info.label,
          humidity: Math.round(data.current.relative_humidity_2m),
          wind: Math.round(data.current.wind_speed_10m),
          rain: data.daily?.precipitation_probability_max?.[0] ?? 0,
          icon: info.icon,
          location: placeName,
        });
      }
    } catch (err) {
      console.error("Weather fetch failed:", err);
      setWeather((prev) => ({ ...prev, location: "Location unavailable" }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      {/* Gentle floating particle */}
      <div className="absolute top-4 right-20 w-2 h-2 bg-white/20 rounded-full animate-float"></div>
      <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/15 rounded-full animate-float-delayed"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1 flex items-center gap-1.5">
              <i className="ri-map-pin-2-fill text-xs"></i>
              {weather.location}
            </p>
            <p className="text-4xl font-bold tracking-tight">
              {weather.temp}°C
            </p>
          </div>
          <div className="w-14 h-14 flex items-center justify-center relative">
            <i className={`${weather.icon} text-4xl animate-gentle-pulse`}></i>
          </div>
        </div>

        <p className="text-sm opacity-80 mb-4 font-medium">
          {weather.condition}
        </p>

        <div className="flex justify-between pt-4 border-t border-white/20">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <i className="ri-drop-fill text-xs opacity-70"></i>
              <p className="text-xs opacity-70 font-medium">Humidity</p>
            </div>
            <p className="text-sm font-semibold">{weather.humidity}%</p>
          </div>
          <div className="text-center flex-1 border-x border-white/10">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <i className="ri-windy-fill text-xs opacity-70"></i>
              <p className="text-xs opacity-70 font-medium">Wind</p>
            </div>
            <p className="text-sm font-semibold">{weather.wind} km/h</p>
          </div>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <i className="ri-showers-fill text-xs opacity-70"></i>
              <p className="text-xs opacity-70 font-medium">Rain</p>
            </div>
            <p className="text-sm font-semibold">{weather.rain}%</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.9; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-8px) translateX(4px); opacity: 0.4; }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          50% { transform: translateY(-6px) translateX(-3px); opacity: 0.3; }
        }
        .animate-gentle-pulse { animation: gentle-pulse 3s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite 2s; }
      `}</style>
    </motion.div>
  );
}
