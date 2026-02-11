import React from "react";
import { motion } from "framer-motion";

export default function DeviceCard({ device }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} whileHover={{ y: -3 }} className="card w-full">
      <h3 className="font-semibold">{device.name}</h3>
      <div className="text-sm mt-2 device-readings">
        {device.type === "soil" && (
          <div>
            <div>Soil Moisture: {device.readings.soil_moisture_pct}%</div>
            <div>Temp: {device.readings.temp_c}°C</div>
            <div>pH: {device.readings.ph}</div>
          </div>
        )}
        {device.type === "aquaculture" && (
          <div>
            <div>
              Dissolved Oxygen: {device.readings.dissolved_oxygen_mg_l} mg/L
            </div>
            <div>Temp: {device.readings.temp_c}°C</div>
            <div>pH: {device.readings.ph}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
