"""
AI/diagnostic stub for prototype.
Contains MOCK sensor readings and simple rule checks.
"""

MOCK_DEVICES = [
    {
        'id': 1,
        'name': 'SoilSense Pro',
        'type': 'soil',
        'readings': {
            'soil_moisture_pct': 38,
            'temp_c': 24,
            'ph': 6.5,
        }
    },
    {
        'id': 2,
        'name': 'AquaMonitor 5000',
        'type': 'aquaculture',
        'readings': {
            'dissolved_oxygen_mg_l': 2.1,
            'temp_c': 26,
            'ph': 7.2,
        }
    }
]


def analyze_devices():
    """Analyze the mock devices and produce alerts.

    Returns (devices, alert_text)
    """
    alert = None
    # Simple rule: dissolved oxygen < 4.0 -> critical
    for d in MOCK_DEVICES:
        if d.get('type') == 'aquaculture':
            do_val = d['readings'].get('dissolved_oxygen_mg_l')
            if do_val is not None and do_val < 4.0:
                alert = "CRITICAL: Low Dissolved Oxygen in Fish Pond #1. Immediate action required to prevent fish mortality."
                break

    return MOCK_DEVICES, alert


def diagnose_image(image_url: str):
    """AI stub for diagnosing an image. Always returns a static simulated response."""
    return {
        'status': 'success',
        'diagnosis': 'Simulated analysis: No immediate disease detected.'
    }
