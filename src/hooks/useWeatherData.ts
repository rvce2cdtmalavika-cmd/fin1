
import { useState, useEffect } from 'react';
import { WeatherConditions } from '@/types/products';

// Using OpenWeatherMap API for real-time weather data
const WEATHER_API_KEY = ''; // User will need to provide this
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

export function useWeatherData(lat: number, lng: number) {
  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lng || !WEATHER_API_KEY) return;

    setIsLoading(true);
    setError(null);

    fetch(`${WEATHER_API_URL}?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`)
      .then(response => response.json())
      .then(data => {
        if (data.cod === 200) {
          const weatherData: WeatherConditions = {
            temperature: data.main.temp,
            humidity: data.main.humidity,
            precipitation: data.rain?.['1h'] || 0,
            windSpeed: data.wind.speed * 3.6, // convert m/s to km/h
            uvIndex: 0, // Would need separate UV API call
            timestamp: new Date(),
            location: { lat, lng }
          };
          setWeather(weatherData);
        } else {
          setError(data.message || 'Weather data unavailable');
        }
      })
      .catch(err => {
        setError('Failed to fetch weather data');
        console.error('Weather API error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [lat, lng]);

  return { weather, isLoading, error };
}

// Calculate spoilage based on weather conditions
export function calculateWeatherSpoilage(
  product: any,
  weather: WeatherConditions,
  transportTimeHours: number
): number {
  if (!weather) return 0;

  let spoilageRate = product.spoilageRate.perHourRefrigerated;
  
  // Adjust for ambient temperature if no refrigeration
  if (weather.temperature > product.temperatureRange.max) {
    const tempExcess = weather.temperature - product.temperatureRange.max;
    spoilageRate = product.spoilageRate.perHourAtAmbient * (1 + tempExcess * 0.1);
  }

  // Adjust for humidity (affects certain products)
  if (weather.humidity > 85 && product.qualityFactors.oxygenSensitivity) {
    spoilageRate *= 1.3;
  }

  // Calculate total spoilage
  const totalSpoilage = spoilageRate * transportTimeHours;
  return Math.min(totalSpoilage, 100); // Cap at 100%
}
