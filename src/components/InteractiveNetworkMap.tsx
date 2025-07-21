
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { NetworkNode } from '@/types/products';
import { ProductManagement } from './ProductManagement';
import { WeatherIntegration } from './WeatherIntegration';
import { 
  MapPin, 
  Settings, 
  Zap, 
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Target,
  Search,
  Navigation,
  Upload,
  Edit,
  Trash2,
  Save
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface OptimizationConstraints {
  maxDistance: number;
  costWeight: number;
  timeWeight: number;
  qualityWeight: number;
  temperatureWeight: number;
}

interface OptimizedRoute {
  from: NetworkNode;
  to: NetworkNode;
  distance: number;
  cost: number;
  time: number;
  products: string[];
  vehicleType: string;
  spoilageRisk: number;
  efficiency: 'optimal' | 'suboptimal' | 'problematic';
  polyline?: any;
}

export function InteractiveNetworkMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [searchBox, setSearchBox] = useState<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [frequentLocations, setFrequentLocations] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['whole-milk']);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['refrigerated-truck']);
  const [coordinateInput, setCoordinateInput] = useState({ lat: '', lng: '' });
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxDistance: 50,
    costWeight: 30,
    timeWeight: 25,
    qualityWeight: 25,
    temperatureWeight: 20
  });
  
  const { nodes: dairyNodes } = useDairyData();
  const { toast } = useToast();

  // Load Google Maps API with Places library
  useEffect(() => {
    if (window.google) {
      setIsApiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBkR-LW8k3RE3yvVwUMfkXDIVWPwdlnkTA&libraries=places&callback=initMap`;
    script.async = true;
    
    window.initMap = () => {
      setIsApiLoaded(true);
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.initMap;
    };
  }, []);

  // Initialize map and search functionality
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || map) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 8,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Initialize Places SearchBox
    if (searchRef.current) {
      const searchBoxInstance = new window.google.maps.places.SearchBox(searchRef.current);
      setSearchBox(searchBoxInstance);

      // Listen for places changed event
      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const newNode: NetworkNode = {
            id: `search_${Date.now()}`,
            name: place.name || 'Selected Location',
            type: 'distributor',
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || '',
              placeId: place.place_id
            },
            capacity: { storage: 1000 },
            operatingHours: { open: '06:00', close: '22:00', peakHours: ['06:00-09:00', '17:00-20:00'] },
            supportedProducts: selectedProducts,
            temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false }
          };
          
          setSelectedNode(newNode);
          googleMap.setCenter(place.geometry.location);
          googleMap.setZoom(15);

          // Add to frequent locations
          if (place.name && !frequentLocations.includes(place.name)) {
            setFrequentLocations(prev => [...prev.slice(-4), place.name]);
          }
        }
      });
    }

    setMap(googleMap);

    // Convert dairy data to network nodes
    const networkNodes: NetworkNode[] = dairyNodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      location: {
        lat: node.lat,
        lng: node.lng,
        address: `${node.district || 'Unknown'}`,
      },
      capacity: { storage: node.capacity },
      operatingHours: { 
        open: '06:00', 
        close: '20:00',
        peakHours: node.type === 'farm' ? ['06:00-09:00', '17:00-20:00'] : ['08:00-18:00']
      },
      supportedProducts: selectedProducts,
      temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false },
      contact: {
        person: node.contact,
        phone: node.phone
      }
    }));

    setNodes(networkNodes);
    
    // Add click listener for adding new nodes
    googleMap.addListener('click', (event: any) => {
      const newNode: NetworkNode = {
        id: `manual_${Date.now()}`,
        name: `New Location`,
        type: 'distributor',
        location: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
          address: 'Click to geocode address'
        },
        capacity: { storage: 1000 },
        operatingHours: { open: '06:00', close: '22:00' },
        supportedProducts: selectedProducts,
        temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false }
      };
      
      setSelectedNode(newNode);
    });

  }, [isApiLoaded, dairyNodes, selectedProducts]);

  // Render nodes on map
  useEffect(() => {
    if (!map || !nodes.length) return;

    // Clear existing markers
    nodes.forEach(node => {
      if ((node as any).marker) {
        (node as any).marker.setMap(null);
      }
    });

    // Add markers for each node
    const updatedNodes = nodes.map(node => {
      const marker = new window.google.maps.Marker({
        position: { lat: node.location.lat, lng: node.location.lng },
        map: map,
        title: node.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: getNodeColor(node.type),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        draggable: true
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3><strong>${node.name}</strong></h3>
            <p><strong>Type:</strong> ${getNodeTypeLabel(node.type)}</p>
            <p><strong>Capacity:</strong> ${node.capacity.storage}L</p>
            <p><strong>Hours:</strong> ${node.operatingHours.open} - ${node.operatingHours.close}</p>
            ${node.operatingHours.peakHours ? `<p><strong>Peak:</strong> ${node.operatingHours.peakHours.join(', ')}</p>` : ''}
            ${node.contact?.phone ? `<p><strong>Phone:</strong> ${node.contact.phone}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedNode(node);
      });

      marker.addListener('dragend', (event: any) => {
        updateNodePosition(node.id, event.latLng.lat(), event.latLng.lng());
      });

      return { ...node, marker } as any;
    });

    setNodes(updatedNodes);
  }, [map, nodes.length]);

  const getNodeColor = (type: string) => {
    const colors = {
      farm: '#10B981',
      collection_center: '#3B82F6',
      processing_plant: '#8B5CF6',
      distributor: '#F59E0B',
      retail: '#EF4444'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const getNodeTypeLabel = (type: string) => {
    const labels = {
      farm: 'Dairy Farm - Milk production and initial collection',
      collection_center: 'Collection Center - Aggregation and temporary storage',
      processing_plant: 'Processing Plant - Manufacturing and packaging',
      distributor: 'Distributor - Wholesale and distribution hub',
      retail: 'Retail Shop - Final point of sale to consumers'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const updateNodePosition = (nodeId: string, lat: number, lng: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { 
        ...node, 
        location: { ...node.location, lat, lng }
      } : node
    ));
  };

  const addCoordinateLocation = () => {
    const lat = parseFloat(coordinateInput.lat);
    const lng = parseFloat(coordinateInput.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    const newNode: NetworkNode = {
      id: `coord_${Date.now()}`,
      name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      type: 'distributor',
      location: { lat, lng, address: 'Manual coordinates' },
      capacity: { storage: 1000 },
      operatingHours: { open: '06:00', close: '22:00' },
      supportedProducts: selectedProducts,
      temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false }
    };
    
    setSelectedNode(newNode);
    map?.setCenter({ lat, lng });
    map?.setZoom(15);
    
    setCoordinateInput({ lat: '', lng: '' });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newNode: NetworkNode = {
          id: `current_${Date.now()}`,
          name: 'Current Location',
          type: 'distributor',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current GPS location'
          },
          capacity: { storage: 1000 },
          operatingHours: { open: '06:00', close: '22:00' },
          supportedProducts: selectedProducts,
          temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false }
        };
        
        setSelectedNode(newNode);
        map?.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        map?.setZoom(15);
      });
    }
  };

  const addNode = (type: NetworkNode['type']) => {
    if (selectedNode) {
      const newNode: NetworkNode = {
        ...selectedNode,
        type,
        name: `New ${getNodeTypeLabel(type).split(' - ')[0]}`,
        id: `${type}_${Date.now()}`
      };
      
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(null);
      
      toast({
        title: "Node Added",
        description: `Added new ${getNodeTypeLabel(type).split(' - ')[0]} to the network`,
      });
    }
  };

  const editNode = (node: NetworkNode) => {
    setEditingNode(node);
  };

  const saveNodeEdit = () => {
    if (editingNode) {
      setNodes(prev => prev.map(node => 
        node.id === editingNode.id ? editingNode : node
      ));
      setEditingNode(null);
      toast({
        title: "Node Updated",
        description: "Node details have been saved",
      });
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    toast({
      title: "Node Deleted",
      description: "Node has been removed from the network",
    });
  };

  if (!isApiLoaded) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Interactive Network Map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map">Network Map</TabsTrigger>
          <TabsTrigger value="products">Products & Vehicles</TabsTrigger>
          <TabsTrigger value="weather">Weather Impact</TabsTrigger>
          <TabsTrigger value="nodes">Node Management</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Location Search and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Search & Network Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Box */}
              <div className="flex gap-2">
                <Input
                  ref={searchRef}
                  placeholder="Search for locations (e.g., 'Nandhini shop, Koramangala')"
                  className="flex-1"
                />
                <Button onClick={getCurrentLocation} variant="outline">
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>

              {/* Coordinate Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude (12.9716)"
                  value={coordinateInput.lat}
                  onChange={(e) => setCoordinateInput(prev => ({ ...prev, lat: e.target.value }))}
                />
                <Input
                  placeholder="Longitude (77.5946)"
                  value={coordinateInput.lng}
                  onChange={(e) => setCoordinateInput(prev => ({ ...prev, lng: e.target.value }))}
                />
                <Button onClick={addCoordinateLocation} variant="outline">
                  <Target className="h-4 w-4" />
                </Button>
              </div>

              {/* Frequent Locations */}
              {frequentLocations.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Frequent Locations:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {frequentLocations.map((location, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimization Controls */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <Label>Max Distance: {constraints.maxDistance}km</Label>
                  <Slider
                    value={[constraints.maxDistance]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxDistance: value }))}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Cost: {constraints.costWeight}%</Label>
                  <Slider
                    value={[constraints.costWeight]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, costWeight: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Time: {constraints.timeWeight}%</Label>
                  <Slider
                    value={[constraints.timeWeight]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, timeWeight: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Quality: {constraints.qualityWeight}%</Label>
                  <Slider
                    value={[constraints.qualityWeight]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, qualityWeight: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Temperature: {constraints.temperatureWeight}%</Label>
                  <Slider
                    value={[constraints.temperatureWeight]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, temperatureWeight: value }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Container */}
          <Card>
            <CardContent className="p-0">
              <div 
                ref={mapRef} 
                className="w-full h-[600px] rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Node Addition Panel */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Network Node</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Selected location: {selectedNode.location.address || `${selectedNode.location.lat.toFixed(4)}, ${selectedNode.location.lng.toFixed(4)}`}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button onClick={() => addNode('farm')} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Dairy Farm
                  </Button>
                  <Button onClick={() => addNode('collection_center')} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Collection Center
                  </Button>
                  <Button onClick={() => addNode('processing_plant')} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Processing Plant
                  </Button>
                  <Button onClick={() => addNode('distributor')} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Distributor
                  </Button>
                  <Button onClick={() => addNode('retail')} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Retail Shop
                  </Button>
                </div>
                <Button onClick={() => setSelectedNode(null)} variant="ghost" size="sm" className="mt-2">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
            selectedVehicles={selectedVehicles}
            onVehiclesChange={setSelectedVehicles}
          />
        </TabsContent>

        <TabsContent value="weather">
          <WeatherIntegration
            selectedLocation={selectedNode?.location}
            selectedProducts={selectedProducts}
            estimatedTripTime={8}
          />
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Nodes Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {nodes.map((node) => (
                    <div key={node.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getNodeColor(node.type) }}
                          />
                          <span className="font-semibold">{node.name}</span>
                          <Badge variant="outline">{node.type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => editNode(node)} size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => deleteNode(node.id)} size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Location:</strong> {node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)}</p>
                        <p><strong>Capacity:</strong> {node.capacity.storage}L</p>
                        <p><strong>Hours:</strong> {node.operatingHours.open} - {node.operatingHours.close}</p>
                        {node.operatingHours.peakHours && (
                          <p><strong>Peak Hours:</strong> {node.operatingHours.peakHours.join(', ')}</p>
                        )}
                        {node.contact?.phone && (
                          <p><strong>Contact:</strong> {node.contact.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Node Editor Modal */}
          {editingNode && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Node: {editingNode.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingNode.name}
                      onChange={(e) => setEditingNode(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label>Storage Capacity (L)</Label>
                    <Input
                      type="number"
                      value={editingNode.capacity.storage}
                      onChange={(e) => setEditingNode(prev => prev ? { 
                        ...prev, 
                        capacity: { ...prev.capacity, storage: parseInt(e.target.value) || 0 }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label>Opening Hours</Label>
                    <Input
                      value={editingNode.operatingHours.open}
                      onChange={(e) => setEditingNode(prev => prev ? { 
                        ...prev, 
                        operatingHours: { ...prev.operatingHours, open: e.target.value }
                      } : null)}
                    />
                  </div>
                  <div>
                    <Label>Closing Hours</Label>
                    <Input
                      value={editingNode.operatingHours.close}
                      onChange={(e) => setEditingNode(prev => prev ? { 
                        ...prev, 
                        operatingHours: { ...prev.operatingHours, close: e.target.value }
                      } : null)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveNodeEdit}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditingNode(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          Search for specific locations using the search box, enter coordinates manually, or click on the map to add nodes. 
          The system supports farms, collection centers, processing plants, distributors, and retail shops with realistic operational constraints.
          Peak collection times (6-9 AM, 5-8 PM) are automatically considered for optimization.
        </AlertDescription>
      </Alert>
    </div>
  );
}
