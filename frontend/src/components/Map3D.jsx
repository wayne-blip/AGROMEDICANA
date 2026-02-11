import React, { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Set Cesium Ion default access token (free tier)
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc1MzAsImlhdCI6MTYyMjY0NDE5OH0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk";

export default function Map3D({ lat, lng, loaded, error }) {
  const cesiumContainer = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!cesiumContainer.current || !loaded) return;

    // Create Cesium Viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: Cesium.createWorldTerrain(),
      animation: false,
      timeline: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      geocoder: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: document.createElement("div"), // Hide credits
    });

    viewerRef.current = viewer;

    // Enable 3D terrain
    viewer.scene.globe.enableLighting = true;

    // Fly to user's location
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 1500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2,
    });

    // Add a marker at user's location
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat),
      point: {
        pixelSize: 15,
        color: Cesium.Color.fromCssColorString("#14b8a6"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: "Your Farm",
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });

    // Cleanup
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, [lat, lng, loaded]);

  if (!loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <i className="ri-loader-4-line text-3xl text-teal-600 animate-spin"></i>
          <p className="mt-2 text-sm text-gray-600">Loading 3D Map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <i className="ri-map-pin-line text-3xl text-orange-500"></i>
          <p className="mt-2 text-sm text-gray-600">Could not get location</p>
          <p className="text-xs text-gray-400">Using default location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={cesiumContainer} className="w-full h-full" />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-medium text-gray-700 flex items-center gap-1">
        <i className="ri-map-pin-2-fill text-teal-600"></i>
        3D View
      </div>
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs text-gray-600">
        <p className="font-medium text-gray-800">Controls:</p>
        <p>🖱️ Drag to rotate • Scroll to zoom</p>
        <p>Right-click drag to tilt</p>
      </div>
    </div>
  );
}
