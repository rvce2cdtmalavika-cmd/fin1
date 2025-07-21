
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Plus, Target } from 'lucide-react';

interface GoogleLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

interface GoogleMapIntegrationProps {
  onLocationSelect: (location: GoogleLocation) => void;
  existingLocations?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function GoogleMapIntegration({ 
  onLocationSelect, 
  existingLocations = [], 
  center = { lat: 12.9716, lng: 77.5946 }, // Bangalore center
  zoom = 8 
}: GoogleMapIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [searchService, setSearchService] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const { toast } = useToast();

  // Load Google Maps API with your provided key
  useEffect(() => {
    if (window.google) {
      setIsApiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBkR-LW8k3RE3yvVwUMfkXDIVWPwdlnkTA&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      setIsApiLoaded(true);
    };
    
    script.onerror = () => {
      toast({
        title: "Google Maps API Error",
        description: "Failed to load Google Maps API. Please check your internet connection.",
        variant: "destructive"
      });
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.initMap;
    };
  }, [toast]);

  // Initialize map when API is loaded
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || map) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'simplified' }]
        }
      ]
    });

    // Initialize services
    const placesService = new window.google.maps.places.PlacesService(googleMap);
    const geocoderService = new window.google.maps.Geocoder();
    
    setMap(googleMap);
    setSearchService(placesService);
    setGeocoder(geocoderService);

    // Add click listener for map
    googleMap.addListener('click', (event: any) => {
      const clickedLocation = {
        name: `Location at ${event.latLng.lat().toFixed(4)}, ${event.latLng.lng().toFixed(4)}`,
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        address: 'Click to geocode address'
      };
      setSelectedLocation(clickedLocation);
      
      // Reverse geocode to get address
      geocoderService.geocode({ location: event.latLng }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setSelectedLocation(prev => prev ? {
            ...prev,
            address: results[0].formatted_address,
            name: results[0].address_components[0]?.long_name || prev.name
          } : null);
        }
      });
    });

    // Add existing locations as markers
    existingLocations.forEach(location => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: googleMap,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(location.type),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div><strong>${location.name}</strong><br>${location.type}</div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
      });
    });

  }, [isApiLoaded, center, zoom, existingLocations, map]);

  const getMarkerColor = (type: string) => {
    const colors = {
      farm: '#10B981',
      collection_center: '#3B82F6',
      processing_plant: '#8B5CF6',
      distribution_center: '#F59E0B'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const searchPlaces = useCallback(async (query: string) => {
    if (!searchService || !query.trim()) return;

    setIsSearching(true);
    
    const request = {
      query: `${query} Karnataka India`,
      fields: ['name', 'geometry', 'formatted_address', 'place_id']
    };

    searchService.textSearch(request, (results: any, status: any) => {
      setIsSearching(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const locations = results.map((place: any) => ({
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
          placeId: place.place_id
        }));
        setSearchResults(locations.slice(0, 5));
      } else {
        toast({
          title: "Search Results",
          description: "No results found for your search in Karnataka",
          variant: "default"
        });
        setSearchResults([]);
      }
    });
  }, [searchService, toast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces(searchQuery);
  };

  const selectSearchResult = (location: GoogleLocation) => {
    setSelectedLocation(location);
    setSearchResults([]);
    
    if (map) {
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(15);
      
      new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        animation: window.google.maps.Animation.DROP
      });
    }
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

    if (geocoder) {
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        const location = {
          name: results[0]?.address_components[0]?.long_name || `Location ${lat}, ${lng}`,
          lat,
          lng,
          address: results[0]?.formatted_address || 'Address not found'
        };
        setSelectedLocation(location);
        
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(15);
        }
      });
    }
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

  if (!isApiLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Loading Google Maps for Karnataka dairy network...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Karnataka Location Search & Network Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="Search for dairy farms, processing plants, markets in Karnataka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Manual Coordinates Input */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Latitude (12.9716)"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
            />
            <Input
              placeholder="Longitude (77.5946)"
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
              <Label>Search Results in Karnataka:</Label>
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
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Click anywhere on the Karnataka map to add a location, search for places, or enter coordinates manually.
          Existing network locations are shown as colored markers: Green (Farms), Blue (Collection Centers), Purple (Processing Plants).
        </AlertDescription>
      </Alert>
    </div>
  );
}
