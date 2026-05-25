import * as Location from 'expo-location';

export interface LocalContext {
  temperatureF: number;
  condition: string; // 'sunny', 'cloudy', 'raining', 'snowing', etc.
  isDay: boolean;
  latitude: number;
  longitude: number;
}

function getWeatherCondition(wmoCode: number, isDay: boolean): string {
  if (wmoCode === 0 || wmoCode === 1) return isDay ? 'sunny' : 'clear';
  if (wmoCode === 2 || wmoCode === 3) return 'cloudy';
  if (wmoCode >= 45 && wmoCode <= 48) return 'foggy';
  if (wmoCode >= 51 && wmoCode <= 67) return 'raining';
  if (wmoCode >= 71 && wmoCode <= 77) return 'snowing';
  if (wmoCode >= 80 && wmoCode <= 82) return 'raining';
  if (wmoCode >= 85 && wmoCode <= 86) return 'snowing';
  if (wmoCode >= 95 && wmoCode <= 99) return 'stormy';
  return 'mild';
}

export async function getLocalContext(): Promise<LocalContext | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Location] Permission denied');
      return null;
    }

    // Get location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;

    // Fetch from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo error: ${response.status}`);
    }
    const data = await response.json();
    
    const current = data.current;
    if (!current) return null;

    const temperatureF = Math.round(current.temperature_2m);
    const isDay = current.is_day === 1;
    const condition = getWeatherCondition(current.weather_code, isDay);

    return {
      temperatureF,
      condition,
      isDay,
      latitude: lat,
      longitude: lon,
    };
  } catch (error) {
    console.error('[Location] Failed to fetch local context:', error);
    return null;
  }
}
