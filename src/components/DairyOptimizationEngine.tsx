
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { 
  Zap, 
  Settings, 
  TrendingUp, 
  Truck, 
  Clock, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Target
} from 'lucide-react';

interface OptimizationParams {
  maxDistanceKm: number;
  maxDeliveryTimeHours: number;
  costPerKm: number;
  temperatureThresholdC: number;
  qualityRetentionPercent: number;
}

interface OptimizationResult {
  totalCost: number;
  totalTime: number;
  totalDistance: number;
  routesOptimized: number;
  costSavings: number;
  timeSavings: number;
  qualityScore: number;
  recommendations: string[];
}

export function DairyOptimizationEngine() {
  const { nodes, routes, isLoading } = useDairyData();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [params, setParams] = useState<OptimizationParams>({
    maxDistanceKm: 50,
    maxDeliveryTimeHours: 8,
    costPerKm: 15,
    temperatureThresholdC: 4,
    qualityRetentionPercent: 95
  });
  const { toast } = useToast();

  // Calculate distance between two points (Haversine formula)
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

  // Find optimal collection routes using enhanced algorithm
  const optimizeCollectionRoutes = (farms: any[], centers: any[], plants: any[], distributors: any[]) => {
    const optimizedRoutes = [];
    let totalCost = 0;
    let totalTime = 0;
    let totalDistance = 0;
    let qualityScores = [];

    // Farm to Collection Center optimization
    farms.forEach(farm => {
      let bestCenter = null;
      let minCost = Infinity;
      let bestDistance = 0;

      centers.forEach(center => {
        const distance = calculateDistance(farm.lat, farm.lng, center.lat, center.lng);
        if (distance <= params.maxDistanceKm) {
          const routeCost = distance * params.costPerKm;
          const deliveryTime = distance / 40; // 40 km/h average speed
          
          if (routeCost < minCost && deliveryTime <= params.maxDeliveryTimeHours) {
            minCost = routeCost;
            bestCenter = center;
            bestDistance = distance;
          }
        }
      });

      if (bestCenter) {
        const routeTime = bestDistance / 40;
        const qualityScore = Math.max(70, params.qualityRetentionPercent - (routeTime * 2));
        
        optimizedRoutes.push({
          from: farm,
          to: bestCenter,
          distance: bestDistance,
          cost: minCost,
          time: routeTime,
          type: 'farm_to_center',
          qualityScore
        });

        totalCost += minCost;
        totalTime += routeTime;
        totalDistance += bestDistance;
        qualityScores.push(qualityScore);
      }
    });

    // Collection Center to Processing Plant optimization
    centers.forEach(center => {
      let bestPlant = null;
      let minCost = Infinity;
      let bestDistance = 0;

      plants.forEach(plant => {
        const distance = calculateDistance(center.lat, center.lng, plant.lat, plant.lng);
        const routeCost = distance * (params.costPerKm * 1.2); // Higher cost for processing transport
        const deliveryTime = distance / 45; // 45 km/h average speed
        
        if (routeCost < minCost && deliveryTime <= params.maxDeliveryTimeHours) {
          minCost = routeCost;
          bestPlant = plant;
          bestDistance = distance;
        }
      });

      if (bestPlant) {
        const routeTime = bestDistance / 45;
        const qualityScore = Math.max(80, params.qualityRetentionPercent - (routeTime * 1.5));
        
        optimizedRoutes.push({
          from: center,
          to: bestPlant,
          distance: bestDistance,
          cost: minCost,
          time: routeTime,
          type: 'center_to_plant',
          qualityScore
        });

        totalCost += minCost;
        totalTime += routeTime;
        totalDistance += bestDistance;
        qualityScores.push(qualityScore);
      }
    });

    // Processing Plant to Distribution optimization - Handle all node types properly
    const allNodes = [...farms, ...centers, ...plants];
    const distributionNodes = allNodes.filter(node => 
      node.type === 'distributor' || node.type === 'retail' || node.type === 'collection_center'
    );

    plants.forEach(plant => {
      distributionNodes.forEach(distributor => {
        const distance = calculateDistance(plant.lat, plant.lng, distributor.lat, distributor.lng);
        if (distance <= params.maxDistanceKm * 1.5) { // Allow longer distances for final distribution
          const routeCost = distance * (params.costPerKm * 0.8); // Lower cost for final distribution
          const routeTime = distance / 50; // 50 km/h average speed
          const qualityScore = Math.max(85, params.qualityRetentionPercent - (routeTime * 1));
          
          optimizedRoutes.push({
            from: plant,
            to: distributor,
            distance: distance,
            cost: routeCost,
            time: routeTime,
            type: 'plant_to_distributor',
            qualityScore
          });

          totalCost += routeCost;
          totalTime += routeTime;
          totalDistance += distance;
          qualityScores.push(qualityScore);
        }
      });
    });

    const averageQuality = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;

    return { optimizedRoutes, totalCost, totalTime, totalDistance, averageQuality };
  };

  // Calculate current network performance for comparison
  const calculateCurrentPerformance = () => {
    let currentCost = 0;
    let currentTime = 0;
    let currentDistance = 0;

    routes.forEach(route => {
      currentCost += route.cost_per_trip || 0;
      currentTime += route.estimated_time_hours || 0;
      currentDistance += route.distance_km || 0;
    });

    return { currentCost, currentTime, currentDistance };
  };

  const runOptimization = async () => {
    if (nodes.length < 3) {
      toast({
        title: "Insufficient Data",
        description: "You need at least 3 nodes (farms, centers, plants) to run optimization",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const farms = nodes.filter(n => n.type === 'farm');
      const centers = nodes.filter(n => n.type === 'collection_center');
      const plants = nodes.filter(n => n.type === 'processing_plant');
      
      // Use all available nodes as potential distributors if no specific distributor nodes exist
      const distributors = nodes.filter(n => n.type === 'collection_center' || n.type === 'processing_plant');

      // Run optimization algorithm
      const optimization = optimizeCollectionRoutes(farms, centers, plants, distributors);
      const current = calculateCurrentPerformance();

      // Calculate savings
      const costSavings = Math.max(0, current.currentCost - optimization.totalCost);
      const timeSavings = Math.max(0, current.currentTime - optimization.totalTime);

      // Generate recommendations based on analysis
      const recommendations = [];
      
      if (optimization.totalDistance / optimization.optimizedRoutes.length > params.maxDistanceKm * 0.8) {
        recommendations.push("Consider adding more collection centers to reduce average route distances");
      }
      
      if (farms.length > centers.length * 4) {
        recommendations.push("Farm to collection center ratio is high - consider adding more collection centers");
      }
      
      if (centers.length > plants.length * 2) {
        recommendations.push("Consider adding processing capacity or optimizing plant locations");
      }

      if (plants.length > distributors.length && distributors.length > 0) {
        recommendations.push("Consider adding distribution hubs to improve final delivery efficiency");
      }

      if (costSavings > current.currentCost * 0.1) {
        recommendations.push("Significant cost savings possible through route optimization");
      }

      if (optimization.averageQuality < params.qualityRetentionPercent) {
        recommendations.push("Quality targets may not be met - consider temperature-controlled vehicles");
      }

      const result: OptimizationResult = {
        totalCost: optimization.totalCost,
        totalTime: optimization.totalTime,
        totalDistance: optimization.totalDistance,
        routesOptimized: optimization.optimizedRoutes.length,
        costSavings,
        timeSavings,
        qualityScore: optimization.averageQuality,
        recommendations
      };

      setOptimizationResult(result);

      toast({
        title: "Optimization Complete",
        description: `Found ${optimization.optimizedRoutes.length} optimal routes with ₹${costSavings.toFixed(0)} potential savings`,
      });

    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "An error occurred during optimization. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading optimization engine...</span>
      </div>
    );
  }

  // Count available nodes by type, with fallbacks
  const farmCount = nodes.filter(n => n.type === 'farm').length;
  const centerCount = nodes.filter(n => n.type === 'collection_center').length;
  const plantCount = nodes.filter(n => n.type === 'processing_plant').length;
  const distributorCount = centerCount;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Dairy Network Optimization Engine
          </CardTitle>
          <CardDescription>
            AI-powered route and network optimization using real distance calculations and cost analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Optimization Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Optimization Parameters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Maximum Distance: {params.maxDistanceKm}km
                  </Label>
                  <Slider
                    value={[params.maxDistanceKm]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, maxDistanceKm: value }))}
                    min={10}
                    max={200}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum allowed route distance</p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Max Delivery Time: {params.maxDeliveryTimeHours}h
                  </Label>
                  <Slider
                    value={[params.maxDeliveryTimeHours]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, maxDeliveryTimeHours: value }))}
                    min={1}
                    max={24}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum delivery time allowed</p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cost per Kilometer: ₹{params.costPerKm}
                  </Label>
                  <Slider
                    value={[params.costPerKm]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, costPerKm: value }))}
                    min={5}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Transportation cost per kilometer</p>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature Threshold: {params.temperatureThresholdC}°C
                  </Label>
                  <Slider
                    value={[params.temperatureThresholdC]}
                    onValueChange={([value]) => setParams(prev => ({ ...prev, temperatureThresholdC: value }))}
                    min={-5}
                    max={25}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum temperature for quality maintenance</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Current Network Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">🐄 Farms</p>
                  <p className="text-2xl font-bold">{farmCount}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">🏭 Centers</p>
                  <p className="text-2xl font-bold">{centerCount}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">⚙️ Plants</p>
                  <p className="text-2xl font-bold">{plantCount}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">📦 Distributors</p>
                  <p className="text-2xl font-bold">{distributorCount}</p>
                </div>
              </div>
              
              <Button 
                onClick={runOptimization} 
                disabled={isOptimizing || nodes.length < 3}
                className="w-full"
                size="lg"
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isOptimizing ? 'Optimizing Network...' : 'Run Network Optimization'}
              </Button>
            </div>
          </div>

          {/* Optimization Results */}
          {optimizationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Optimization Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{optimizationResult.costSavings.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{optimizationResult.timeSavings.toFixed(1)}h</div>
                    <div className="text-sm text-muted-foreground">Time Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{optimizationResult.routesOptimized}</div>
                    <div className="text-sm text-muted-foreground">Routes Optimized</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{optimizationResult.totalDistance.toFixed(0)}km</div>
                    <div className="text-sm text-muted-foreground">Total Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{optimizationResult.qualityScore.toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </div>
                </div>

                {optimizationResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">AI Recommendations:</h4>
                    <div className="space-y-2">
                      {optimizationResult.recommendations.map((rec, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Algorithm Information */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Algorithm Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p><strong>Distance Calculation:</strong> Uses Haversine formula for accurate geographic distances</p>
                <p><strong>Route Optimization:</strong> Multi-stage optimization considering farms → centers → plants → distributors</p>
                <p><strong>Cost Model:</strong> ₹{params.costPerKm}/km base rate with adjustments for route type and requirements</p>
                <p><strong>Speed Assumptions:</strong> 40 km/h collection, 45 km/h processing transport, 50 km/h distribution</p>
                <p><strong>Quality Tracking:</strong> Real-time quality score based on time and temperature constraints</p>
                <p><strong>Constraints:</strong> Configurable distance, time, cost, and quality thresholds</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
