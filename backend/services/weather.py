"""
Module 05: Weather Intelligence Service
Provides reliable read-only weather data and seasonal agro-meteorological advisories.
Data Source: Open-Meteo Public API (CC-BY 4.0 Attribution) with local cached fallback.
Integrates with Farm Project Manager scheduling views as a read-only reference.
STRICT RULE: Weather forecasts NEVER automatically cancel confirmed bookings.
"""
import time
import json
import urllib.request
import urllib.error
from django.core.cache import cache
from django.utils import timezone

# Cache timeout: 1 hour (3600 seconds)
WEATHER_CACHE_TTL = 3600

DEFAULT_COORDINATES = {
    'latitude': 28.9845,
    'longitude': 77.7064,
    'district': 'Meerut',
    'state': 'Uttar Pradesh'
}

def get_weather_forecast(latitude=None, longitude=None, district='Meerut'):
    """
    Fetches real-time weather and 3-day forecast with graceful offline fallback.
    """
    try:
        lat = float(latitude) if latitude else DEFAULT_COORDINATES['latitude']
        lon = float(longitude) if longitude else DEFAULT_COORDINATES['longitude']
    except (ValueError, TypeError):
        lat = DEFAULT_COORDINATES['latitude']
        lon = DEFAULT_COORDINATES['longitude']

    cache_key = f"weather_forecast_{lat:.2f}_{lon:.2f}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&"
        f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&"
        f"timezone=Asia%2FKolkata&forecast_days=3"
    )

    now_iso = timezone.now().isoformat()

    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'KrishiSeva-Agritech-Platform/1.0 (Public Agro-Advisory)'}
        )
        with urllib.request.urlopen(req, timeout=3.0) as response:
            if response.status == 200:
                raw_json = json.loads(response.read().decode('utf-8'))
                current = raw_json.get('current', {})
                daily = raw_json.get('daily', {})

                weather_code = current.get('weather_code', 0)
                condition_en, condition_hi = map_weather_code(weather_code)

                forecast_days = []
                dates = daily.get('time', [])
                t_max = daily.get('temperature_2m_max', [])
                t_min = daily.get('temperature_2m_min', [])
                p_sum = daily.get('precipitation_sum', [])
                w_codes = daily.get('weather_code', [])

                for i in range(len(dates)):
                    c_en, c_hi = map_weather_code(w_codes[i] if i < len(w_codes) else 0)
                    forecast_days.append({
                        'date': dates[i],
                        'temp_max': t_max[i] if i < len(t_max) else None,
                        'temp_min': t_min[i] if i < len(t_min) else None,
                        'precipitation_mm': p_sum[i] if i < len(p_sum) else 0.0,
                        'condition_en': c_en,
                        'condition_hi': c_hi
                    })

                result = {
                    'status': 'live_data',
                    'is_live': True,
                    'location': {
                        'district': district,
                        'latitude': lat,
                        'longitude': lon
                    },
                    'current': {
                        'temperature_c': current.get('temperature_2m'),
                        'humidity_percent': current.get('relative_humidity_2m'),
                        'precipitation_mm': current.get('precipitation', 0.0),
                        'wind_speed_kmh': current.get('wind_speed_10m'),
                        'condition_en': condition_en,
                        'condition_hi': condition_hi
                    },
                    'forecast_3_day': forecast_days,
                    'agro_advisory_en': generate_agro_advisory(condition_en, current.get('precipitation', 0.0), 'en'),
                    'agro_advisory_hi': generate_agro_advisory(condition_en, current.get('precipitation', 0.0), 'hi'),
                    'data_timestamp': now_iso,
                    'attribution': 'Open-Meteo & IMD Agro-Meteorological Public Reference (CC-BY 4.0)',
                    'data_freshness': 'Live cached query',
                    'booking_policy': 'Read-only agricultural advisory. Weather forecasts do not automatically cancel confirmed bookings.'
                }

                cache.set(cache_key, result, timeout=WEATHER_CACHE_TTL)
                return result

    except Exception:
        # Fallback offline state when network is unavailable
        pass

    # Clean Fallback State (No fake random numbers; clear indicators)
    return {
        'status': 'offline_fallback',
        'is_live': False,
        'location': {
            'district': district,
            'latitude': lat,
            'longitude': lon
        },
        'current': {
            'temperature_c': 24.0,
            'humidity_percent': 60,
            'precipitation_mm': 0.0,
            'wind_speed_kmh': 8.5,
            'condition_en': 'Partly Cloudy (Seasonal Benchmark)',
            'condition_hi': 'आंशिक रूप से बादल (मौसमी मानक)'
        },
        'forecast_3_day': [
            {'date': 'Day 1', 'temp_max': 26.0, 'temp_min': 14.0, 'precipitation_mm': 0.0, 'condition_en': 'Clear', 'condition_hi': 'साफ'},
            {'date': 'Day 2', 'temp_max': 27.0, 'temp_min': 15.0, 'precipitation_mm': 0.0, 'condition_en': 'Clear', 'condition_hi': 'साफ'},
            {'date': 'Day 3', 'temp_max': 26.5, 'temp_min': 14.5, 'precipitation_mm': 0.0, 'condition_en': 'Partly Cloudy', 'condition_hi': 'आंशिक बादल'}
        ],
        'agro_advisory_en': 'Weather conditions are generally favorable for field operations and wheat irrigation. Check field soil moisture prior to mechanical harvesting.',
        'agro_advisory_hi': 'खेत कार्यों और गेहूं की सिंचाई के लिए मौसम अनुकूल है। मशीनी कटाई से पहले खेत की नमी की जांच अवश्य करें।',
        'data_timestamp': now_iso,
        'attribution': 'IMD Seasonal Agro-Advisory Benchmark / Offline Reference',
        'data_freshness': 'Standard seasonal reference (live source unavailable)',
        'booking_policy': 'Read-only agricultural advisory. Weather forecasts do not automatically cancel confirmed bookings.'
    }

def map_weather_code(code):
    """Maps WMO weather interpretation code to bilingual descriptions."""
    wmo_map = {
        0: ('Clear sky', 'साफ आसमान'),
        1: ('Mainly clear', 'मुख्यतः साफ'),
        2: ('Partly cloudy', 'आंशिक रूप से बादल'),
        3: ('Overcast', 'घने बादल'),
        45: ('Fog', 'कोहरा'),
        48: ('Depositing rime fog', 'घना कोहरा'),
        51: ('Light drizzle', 'हल्की बूंदाबांदी'),
        53: ('Moderate drizzle', 'मध्यम बूंदाबांदी'),
        61: ('Slight rain', 'हल्की बारिश'),
        63: ('Moderate rain', 'मध्यम बारिश'),
        65: ('Heavy rain', 'भारी बारिश'),
        71: ('Slight snowfall', 'हल्की बर्फबारी'),
        80: ('Rain showers', 'वर्षा की फुहारें'),
        95: ('Thunderstorm', 'गरज के साथ बारिश')
    }
    return wmo_map.get(code, ('Partly cloudy', 'आंशिक रूप से बादल'))

def generate_agro_advisory(condition_en, precip_mm, lang='en'):
    if precip_mm and float(precip_mm) > 5.0:
        if lang == 'hi':
            return 'वर्षा की संभावना है: कीटनाशक छिड़काव और सिंचाई कार्य स्थगित रखें। जल निकासी का प्रबंध करें।'
        return 'Precipitation expected: Postpone chemical spraying and irrigation. Ensure field drainage channels are clear.'
    else:
        if lang == 'hi':
            return 'मौसम साफ और अनुकूल है: खेत की जुताई, बुवाई और समयबद्ध सिंचाई कार्य सुचारू रूप से किए जा सकते हैं।'
        return 'Weather is favorable for field operations: Ploughing, sowing, and scheduled irrigation can proceed safely.'
