
import { useState, useEffect } from 'react';
import { WeatherConditions } from '@/types/products';

// Using OpenWeatherMap API for real-time weather data
const WEATHER_API_KEY = ''; // TODO: Add your OpenWeatherMap API key here for real weather data
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

export function useWeatherData(lat: number = 12.9716, lng: number = 77.5946) {
  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock weather data when API key is not available
    if (!WEATHER_API_KEY) {
      setWeather({
        temperature: 25,
        humidity: 65,
        precipitation: 0,
        windSpeed: 10,
        uvIndex: 5,
        timestamp: new Date(),
        location: { lat, lng }
      });
      return;
    }

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

  return { 
    weather, 
    weatherData: weather, // Add alias for backward compatibility
    isLoading, 
    error 
  };
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
