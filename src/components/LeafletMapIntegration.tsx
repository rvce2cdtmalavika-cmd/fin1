import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Plus, Target, Route } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  name: string;
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

interface LeafletMapIntegrationProps {
  onLocationSelect: (location: Location) => void;
  existingLocations?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  optimizedRoute?: Array<{ lat: number; lng: number; name: string }>;
  showRouteDistance?: boolean;
  routeDistance?: number;
  routeCost?: number;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (location: Location) => void }) {
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null);
  
  useMapEvents({
    click(e) {
      const location = {
        name: `Location ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        address: `Coordinates: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
      };
      setClickedLocation(location);
      onLocationSelect(location);
    },
  });

  return null;
}

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const getMarkerColor = (type: string) => {
  const colors = {
    farm: '#10B981',
    collection_center: '#3B82F6',
    processing_plant: '#8B5CF6',
    distributor: '#F59E0B',
    retail: '#EF4444'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

export function LeafletMapIntegration({ 
  onLocationSelect, 
  existingLocations = [], 
  center = { lat: 20.5937, lng: 78.9629 }, // India center
  zoom = 6,
  optimizedRoute = [],
  showRouteDistance = false,
  routeDistance = 0,
  routeCost = 0
}: LeafletMapIntegrationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const { toast } = useToast();

  // Nominatim search function
  const searchPlaces = async (query: string) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`
      );
      const data = await response.json();
      
      const locations = data.map((place: any) => ({
        name: place.display_name.split(',')[0],
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        address: place.display_name,
        placeId: place.place_id?.toString()
      }));
      
      setSearchResults(locations);
      
      if (locations.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found for your search",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search locations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces(searchQuery);
  };

  const selectSearchResult = (location: Location) => {
    setSelectedLocation(location);
    setSearchResults([]);
  };

  const addLocationFromCoordinates = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    const location = {
      name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
      address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    setSelectedLocation(location);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      setSelectedLocation(null);
      setSearchQuery('');
      setManualCoords({ lat: '', lng: '' });
      toast({
        title: "Location Added",
        description: `${selectedLocation.name} has been added to your network`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Search & Network Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="Search for dairy farms, processing plants, markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Manual Coordinates Input */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Latitude (20.5937)"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
            />
            <Input
              placeholder="Longitude (78.9629)"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
            />
            <Button onClick={addLocationFromCoordinates} variant="outline">
              <Target className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Search Results:</h3>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => selectSearchResult(result)}
                >
                  <p className="font-medium">{result.name}</p>
                  <p className="text-sm text-muted-foreground">{result.address}</p>
                </div>
              ))}
            </div>
          )}

          {/* Selected Location */}
          {selectedLocation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedLocation.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>
                <Button onClick={confirmLocation} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Network
                </Button>
              </div>
            </div>
          )}

          {/* Route Information */}
          {showRouteDistance && optimizedRoute.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-green-600" />
                <h3 className="font-medium text-green-800">Optimized Route</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Distance:</span>
                  <span className="ml-2 font-medium">{routeDistance.toFixed(1)} km</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Cost:</span>
                  <span className="ml-2 font-medium">₹{routeCost.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={zoom} 
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={setSelectedLocation} />
            
            {/* Existing locations */}
            {existingLocations.map((location, index) => (
              <Marker 
                key={location.id} 
                position={[location.lat, location.lng]}
                icon={createCustomIcon(getMarkerColor(location.type))}
              >
                <Popup>
                  <div>
                    <strong>{location.name}</strong>
                    <br />
                    Type: {location.type.replace('_', ' ')}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Selected location */}
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div>
                    <strong>{selectedLocation.name}</strong>
                    <br />
                    {selectedLocation.address}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Optimized route */}
            {optimizedRoute.length > 1 && (
              <>
                {optimizedRoute.map((point, index) => (
                  <Marker 
                    key={`route-${index}`}
                    position={[point.lat, point.lng]}
                    icon={createCustomIcon('#FF6B35')}
                  >
                    <Popup>
                      <div>
                        <strong>Stop {index + 1}</strong>
                        <br />
                        {point.name}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </CardContent>
      </Card>

      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Click anywhere on the map to add a location, search for places, or enter coordinates manually.
          Network locations are color-coded: Green (Farms), Blue (Collection Centers), Purple (Processing Plants), Orange (Distributors), Red (Retail).
        </AlertDescription>
      </Alert>
    </div>
  );
}
