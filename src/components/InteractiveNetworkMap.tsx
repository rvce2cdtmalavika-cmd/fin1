
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
import { Switch } from '@/components/ui/switch';
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
  Save,
  Factory,
  Store,
  Truck
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface OptimizationConstraints {
  maxDistanceKm: number;
  maxDeliveryTimeHours: number;
  temperatureThresholdC: number;
  qualityRetentionPercent: number;
  costPerKm: number;
}

interface OptimizedRoute {
  id: string;
  from: NetworkNode;
  to: NetworkNode;
  distance: number;
  cost: number;
  time: number;
  products: string[];
  vehicleType: string;
  spoilageRisk: number;
  efficiency: 'optimal' | 'good' | 'poor';
  polyline?: any;
  color: string;
}

interface InteractiveNetworkMapProps {
  selectedProducts?: string[];
  onProductsChange?: (products: string[]) => void;
  selectedVehicles?: string[];
  onVehiclesChange?: (vehicles: string[]) => void;
}

export function InteractiveNetworkMap({ 
  selectedProducts = ['whole-milk'], 
  onProductsChange = () => {},
  selectedVehicles = ['refrigerated-truck'],
  onVehiclesChange = () => {}
}: InteractiveNetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nodeSearchRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [searchBox, setSearchBox] = useState<any>(null);
  const [nodeSearchBox, setNodeSearchBox] = useState<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [nodes, setNodes] = useState<(NetworkNode & { isVisible?: boolean })[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [editingNode, setEditingNode] = useState<(NetworkNode & { isVisible?: boolean }) | null>(null);
  const [frequentLocations, setFrequentLocations] = useState<string[]>(['Amul Dairy Store, MG Road']);
  const [coordinateInput, setCoordinateInput] = useState({ lat: '', lng: '' });
  const [nodeCoordinateInput, setNodeCoordinateInput] = useState({ lat: '', lng: '' });
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxDistanceKm: 50,
    maxDeliveryTimeHours: 8,
    temperatureThresholdC: 4,
    qualityRetentionPercent: 95,
    costPerKm: 15
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

    // Initialize Places SearchBox for main search
    if (searchRef.current) {
      const searchBoxInstance = new window.google.maps.places.SearchBox(searchRef.current);
      setSearchBox(searchBoxInstance);

      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (place.geometry && place.geometry.location) {
          googleMap.setCenter(place.geometry.location);
          googleMap.setZoom(15);

          if (place.name && !frequentLocations.includes(place.name)) {
            setFrequentLocations(prev => [...prev.slice(-4), place.name]);
          }
        }
      });
    }

    // Initialize Places SearchBox for node management
    if (nodeSearchRef.current) {
      const nodeSearchBoxInstance = new window.google.maps.places.SearchBox(nodeSearchRef.current);
      setNodeSearchBox(nodeSearchBoxInstance);

      nodeSearchBoxInstance.addListener('places_changed', () => {
        const places = nodeSearchBoxInstance.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const newNode: NetworkNode & { isVisible?: boolean } = {
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
            temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false },
            isVisible: true
          };
          
          setNodes(prev => [...prev, newNode]);
          googleMap.setCenter(place.geometry.location);
          googleMap.setZoom(15);

          toast({
            title: "Node Added",
            description: `Added ${place.name} to the network`,
          });
        }
      });
    }

    setMap(googleMap);

    // Convert dairy data to network nodes
    const networkNodes: (NetworkNode & { isVisible?: boolean })[] = dairyNodes.map(node => ({
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
      },
      isVisible: true
    }));

    setNodes(networkNodes);
    
  }, [isApiLoaded, dairyNodes, selectedProducts]);

  // Render nodes on map with color coding and symbols
  useEffect(() => {
    if (!map || !nodes.length) return;

    // Clear existing markers and polylines
    nodes.forEach(node => {
      if ((node as any).marker) {
        (node as any).marker.setMap(null);
      }
    });

    optimizedRoutes.forEach(route => {
      if (route.polyline) {
        route.polyline.setMap(null);
      }
    });

    // Add markers for visible nodes only
    const updatedNodes = nodes.map(node => {
      if (!node.isVisible) return node;

      const nodeIcon = getNodeIcon(node.type);
      const marker = new window.google.maps.Marker({
        position: { lat: node.location.lat, lng: node.location.lng },
        map: map,
        title: node.name,
        icon: nodeIcon,
        draggable: true
      });

      // Add info window with detailed information
      const infoContent = `
        <div style="max-width: 250px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 8px;">${getNodeEmoji(node.type)}</span>
            <h3 style="margin: 0; font-weight: bold;">${node.name}</h3>
          </div>
          <p style="margin: 4px 0; color: #666;"><strong>Type:</strong> ${getNodeTypeLabel(node.type)}</p>
          <p style="margin: 4px 0; color: #666;"><strong>Capacity:</strong> ${node.capacity.storage}L</p>
          <p style="margin: 4px 0; color: #666;"><strong>Hours:</strong> ${node.operatingHours.open} - ${node.operatingHours.close}</p>
          ${node.operatingHours.peakHours ? `<p style="margin: 4px 0; color: #666;"><strong>Peak:</strong> ${node.operatingHours.peakHours.join(', ')}</p>` : ''}
          ${node.contact?.phone ? `<p style="margin: 4px 0; color: #666;"><strong>Phone:</strong> ${node.contact.phone}</p>` : ''}
          <p style="margin: 4px 0; font-size: 12px; color: #888;">${node.location.address}</p>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent
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

    // Render optimized routes if available
    if (showOptimization && optimizedRoutes.length > 0) {
      renderOptimizedRoutes();
    }
  }, [map, nodes.length, showOptimization, optimizedRoutes, selectedRoute]);

  const getNodeIcon = (type: string) => {
    const iconConfigs = {
      farm: { color: '#10B981', symbol: '🐄' },
      collection_center: { color: '#3B82F6', symbol: '🏭' },
      processing_plant: { color: '#8B5CF6', symbol: '⚙️' },
      distributor: { color: '#F59E0B', symbol: '📦' },
      retail: { color: '#EF4444', symbol: '🏪' }
    };

    const config = iconConfigs[type as keyof typeof iconConfigs] || iconConfigs.distributor;
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 20,
      fillColor: config.color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    };
  };

  const getNodeEmoji = (type: string) => {
    const emojis = {
      farm: '🐄',
      collection_center: '🏭',
      processing_plant: '⚙️',
      distributor: '📦',
      retail: '🏪'
    };
    return emojis[type as keyof typeof emojis] || '📍';
  };

  const getNodeTypeLabel = (type: string) => {
    const labels = {
      farm: 'Dairy Farm - Primary milk production facility',
      collection_center: 'Collection Center - Milk aggregation and cooling',
      processing_plant: 'Processing Plant - Manufacturing and packaging',
      distributor: 'Distributor - Wholesale distribution hub',
      retail: 'Retail Shop - Direct consumer sales point'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const renderOptimizedRoutes = () => {
    if (!map) return;

    optimizedRoutes.forEach(route => {
      if (route.polyline) {
        route.polyline.setMap(null);
      }

      const polyline = new window.google.maps.Polyline({
        path: [
          { lat: route.from.location.lat, lng: route.from.location.lng },
          { lat: route.to.location.lat, lng: route.to.location.lng }
        ],
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: selectedRoute?.id === route.id ? 1.0 : 0.7,
        strokeWeight: selectedRoute?.id === route.id ? 6 : 4,
        map: map
      });

      route.polyline = polyline;

      // Add click listener to select route
      polyline.addListener('click', () => {
        setSelectedRoute(route);
      });
    });
  };

  const updateNodePosition = (nodeId: string, lat: number, lng: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { 
        ...node, 
        location: { ...node.location, lat, lng }
      } : node
    ));
  };

  const addNodeFromCoordinates = () => {
    const lat = parseFloat(nodeCoordinateInput.lat);
    const lng = parseFloat(nodeCoordinateInput.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    const newNode: NetworkNode & { isVisible?: boolean } = {
      id: `coord_${Date.now()}`,
      name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      type: 'distributor',
      location: { lat, lng, address: 'Manual coordinates' },
      capacity: { storage: 1000 },
      operatingHours: { open: '06:00', close: '22:00' },
      supportedProducts: selectedProducts,
      temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false },
      isVisible: true
    };
    
    setNodes(prev => [...prev, newNode]);
    map?.setCenter({ lat, lng });
    map?.setZoom(15);
    
    setNodeCoordinateInput({ lat: '', lng: '' });
    
    toast({
      title: "Node Added",
      description: "Added node from coordinates",
    });
  };

  const toggleNodeVisibility = (nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, isVisible: !node.isVisible } : node
    ));
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    toast({
      title: "Node Deleted",
      description: "Node has been permanently removed from the network",
    });
  };

  const runOptimization = () => {
    setIsOptimizing(true);
    
    // Simulate optimization algorithm
    setTimeout(() => {
      const visibleNodes = nodes.filter(n => n.isVisible);
      const routes: OptimizedRoute[] = [];
      const colors = ['#10B981', '#3B82F6', '#8B5CF6'];
      
      // Generate sample optimized routes
      for (let i = 0; i < Math.min(3, visibleNodes.length - 1); i++) {
        const from = visibleNodes[i];
        const to = visibleNodes[i + 1];
        
        if (from && to) {
          const distance = calculateDistance(from.location.lat, from.location.lng, to.location.lat, to.location.lng);
          const route: OptimizedRoute = {
            id: `route_${i}`,
            from,
            to,
            distance,
            cost: distance * constraints.costPerKm,
            time: distance / 40, // 40 km/h average speed
            products: selectedProducts,
            vehicleType: selectedVehicles[0],
            spoilageRisk: Math.max(0, (distance / constraints.maxDistanceKm) * 100),
            efficiency: distance < 30 ? 'optimal' : distance < 50 ? 'good' : 'poor',
            color: colors[i % colors.length]
          };
          routes.push(route);
        }
      }
      
      setOptimizedRoutes(routes);
      setShowOptimization(true);
      setIsOptimizing(false);
      
      toast({
        title: "Optimization Complete",
        description: `Generated ${routes.length} optimized routes`,
      });
    }, 2000);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
          <TabsTrigger value="nodes">Node Management</TabsTrigger>
          <TabsTrigger value="products">Products & Vehicles</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Location Search Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Search & Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  ref={searchRef}
                  placeholder="Search locations (e.g., 'Amul Dairy Store, MG Road')"
                  className="flex-1"
                />
              </div>

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

          {/* Route Comparison Panel */}
          {showOptimization && optimizedRoutes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Optimized Routes Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {optimizedRoutes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRoute?.id === route.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: route.color }}
                        />
                        <span className="font-semibold text-sm">Route {route.id.split('_')[1]}</span>
                        <Badge variant={route.efficiency === 'optimal' ? 'default' : route.efficiency === 'good' ? 'secondary' : 'destructive'}>
                          {route.efficiency}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>From:</strong> {route.from.name}</p>
                        <p><strong>To:</strong> {route.to.name}</p>
                        <p><strong>Distance:</strong> {route.distance.toFixed(1)}km</p>
                        <p><strong>Cost:</strong> ₹{route.cost.toFixed(0)}</p>
                        <p><strong>Time:</strong> {(route.time * 60).toFixed(0)} min</p>
                        <p><strong>Spoilage Risk:</strong> {route.spoilageRisk.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nodes" className="space-y-4">
          {/* Add Node Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search-based node addition */}
              <div>
                <Label>Search Location</Label>
                <Input
                  ref={nodeSearchRef}
                  placeholder="Search and add location (e.g., 'Amul Dairy Store, MG Road')"
                  className="mt-1"
                />
              </div>

              {/* Coordinate-based node addition */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Latitude"
                  value={nodeCoordinateInput.lat}
                  onChange={(e) => setNodeCoordinateInput(prev => ({ ...prev, lat: e.target.value }))}
                />
                <Input
                  placeholder="Longitude"
                  value={nodeCoordinateInput.lng}
                  onChange={(e) => setNodeCoordinateInput(prev => ({ ...prev, lng: e.target.value }))}
                />
                <Button onClick={addNodeFromCoordinates} variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Node List */}
          <Card>
            <CardHeader>
              <CardTitle>Network Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {nodes.map((node) => (
                    <div key={node.id} className={`p-4 border rounded-lg ${!node.isVisible ? 'opacity-50 bg-muted/50' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getNodeEmoji(node.type)}</span>
                          <span className="font-semibold">{node.name}</span>
                          <Badge variant="outline">{node.type}</Badge>
                          {!node.isVisible && <Badge variant="secondary">Hidden</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={node.isVisible}
                            onCheckedChange={() => toggleNodeVisibility(node.id)}
                          />
                          <Button onClick={() => setEditingNode(node)} size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => deleteNode(node.id)} size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Type:</strong> {getNodeTypeLabel(node.type).split(' - ')[0]}</p>
                        <p><strong>Location:</strong> {node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)}</p>
                        <p><strong>Capacity:</strong> {node.capacity.storage}L</p>
                        <p><strong>Hours:</strong> {node.operatingHours.open} - {node.operatingHours.close}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <ProductManagement
            selectedProducts={selectedProducts}
            onProductsChange={onProductsChange}
            selectedVehicles={selectedVehicles}
            onVehiclesChange={onVehiclesChange}
          />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {/* Optimization Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Network Optimization Constraints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Maximum Distance: {constraints.maxDistanceKm}km</Label>
                  <Slider
                    value={[constraints.maxDistanceKm]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxDistanceKm: value }))}
                    min={10}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum route distance allowed</p>
                </div>
                
                <div>
                  <Label>Max Delivery Time: {constraints.maxDeliveryTimeHours}h</Label>
                  <Slider
                    value={[constraints.maxDeliveryTimeHours]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxDeliveryTimeHours: value }))}
                    min={1}
                    max={24}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum delivery time constraint</p>
                </div>
                
                <div>
                  <Label>Temperature Threshold: {constraints.temperatureThresholdC}°C</Label>
                  <Slider
                    value={[constraints.temperatureThresholdC]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, temperatureThresholdC: value }))}
                    min={-5}
                    max={25}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum temperature for quality maintenance</p>
                </div>
                
                <div>
                  <Label>Quality Retention: {constraints.qualityRetentionPercent}%</Label>
                  <Slider
                    value={[constraints.qualityRetentionPercent]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, qualityRetentionPercent: value }))}
                    min={80}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum quality retention required</p>
                </div>
                
                <div className="md:col-span-2">
                  <Label>Cost per Kilometer: ₹{constraints.costPerKm}</Label>
                  <Slider
                    value={[constraints.costPerKm]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, costPerKm: value }))}
                    min={5}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Transportation cost per kilometer</p>
                </div>
              </div>
              
              <Button onClick={runOptimization} disabled={isOptimizing} className="w-full" size="lg">
                {isOptimizing ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isOptimizing ? 'Optimizing Network...' : 'Run Network Optimization'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Node Editor Modal */}
      {editingNode && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
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
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => {
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
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={() => setEditingNode(null)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
