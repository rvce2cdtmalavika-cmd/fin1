import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import { LatLng, Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Truck, Thermometer, Clock, IndianRupee, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Custom icons for different node types using divIcon (more reliable)
const createIcon = (color: string, emoji: string) => {
  return divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const nodeIcons = {
  dairy_farm: createIcon('#4CAF50', '🐄'),
  processing_plant: createIcon('#2196F3', '🏭'),
  cold_storage: createIcon('#00BCD4', '❄️'),
  distribution_center: createIcon('#FF9800', '📦'),
  retail_store: createIcon('#9C27B0', '🏪'),
  supermarket: createIcon('#607D8B', '🛒'),
};

// Bengaluru specific locations for demo
const bengaluruLocations = {
  dairy_farms: [
    { name: "Nandini Dairy Farm - Yelahanka", lat: 13.1007, lng: 77.5963, capacity: 5000 },
    { name: "Heritage Dairy Farm - Devanahalli", lat: 13.2426, lng: 77.7085, capacity: 3000 },
  ],
  processing_plants: [
    { name: "Karnataka Milk Federation - Yeshwantpur", lat: 13.0280, lng: 77.5347, capacity: 10000 },
    { name: "Hatsun Dairy Plant - Electronic City", lat: 12.8456, lng: 77.6603, capacity: 8000 },
  ],
  cold_storages: [
    { name: "Snowman Logistics - Whitefield", lat: 12.9698, lng: 77.7500, capacity: 2000, temp_range: "2-8°C" },
    { name: "ColdStar - Bommanahalli", lat: 12.9165, lng: 77.6101, capacity: 1500, temp_range: "2-8°C" },
  ],
  retail_stores: [
    { name: "More Supermarket - Koramangala", lat: 12.9279, lng: 77.6271, demand: 500 },
    { name: "BigBazaar - Forum Mall", lat: 12.9279, lng: 77.6271, demand: 800 },
    { name: "Reliance Fresh - HSR Layout", lat: 12.9082, lng: 77.6476, demand: 300 },
  ]
};

// Vehicle types for dairy logistics
const vehicleTypes = {
  refrigerated_truck_small: {
    name: "Small Refrigerated Truck",
    capacity: 1000, // kg
    cost_per_km: 25, // INR
    speed: 35, // km/h in city
    temp_control: true,
    icon: "🚛"
  },
  refrigerated_truck_large: {
    name: "Large Refrigerated Truck",
    capacity: 5000,
    cost_per_km: 45,
    speed: 30,
    temp_control: true,
    icon: "🚚"
  },
  insulated_van: {
    name: "Insulated Van",
    capacity: 500,
    cost_per_km: 18,
    speed: 40,
    temp_control: false,
    icon: "🚐"
  }
};

interface Node {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: number;
  demand?: number;
  temp_range?: string;
  operating_hours?: string;
  products?: string[];
}

interface Edge {
  id: string;
  from: string;
  to: string;
  distance: number;
  time: number;
  cost: number;
  vehicle_type: string;
  route?: LatLng[];
}

interface Product {
  name: string;
  shelf_life: number; // hours
  temp_requirement: string;
  handling_time: number; // minutes
  value_per_kg: number; // INR
}

const dairyProducts: Record<string, Product> = {
  milk: {
    name: "Fresh Milk",
    shelf_life: 48,
    temp_requirement: "2-8°C",
    handling_time: 5,
    value_per_kg: 50
  },
  yogurt: {
    name: "Yogurt",
    shelf_life: 168, // 7 days
    temp_requirement: "2-8°C",
    handling_time: 8,
    value_per_kg: 80
  },
  cheese: {
    name: "Cheese",
    shelf_life: 720, // 30 days
    temp_requirement: "2-8°C",
    handling_time: 10,
    value_per_kg: 400
  },
  butter: {
    name: "Butter",
    shelf_life: 1440, // 60 days
    temp_requirement: "2-8°C",
    handling_time: 6,
    value_per_kg: 350
  }
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SupplyChainApp() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('milk');
  const [optimizationObjective, setOptimizationObjective] = useState<string>('cost');
  const [activeTab, setActiveTab] = useState<string>('map');
  const [isAddingNode, setIsAddingNode] = useState<boolean>(false);
  const [newNodeType, setNewNodeType] = useState<string>('retail_store');
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  
  const { toast } = useToast();
  const mapRef = useRef<any>(null);

  // Initialize with some Bengaluru locations
  useEffect(() => {
    const initialNodes: Node[] = [];
    
    // Add dairy farms
    bengaluruLocations.dairy_farms.forEach((farm, index) => {
      initialNodes.push({
        id: `farm_${index}`,
        name: farm.name,
        type: 'dairy_farm',
        lat: farm.lat,
        lng: farm.lng,
        capacity: farm.capacity,
        operating_hours: "5:00 AM - 8:00 PM",
        products: ['milk']
      });
    });

    // Add processing plants
    bengaluruLocations.processing_plants.forEach((plant, index) => {
      initialNodes.push({
        id: `plant_${index}`,
        name: plant.name,
        type: 'processing_plant',
        lat: plant.lat,
        lng: plant.lng,
        capacity: plant.capacity,
        operating_hours: "24/7",
        products: ['milk', 'yogurt', 'cheese', 'butter']
      });
    });

    // Add cold storages
    bengaluruLocations.cold_storages.forEach((storage, index) => {
      initialNodes.push({
        id: `cold_${index}`,
        name: storage.name,
        type: 'cold_storage',
        lat: storage.lat,
        lng: storage.lng,
        capacity: storage.capacity,
        temp_range: storage.temp_range,
        operating_hours: "24/7",
        products: ['milk', 'yogurt', 'cheese', 'butter']
      });
    });

    // Add retail stores
    bengaluruLocations.retail_stores.forEach((store, index) => {
      initialNodes.push({
        id: `retail_${index}`,
        name: store.name,
        type: 'retail_store',
        lat: store.lat,
        lng: store.lng,
        demand: store.demand,
        operating_hours: "8:00 AM - 10:00 PM",
        products: ['milk', 'yogurt', 'cheese', 'butter']
      });
    });

    setNodes(initialNodes);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddingNode) {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        name: `New ${newNodeType.replace('_', ' ')} - ${addressSearch || 'Custom Location'}`,
        type: newNodeType,
        lat,
        lng,
        capacity: newNodeType.includes('farm') || newNodeType.includes('plant') ? 1000 : 500,
        operating_hours: "8:00 AM - 6:00 PM",
        products: ['milk']
      };
      
      setNodes(prev => [...prev, newNode]);
      setIsAddingNode(false);
      toast({
        title: "Node Added",
        description: `Added new ${newNodeType.replace('_', ' ')} at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      // Using Nominatim API for geocoding (free OpenStreetMap service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Bengaluru, Karnataka, India')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        // Center map on the location
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
        
        toast({
          title: "Location Found",
          description: `Found: ${data[0].display_name}`,
        });
        
        return { lat, lng };
      } else {
        toast({
          title: "Location Not Found",
          description: "Please try a different address or use the map to select a location.",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Geocoding Error",
        description: "Failed to find location. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const calculateRoute = async (from: Node, to: Node, vehicleType: string) => {
    try {
      // Using OSRM API for routing (free OpenStreetMap routing service)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 3600; // Convert to hours
        
        const vehicle = vehicleTypes[vehicleType as keyof typeof vehicleTypes];
        const cost = distance * vehicle.cost_per_km;
        
        // Convert coordinates for Leaflet
        const routeCoords = route.geometry.coordinates.map((coord: number[]) => 
          new LatLng(coord[1], coord[0])
        );
        
        return {
          distance,
          time: duration,
          cost,
          route: routeCoords
        };
      }
    } catch (error) {
      console.error('Routing error:', error);
    }
    
    // Fallback to straight-line calculation
    const distance = calculateStraightLineDistance(from, to);
    const vehicle = vehicleTypes[vehicleType as keyof typeof vehicleTypes];
    const time = distance / vehicle.speed;
    const cost = distance * vehicle.cost_per_km;
    
    return { distance, time, cost, route: [new LatLng(from.lat, from.lng), new LatLng(to.lat, to.lng)] };
  };

  const calculateStraightLineDistance = (from: Node, to: Node): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const optimizeNetwork = async () => {
    setIsOptimizing(true);
    
    try {
      // Simple optimization algorithm for demo
      // In reality, this would use OR-Tools or similar
      const product = dairyProducts[selectedProduct];
      const sources = nodes.filter(n => n.type === 'dairy_farm' || n.type === 'processing_plant');
      const destinations = nodes.filter(n => n.type === 'retail_store' || n.type === 'supermarket');
      const intermediates = nodes.filter(n => n.type === 'cold_storage' || n.type === 'distribution_center');
      
      const routes = [];
      let totalCost = 0;
      let totalTime = 0;
      let totalDistance = 0;
      
      // For each destination, find the best route
      for (const dest of destinations) {
        let bestRoute = null;
        let minCost = Infinity;
        
        // Try direct routes from sources
        for (const source of sources) {
          const routeData = await calculateRoute(source, dest, 'refrigerated_truck_small');
          if (routeData && routeData.cost < minCost && routeData.time <= product.shelf_life) {
            minCost = routeData.cost;
            bestRoute = {
              from: source,
              to: dest,
              ...routeData,
              vehicle: 'refrigerated_truck_small',
              spoilage_risk: routeData.time / product.shelf_life
            };
          }
        }
        
        // Try routes via intermediates if direct route is too expensive or slow
        for (const source of sources) {
          for (const intermediate of intermediates) {
            const leg1 = await calculateRoute(source, intermediate, 'refrigerated_truck_large');
            const leg2 = await calculateRoute(intermediate, dest, 'refrigerated_truck_small');
            
            if (leg1 && leg2) {
              const totalRouteCost = leg1.cost + leg2.cost + 50; // handling cost
              const totalRouteTime = leg1.time + leg2.time + 0.5; // handling time
              
              if (totalRouteCost < minCost && totalRouteTime <= product.shelf_life) {
                minCost = totalRouteCost;
                bestRoute = {
                  from: source,
                  via: intermediate,
                  to: dest,
                  distance: leg1.distance + leg2.distance,
                  time: totalRouteTime,
                  cost: totalRouteCost,
                  route: [...(leg1.route || []), ...(leg2.route || [])],
                  vehicle: 'mixed',
                  spoilage_risk: totalRouteTime / product.shelf_life
                };
              }
            }
          }
        }
        
        if (bestRoute) {
          routes.push(bestRoute);
          totalCost += bestRoute.cost;
          totalTime += bestRoute.time;
          totalDistance += bestRoute.distance;
        }
      }
      
      setOptimizationResults({
        routes,
        summary: {
          totalCost,
          totalTime,
          totalDistance,
          averageSpoilageRisk: routes.reduce((sum, r) => sum + r.spoilage_risk, 0) / routes.length,
          productType: selectedProduct,
          objective: optimizationObjective
        }
      });
      
      // Create edges for visualization
      const newEdges: Edge[] = routes.map((route, index) => ({
        id: `route_${index}`,
        from: route.from.id,
        to: route.to.id,
        distance: route.distance,
        time: route.time,
        cost: route.cost,
        vehicle_type: route.vehicle,
        route: route.route
      }));
      
      setEdges(newEdges);
      
      toast({
        title: "Optimization Complete",
        description: `Found ${routes.length} optimal routes with total cost ₹${totalCost.toFixed(2)}`,
      });
      
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Error occurred during optimization. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Dairy Supply Chain Optimizer - Bengaluru
          </h1>
          <p className="text-muted-foreground">
            Optimize cold chain logistics for dairy products across Bengaluru using real-world data
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="optimize">Optimization</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Supply Chain Network Map
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search address in Bengaluru..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      className="max-w-xs"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && addressSearch) {
                          geocodeAddress(addressSearch);
                        }
                      }}
                    />
                    <Button onClick={() => geocodeAddress(addressSearch)} disabled={!addressSearch}>
                      Search
                    </Button>
                  </div>
                  <Select value={newNodeType} onValueChange={setNewNodeType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dairy_farm">Dairy Farm</SelectItem>
                      <SelectItem value="processing_plant">Processing Plant</SelectItem>
                      <SelectItem value="cold_storage">Cold Storage</SelectItem>
                      <SelectItem value="distribution_center">Distribution Center</SelectItem>
                      <SelectItem value="retail_store">Retail Store</SelectItem>
                      <SelectItem value="supermarket">Supermarket</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setIsAddingNode(!isAddingNode)}
                    variant={isAddingNode ? "destructive" : "logistics"}
                  >
                    {isAddingNode ? "Cancel" : "Add Node"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full rounded-lg overflow-hidden border relative">
                  <MapContainer
                    center={[12.9716, 77.5946]} // Bengaluru center
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapClickHandler onMapClick={handleMapClick} />
                    
                    {nodes.map((node) => (
                      <Marker
                        key={node.id}
                        position={[node.lat, node.lng]}
                        icon={nodeIcons[node.type as keyof typeof nodeIcons]}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{node.name}</h3>
                            <p className="text-sm text-muted-foreground">{node.type.replace('_', ' ')}</p>
                            {node.capacity && <p className="text-sm">Capacity: {node.capacity} kg</p>}
                            {node.demand && <p className="text-sm">Demand: {node.demand} kg/day</p>}
                            {node.temp_range && <p className="text-sm">Temperature: {node.temp_range}</p>}
                            {node.operating_hours && <p className="text-sm">Hours: {node.operating_hours}</p>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {edges.map((edge) => 
                      edge.route ? (
                        <Polyline
                          key={edge.id}
                          positions={edge.route}
                          color="#2563eb"
                          weight={3}
                          opacity={0.7}
                        />
                      ) : null
                    )}
                  </MapContainer>
                </div>
                
                {isAddingNode && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Click on the map to add a new {newNodeType.replace('_', ' ')} location
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="product">Select Dairy Product</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(dairyProducts).map(([key, product]) => (
                          <SelectItem key={key} value={key}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProduct && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Product Details:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Shelf Life: {dairyProducts[selectedProduct].shelf_life}h
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          Temp: {dairyProducts[selectedProduct].temp_requirement}
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          Value: ₹{dairyProducts[selectedProduct].value_per_kg}/kg
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Handling: {dairyProducts[selectedProduct].handling_time}min
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Vehicle Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(vehicleTypes).map(([key, vehicle]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{vehicle.icon}</span>
                          <span className="font-medium">{vehicle.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>Capacity: {vehicle.capacity} kg</div>
                          <div>Cost: ₹{vehicle.cost_per_km}/km</div>
                          <div>Speed: {vehicle.speed} km/h</div>
                          <div>{vehicle.temp_control ? "Temperature Controlled" : "Standard"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="objective">Optimization Objective</Label>
                  <Select value={optimizationObjective} onValueChange={setOptimizationObjective}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Minimize Total Cost</SelectItem>
                      <SelectItem value="time">Minimize Delivery Time</SelectItem>
                      <SelectItem value="spoilage">Minimize Spoilage Risk</SelectItem>
                      <SelectItem value="balanced">Balanced Approach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Network:</h4>
                    <div className="space-y-1 text-sm">
                      <div>Sources: {nodes.filter(n => n.type.includes('farm') || n.type.includes('plant')).length}</div>
                      <div>Intermediates: {nodes.filter(n => n.type.includes('storage') || n.type.includes('distribution')).length}</div>
                      <div>Destinations: {nodes.filter(n => n.type.includes('retail') || n.type.includes('supermarket')).length}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Product: {dairyProducts[selectedProduct]?.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div>Shelf Life: {dairyProducts[selectedProduct]?.shelf_life}h</div>
                      <div>Temperature: {dairyProducts[selectedProduct]?.temp_requirement}</div>
                      <div>Value: ₹{dairyProducts[selectedProduct]?.value_per_kg}/kg</div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={optimizeNetwork} 
                  disabled={isOptimizing || nodes.length < 2}
                  className="w-full"
                  variant="logistics"
                  size="lg"
                >
                  {isOptimizing ? "Optimizing Supply Chain..." : "🚀 Run Optimization"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {optimizationResults ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">₹{optimizationResults.summary.totalCost.toFixed(2)}</div>
                        <div className="text-sm text-blue-800">Total Cost</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{optimizationResults.summary.totalDistance.toFixed(1)}km</div>
                        <div className="text-sm text-green-800">Total Distance</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{optimizationResults.summary.totalTime.toFixed(1)}h</div>
                        <div className="text-sm text-orange-800">Total Time</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{(optimizationResults.summary.averageSpoilageRisk * 100).toFixed(1)}%</div>
                        <div className="text-sm text-red-800">Spoilage Risk</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimal Routes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimizationResults.routes.map((route: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {route.from.name} → {route.via ? `${route.via.name} → ` : ''}{route.to.name}
                            </div>
                            <Badge variant={route.spoilage_risk < 0.5 ? "default" : route.spoilage_risk < 0.8 ? "secondary" : "destructive"}>
                              {route.spoilage_risk < 0.5 ? "Low Risk" : route.spoilage_risk < 0.8 ? "Medium Risk" : "High Risk"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>Distance: {route.distance.toFixed(1)}km</div>
                            <div>Time: {route.time.toFixed(1)}h</div>
                            <div>Cost: ₹{route.cost.toFixed(2)}</div>
                            <div>Vehicle: {route.vehicle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Run optimization to see results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}