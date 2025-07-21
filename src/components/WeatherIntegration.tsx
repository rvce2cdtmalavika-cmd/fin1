
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeatherData, calculateWeatherSpoilage } from '@/hooks/useWeatherData';
import { DAIRY_PRODUCTS } from '@/data/dairyProducts';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface WeatherIntegrationProps {
  selectedLocation?: { lat: number; lng: number };
  selectedProducts: string[];
  estimatedTripTime: number; // hours
}

export function WeatherIntegration({ 
  selectedLocation, 
  selectedProducts, 
  estimatedTripTime 
}: WeatherIntegrationProps) {
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [weatherLocation, setWeatherLocation] = useState(selectedLocation);
  
  const { weather, isLoading, error } = useWeatherData(
    weatherLocation?.lat || 0, 
    weatherLocation?.lng || 0
  );

  const handleManualWeatherCheck = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setWeatherLocation({ lat, lng });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setWeatherLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  };

  const getWeatherImpact = (temp: number) => {
    if (temp > 35) return { level: 'high', color: 'destructive', message: 'Extreme heat - high spoilage risk' };
    if (temp > 25) return { level: 'medium', color: 'warning', message: 'Warm weather - monitor closely' };
    if (temp < 0) return { level: 'low', color: 'default', message: 'Cold weather - natural preservation' };
    return { level: 'low', color: 'default', message: 'Optimal weather conditions' };
  };

  const selectedProductDetails = DAIRY_PRODUCTS.filter(p => 
    selectedProducts.includes(p.id)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Real-Time Weather Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Latitude"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
              className="flex-1"
            />
            <Input
              placeholder="Longitude"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
              className="flex-1"
            />
            <Button onClick={handleManualWeatherCheck} variant="outline">
              <MapPin className="h-4 w-4" />
            </Button>
            <Button onClick={getCurrentLocation} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}. Please provide OpenWeatherMap API key in environment variables.
              </AlertDescription>
            </Alert>
          )}

          {/* Weather Display */}
          {weather && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Thermometer className="h-6 w-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{weather.temperature.toFixed(1)}°C</div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Droplets className="h-6 w-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{weather.humidity}%</div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Wind className="h-6 w-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{weather.windSpeed.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Wind (km/h)</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Cloud className="h-6 w-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{weather.precipitation}</div>
                <div className="text-sm text-muted-foreground">Rain (mm/h)</div>
              </div>
            </div>
          )}

          {/* Weather Impact Assessment */}
          {weather && selectedProductDetails.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Product Spoilage Risk Analysis</h4>
              {selectedProductDetails.map(product => {
                const spoilage = calculateWeatherSpoilage(product, weather, estimatedTripTime);
                const impact = getWeatherImpact(weather.temperature);
                
                return (
                  <div key={product.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{product.name}</span>
                      <Badge variant={impact.color as any}>
                        {spoilage.toFixed(1)}% spoilage risk
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Optimal temp: {product.temperatureRange.optimal}°C</div>
                      <div>Current impact: {impact.message}</div>
                      {weather.temperature > product.temperatureRange.max && (
                        <div className="text-red-600 font-medium">
                          ⚠️ Temperature {(weather.temperature - product.temperatureRange.max).toFixed(1)}°C above safe range
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Weather data from OpenWeatherMap. Spoilage calculations based on industry standards and current conditions.
              Peak collection times (6-9 AM, 5-8 PM) have lower ambient temperatures reducing spoilage risk.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
