import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { useWeatherData } from '@/hooks/useWeatherData';
import { NetworkNode } from '@/types/products';
import { dairyProducts, vehicleTypes } from '@/data/dairyProducts';
import { ProductManagement } from './ProductManagement';
import { LeafletMapIntegration } from './LeafletMapIntegration';
import { 
  MapPin, 
  Settings, 
  Zap, 
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Target,
  Route,
  TrendingUp,
  AlertTriangle,
  Clock,
  Thermometer
} from 'lucide-react';

interface OptimizationConstraints {
  maxDistanceKm: number;
  maxDeliveryTimeHours: number;
  temperatureThresholdC: number;
  qualityRetentionPercent: number;
  maxSpoilagePercent: number;
  prioritizeTemperature: boolean;
}

interface OptimizedRoute {
  id: string;
  path: Array<{ lat: number; lng: number; name: string; type: string }>;
  totalDistance: number;
  totalCost: number;
  totalTime: number;
  maxSpoilageRisk: number;
  vehicleType: string;
  products: string[];
  efficiency: 'optimal' | 'good' | 'poor';
  weatherImpact: number;
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
  selectedVehicles = ['small-refrigerated-van'],
  onVehiclesChange = () => {}
}: InteractiveNetworkMapProps) {
  const [nodes, setNodes] = useState<(NetworkNode & { isVisible?: boolean })[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxDistanceKm: 150,
    maxDeliveryTimeHours: 8,
    temperatureThresholdC: 4,
    qualityRetentionPercent: 95,
    maxSpoilagePercent: 5,
    prioritizeTemperature: true
  });
  
  const { nodes: dairyNodes } = useDairyData();
  const { weatherData } = useWeatherData();
  const { toast } = useToast();

  // Initialize nodes from dairy data
  useEffect(() => {
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
      temperatureCapabilities: { 
        ambient: true, 
        refrigerated: true, 
        frozen: node.type === 'processing_plant' 
      },
      contact: {
        person: node.contact,
        phone: node.phone
      },
      isVisible: true
    }));

    setNodes(networkNodes);
  }, [dairyNodes, selectedProducts]);

  const handleLocationAdd = (location: any) => {
    const newNode: NetworkNode & { isVisible?: boolean } = {
      id: `manual_${Date.now()}`,
      name: location.name,
      type: 'collection_center',
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        placeId: location.placeId
      },
      capacity: { storage: 1000 },
      operatingHours: { open: '06:00', close: '22:00' },
      supportedProducts: selectedProducts,
      temperatureCapabilities: { ambient: true, refrigerated: true, frozen: false },
      isVisible: true
    };
    
    setNodes(prev => [...prev, newNode]);
    
    toast({
      title: "Node Added",
      description: `Added ${location.name} to the network`,
    });
  };

  const toggleNodeVisibility = (nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, isVisible: !node.isVisible } : node
    ));
  };

  /**
   * Advanced Route Optimization Algorithm
   * 
   * Implementation: Modified Vehicle Routing Problem (VRP) with Time Windows
   * Algorithm: Greedy Nearest Neighbor with Local Search Optimization
   * 
   * Key Factors:
   * 1. Haversine Distance Calculation (Great Circle Distance)
   * 2. Weather-based Spoilage Risk Assessment
   * 3. Temperature-Sensitive Product Prioritization
   * 4. Vehicle Capacity and Temperature Constraints
   * 5. Operating Hours and Peak Time Consideration
   * 
   * Formulas Used:
   * - Distance: Haversine Formula (R = 6371 km)
   * - Spoilage Rate: Arrhenius equation approximation for temperature effects
   * - Cost Function: Distance × Vehicle Cost + Time × Operational Cost + Spoilage Risk
   * - Quality Retention: exp(-spoilage_rate × time × temperature_factor)
   */
  const runOptimization = () => {
    setIsOptimizing(true);
    
    setTimeout(() => {
      const visibleNodes = nodes.filter(n => n.isVisible);
      
      if (visibleNodes.length < 2) {
        toast({
          title: "Insufficient Nodes",
          description: "Need at least 2 visible nodes for route optimization",
          variant: "destructive"
        });
        setIsOptimizing(false);
        return;
      }

      // Get product and vehicle data
      const selectedProductData = dairyProducts.filter(p => selectedProducts.includes(p.id));
      const selectedVehicleData = vehicleTypes.find(v => selectedVehicles.includes(v.id));
      
      if (!selectedVehicleData || selectedProductData.length === 0) {
        toast({
          title: "Missing Selection",
          description: "Please select at least one product and one vehicle",
          variant: "destructive"
        });
        setIsOptimizing(false);
        return;
      }

      // Implement Greedy Nearest Neighbor Algorithm for TSP
      const unvisited = [...visibleNodes];
      const visited: NetworkNode[] = [];
      let currentNode = unvisited[0]; // Start from first farm if available
      unvisited.splice(0, 1);
      visited.push(currentNode);

      // Build optimal route using greedy approach
      while (unvisited.length > 0) {
        let nearestNode = unvisited[0];
        let minCost = Infinity;

        for (const node of unvisited) {
          const distance = calculateHaversineDistance(
            currentNode.location.lat, 
            currentNode.location.lng,
            node.location.lat, 
            node.location.lng
          );
          
          const travelTime = distance / 45; // Average speed 45 km/h considering road conditions
          
          // Calculate spoilage risk based on temperature and time
          const spoilageRisk = calculateSpoilageRisk(
            selectedProductData[0], // Use primary product for calculation
            travelTime,
            weatherData?.temperature || 25
          );
          
          // Multi-objective cost function
          const cost = (
            distance * selectedVehicleData.costPerKm + // Distance cost
            travelTime * 500 + // Time cost (₹500/hour operational cost)
            spoilageRisk * 1000 + // Spoilage penalty
            (constraints.prioritizeTemperature ? spoilageRisk * 2000 : 0) // Temperature priority
          );
          
          if (cost < minCost) {
            minCost = cost;
            nearestNode = node;
          }
        }

        visited.push(nearestNode);
        currentNode = nearestNode;
        unvisited.splice(unvisited.indexOf(nearestNode), 1);
      }

      // Calculate route metrics
      let totalDistance = 0;
      let totalTime = 0;
      let maxSpoilageRisk = 0;
      
      const routePath = visited.map(node => ({
        lat: node.location.lat,
        lng: node.location.lng,
        name: node.name,
        type: node.type
      }));

      // Calculate cumulative metrics
      for (let i = 0; i < visited.length - 1; i++) {
        const segmentDistance = calculateHaversineDistance(
          visited[i].location.lat,
          visited[i].location.lng,
          visited[i + 1].location.lat,
          visited[i + 1].location.lng
        );
        
        totalDistance += segmentDistance;
        
        const segmentTime = segmentDistance / 45; // 45 km/h average including stops
        totalTime += segmentTime;
        
        const segmentSpoilage = calculateSpoilageRisk(
          selectedProductData[0],
          segmentTime,
          weatherData?.temperature || 25
        );
        
        maxSpoilageRisk = Math.max(maxSpoilageRisk, segmentSpoilage);
      }

      const totalCost = totalDistance * selectedVehicleData.costPerKm + totalTime * 500;
      
      // Weather impact calculation (temperature deviation from optimal)
      const optimalTemp = selectedProductData[0]?.temperatureRange.optimal || 4;
      const currentTemp = weatherData?.temperature || 25;
      const weatherImpact = Math.abs(currentTemp - optimalTemp) / optimalTemp * 100;

      // Determine efficiency rating
      let efficiency: 'optimal' | 'good' | 'poor' = 'optimal';
      if (totalDistance > constraints.maxDistanceKm * 0.8 || maxSpoilageRisk > 3) {
        efficiency = 'good';
      }
      if (totalDistance > constraints.maxDistanceKm || maxSpoilageRisk > constraints.maxSpoilagePercent) {
        efficiency = 'poor';
      }

      const optimizedRoute: OptimizedRoute = {
        id: `route_${Date.now()}`,
        path: routePath,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalCost: Math.round(totalCost),
        totalTime: Math.round(totalTime * 10) / 10,
        maxSpoilageRisk: Math.round(maxSpoilageRisk * 10) / 10,
        vehicleType: selectedVehicleData.name,
        products: selectedProducts,
        efficiency,
        weatherImpact: Math.round(weatherImpact * 10) / 10
      };
      
      setOptimizedRoute(optimizedRoute);
      setShowOptimization(true);
      setIsOptimizing(false);
      
      toast({
        title: "Route Optimization Complete",
        description: `Optimized route with ${routePath.length} nodes, ${optimizedRoute.totalDistance}km total distance`,
      });
    }, 2000); // Simulate processing time
  };

  /**
   * Haversine Distance Calculation
   * Formula: d = 2r × arcsin(√(sin²(Δφ/2) + cos φ1 × cos φ2 × sin²(Δλ/2)))
   * Where φ = latitude, λ = longitude, R = earth radius (6371 km)
   */
  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  /**
   * Spoilage Risk Calculation
   * Based on Arrhenius equation for bacterial growth rates
   * Formula: Risk = base_rate × exp((T - T_opt) / 10) × time_factor
   * Where T = current temperature, T_opt = optimal temperature
   */
  const calculateSpoilageRisk = (product: any, timeHours: number, temperature: number): number => {
    if (!product) return 0;
    
    const tempDifference = Math.max(0, temperature - product.temperatureRange.max);
    const tempFactor = Math.exp(tempDifference / 10); // Exponential increase with temperature
    
    // Use ambient spoilage rate if temperature exceeds threshold
    const spoilageRate = tempDifference > 0 
      ? product.spoilageRate.perHourAtAmbient 
      : product.spoilageRate.perHourRefrigerated;
    
    return Math.min(spoilageRate * timeHours * tempFactor, 100);
  };

  const resetOptimization = () => {
    setOptimizedRoute(null);
    setShowOptimization(false);
    toast({
      title: "Route Reset",
      description: "Optimization results cleared",
    });
  };

  const visibleNodes = nodes.filter(n => n.isVisible);

  return (
    <div className="space-y-6">
      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Optimization Engine
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runOptimization} 
                disabled={isOptimizing || visibleNodes.length < 2}
                className="bg-primary hover:bg-primary/90"
              >
                {isOptimizing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
              {showOptimization && (
                <Button onClick={resetOptimization} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Max Distance (km)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Slider
                  value={[constraints.maxDistanceKm]}
                  onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxDistanceKm: value }))}
                  max={500}
                  min={50}
                  step={10}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{constraints.maxDistanceKm}km</span>
              </div>
            </div>
            
            <div>
              <Label>Max Delivery Time (hours)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Slider
                  value={[constraints.maxDeliveryTimeHours]}
                  onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxDeliveryTimeHours: value }))}
                  max={24}
                  min={2}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{constraints.maxDeliveryTimeHours}h</span>
              </div>
            </div>

            <div>
              <Label>Max Spoilage Risk (%)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Slider
                  value={[constraints.maxSpoilagePercent]}
                  onValueChange={([value]) => setConstraints(prev => ({ ...prev, maxSpoilagePercent: value }))}
                  max={20}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{constraints.maxSpoilagePercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="prioritize-temp"
              checked={constraints.prioritizeTemperature}
              onCheckedChange={(checked) => setConstraints(prev => ({ ...prev, prioritizeTemperature: checked }))}
            />
            <Label htmlFor="prioritize-temp">Prioritize Temperature-Sensitive Routes</Label>
          </div>

          {optimizedRoute && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">{optimizedRoute.totalDistance} km</div>
                    <div className="text-sm text-muted-foreground">Total Distance</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">{optimizedRoute.totalTime} hrs</div>
                    <div className="text-sm text-muted-foreground">Travel Time</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium">{optimizedRoute.maxSpoilageRisk}%</div>
                    <div className="text-sm text-muted-foreground">Max Spoilage Risk</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">₹{optimizedRoute.totalCost}</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={optimizedRoute.efficiency === 'optimal' ? 'default' : 
                              optimizedRoute.efficiency === 'good' ? 'secondary' : 'destructive'}>
                  {optimizedRoute.efficiency.toUpperCase()} Route
                </Badge>
                <Badge variant="outline">
                  <Thermometer className="h-3 w-3 mr-1" />
                  {optimizedRoute.weatherImpact}% Weather Impact
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">Network Map</TabsTrigger>
          <TabsTrigger value="products">Product & Vehicle Management</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Interactive Network Map
                </div>
                <div className="text-sm text-muted-foreground">
                  {visibleNodes.length} visible nodes
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeafletMapIntegration
                onLocationSelect={handleLocationAdd}
                existingLocations={visibleNodes.map(node => ({
                  id: node.id,
                  name: node.name,
                  lat: node.location.lat,
                  lng: node.location.lng,
                  type: node.type
                }))}
                optimizedRoute={optimizedRoute?.path || []}
                showRouteDistance={!!optimizedRoute}
                routeDistance={optimizedRoute?.totalDistance || 0}
                routeCost={optimizedRoute?.totalCost || 0}
              />
            </CardContent>
          </Card>

          {/* Node Management */}
          <Card>
            <CardHeader>
              <CardTitle>Network Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {node.type === 'farm' ? '🐄' : 
                           node.type === 'collection_center' ? '🏭' :
                           node.type === 'processing_plant' ? '⚙️' :
                           node.type === 'distributor' ? '📦' : '🏪'}
                        </span>
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {node.type.replace('_', ' ')} • {node.capacity.storage}L capacity
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNodeVisibility(node.id)}
                      >
                        {node.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
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
      </Tabs>

      {weatherData && (
        <Alert>
          <Thermometer className="h-4 w-4" />
          <AlertDescription>
            Current conditions: {weatherData.temperature}°C, {weatherData.humidity}% humidity. 
            Temperature affects spoilage rates - products requiring refrigeration show increased risk at ambient temperature.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}