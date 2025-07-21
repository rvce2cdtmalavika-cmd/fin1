import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { dairyService } from '@/services/dairyService';
import { Truck, Factory, Milk, MapPin, Calculator, TrendingUp, RefreshCw, Download, Users, Package } from 'lucide-react';

interface DairyNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant';
  lat: number;
  lng: number;
  capacity: number;
  production: number;
  cost: number;
  district: string;
  efficiency: number;
}

interface DairyRoute {
  id: string;
  from: string;
  to: string;
  distance: number;
  transportCost: number;
  transitTime: number;
  vehicleType: string;
  capacity: number;
}

const DairyNetworkDesigner = () => {
  const { nodes: demoNodes, routes: demoRoutes, metrics, isLoading, farms, plants, centers } = useDairyData();
  const [customNodes, setCustomNodes] = useState<DairyNode[]>([]);
  const [customRoutes, setCustomRoutes] = useState<DairyRoute[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    lat: '',
    lng: '',
    capacity: '',
    production: '',
    cost: '',
    district: ''
  });
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [showDemoData, setShowDemoData] = useState(true);
  const { toast } = useToast();

  // Combine demo data with custom data when showing demo data
  const allNodes = showDemoData ? [...demoNodes.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    lat: node.lat,
    lng: node.lng,
    capacity: node.capacity,
    production: node.production || 0,
    cost: 0,
    district: node.district,
    efficiency: 85
  })), ...customNodes] : customNodes;

  const allRoutes = showDemoData ? [...demoRoutes.map(route => ({
    id: route.id,
    from: route.from_id,
    to: route.to_id,
    distance: route.distance_km,
    transportCost: route.cost_per_trip,
    transitTime: route.estimated_time_hours,
    vehicleType: route.vehicle_type,
    capacity: route.optimal_load_liters
  })), ...customRoutes] : customRoutes;

  const addNode = () => {
    if (!formData.name || !formData.type || !formData.lat || !formData.lng || !formData.capacity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newNode: DairyNode = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      type: formData.type as 'farm' | 'collection_center' | 'processing_plant',
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      capacity: parseInt(formData.capacity),
      production: parseInt(formData.production) || 0,
      cost: parseFloat(formData.cost) || 0,
      district: formData.district,
      efficiency: Math.random() * 20 + 80 // Random efficiency between 80-100%
    };

    setCustomNodes(prev => [...prev, newNode]);
    setFormData({
      name: '',
      type: '',
      lat: '',
      lng: '',
      capacity: '',
      production: '',
      cost: '',
      district: ''
    });

    toast({
      title: "Node Added",
      description: `${newNode.name} has been added to the network`,
    });
  };

  const generateOptimizedRoutes = async () => {
    setLoadingOptimization(true);
    try {
      const optimizedRoutes = await dairyService.generateOptimizedRoutes();
      toast({
        title: "Routes Optimized",
        description: `Generated ${optimizedRoutes.length} optimized transport routes`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Failed to generate optimized routes",
        variant: "destructive"
      });
    } finally {
      setLoadingOptimization(false);
    }
  };

  const optimizeNetwork = () => {
    const farms = allNodes.filter(node => node.type === 'farm');
    const centers = allNodes.filter(node => node.type === 'collection_center');
    const plants = allNodes.filter(node => node.type === 'processing_plant');

    const newRoutes: DairyRoute[] = [];

    // Simple nearest neighbor optimization for custom nodes
    farms.forEach(farm => {
      if (centers.length > 0) {
        const nearestCenter = centers.reduce((nearest, center) => {
          const farmDistance = Math.sqrt(
            Math.pow(farm.lat - center.lat, 2) + Math.pow(farm.lng - center.lng, 2)
          );
          const nearestDistance = Math.sqrt(
            Math.pow(farm.lat - nearest.lat, 2) + Math.pow(farm.lng - nearest.lng, 2)
          );
          return farmDistance < nearestDistance ? center : nearest;
        });

        const distance = Math.sqrt(
          Math.pow(farm.lat - nearestCenter.lat, 2) + Math.pow(farm.lng - nearestCenter.lng, 2)
        ) * 111; // Rough km conversion

        newRoutes.push({
          id: Math.random().toString(36).substr(2, 9),
          from: farm.id,
          to: nearestCenter.id,
          distance: distance,
          transportCost: distance * 8, // ₹8 per km
          transitTime: distance / 40, // 40 km/h average
          vehicleType: 'Milk Tanker',
          capacity: Math.min(farm.production, 2000)
        });
      }
    });

    centers.forEach(center => {
      if (plants.length > 0) {
        const nearestPlant = plants.reduce((nearest, plant) => {
          const centerDistance = Math.sqrt(
            Math.pow(center.lat - plant.lat, 2) + Math.pow(center.lng - plant.lng, 2)
          );
          const nearestDistance = Math.sqrt(
            Math.pow(center.lat - nearest.lat, 2) + Math.pow(center.lng - nearest.lng, 2)
          );
          return centerDistance < nearestDistance ? plant : nearest;
        });

        const distance = Math.sqrt(
          Math.pow(center.lat - nearestPlant.lat, 2) + Math.pow(center.lng - nearestPlant.lng, 2)
        ) * 111;

        newRoutes.push({
          id: Math.random().toString(36).substr(2, 9),
          from: center.id,
          to: nearestPlant.id,
          distance: distance,
          transportCost: distance * 12, // ₹12 per km for refrigerated
          transitTime: distance / 50, // 50 km/h highway speed
          vehicleType: 'Refrigerated Truck',
          capacity: center.capacity
        });
      }
    });

    setCustomRoutes(newRoutes);
    toast({
      title: "Network Optimized",
      description: `Generated ${newRoutes.length} optimized routes`,
    });
  };

  const calculateNetworkMetrics = () => {
    const totalNodes = allNodes.length;
    const totalCapacity = allNodes.reduce((sum, node) => sum + node.capacity, 0);
    const totalProduction = allNodes.filter(n => n.type === 'farm').reduce((sum, node) => sum + node.production, 0);
    const totalCost = allRoutes.reduce((sum, route) => sum + route.transportCost, 0);
    const efficiency = totalCapacity > 0 ? (totalProduction / totalCapacity) * 100 : 0;

    return {
      totalNodes,
      totalCapacity,
      totalProduction,
      totalCost,
      efficiency: Math.min(efficiency, 100)
    };
  };

  const networkMetrics = metrics || calculateNetworkMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Bangalore dairy network data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Data Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bangalore Dairy Network Demo
          </CardTitle>
          <CardDescription>
            Explore real dairy infrastructure data from Bangalore region or design your own custom network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowDemoData(true)}
              variant={showDemoData ? "default" : "outline"}
            >
              <Download className="h-4 w-4 mr-2" />
              Load Bangalore Demo Data
            </Button>
            <Button 
              onClick={() => setShowDemoData(false)}
              variant={!showDemoData ? "default" : "outline"}
            >
              <Users className="h-4 w-4 mr-2" />
              Custom Network Design
            </Button>
            <Button 
              onClick={generateOptimizedRoutes}
              disabled={loadingOptimization}
              variant="secondary"
            >
              {loadingOptimization ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Generate Optimal Routes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Total Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{showDemoData ? farms.length + plants.length + centers.length : allNodes.length}</div>
            <p className="text-xs text-muted-foreground">
              {showDemoData ? `${farms.length} farms, ${centers.length} centers, ${plants.length} plants` : 'Network facilities'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Milk className="h-4 w-4" />
              Daily Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showDemoData && metrics ? 
                (metrics.totalProduction / 1000).toFixed(0) + 'K' : 
                (networkMetrics.totalProduction / 1000).toFixed(0) + 'K'
              }
            </div>
            <p className="text-xs text-muted-foreground">Liters per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Processing Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showDemoData && metrics ? 
                (metrics.totalProcessingCapacity / 1000).toFixed(0) + 'K' : 
                (networkMetrics.totalCapacity / 1000).toFixed(0) + 'K'
              }
            </div>
            <p className="text-xs text-muted-foreground">Liters capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Network Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showDemoData && metrics ? 
                metrics.networkEfficiency.toFixed(1) + '%' : 
                networkMetrics.efficiency.toFixed(1) + '%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Production vs capacity</p>
          </CardContent>
        </Card>
      </div>

      {showDemoData && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <strong>Bangalore Demo Network:</strong> This network includes {farms.length} dairy farms, {centers.length} collection centers, 
            and {plants.length} processing plants across Bangalore Rural, Urban, and surrounding districts like Kolar, Tumkur, and Ramanagara.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Custom Node Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Add Custom Node
            </CardTitle>
            <CardDescription>
              Add your own dairy facilities to the network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Facility Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter facility name"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Facility Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farm">Dairy Farm</SelectItem>
                    <SelectItem value="collection_center">Collection Center</SelectItem>
                    <SelectItem value="processing_plant">Processing Plant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="12.9716"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="77.5946"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="capacity">Capacity (Liters)</Label>
                  <Input
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="production">Daily Production</Label>
                  <Input
                    id="production"
                    value={formData.production}
                    onChange={(e) => setFormData({ ...formData, production: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Bangalore Urban"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addNode} className="flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
                <Button onClick={optimizeNetwork} variant="secondary">
                  <Calculator className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Nodes Display */}
        <Card>
          <CardHeader>
            <CardTitle>Network Nodes</CardTitle>
            <CardDescription>
              {showDemoData ? 'Bangalore dairy infrastructure + custom nodes' : 'Your custom network design'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allNodes.slice(0, 10).map((node) => (
                <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {node.type === 'farm' && '🐄'}
                      {node.type === 'collection_center' && '🏭'}
                      {node.type === 'processing_plant' && '🏪'}
                    </div>
                    <div>
                      <p className="font-medium">{node.name}</p>
                      <p className="text-sm text-muted-foreground">{node.district}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {(node.capacity / 1000).toFixed(0)}K L
                    </Badge>
                    {node.production > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(node.production / 1000).toFixed(0)}K L/day
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {allNodes.length > 10 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  ... and {allNodes.length - 10} more facilities
                </div>
              )}
              
              {allNodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Milk className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No nodes added yet. Load demo data or add custom nodes!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimized Routes */}
      {allRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Transport Routes
            </CardTitle>
            <CardDescription>
              Optimized transportation routes in the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allRoutes.slice(0, 8).map((route) => {
                const fromNode = allNodes.find(n => n.id === route.from);
                const toNode = allNodes.find(n => n.id === route.to);
                return (
                  <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">
                          {fromNode?.name || 'Unknown'} → {toNode?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {route.vehicleType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{route.transportCost.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.distance.toFixed(1)} km • {route.transitTime.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {allRoutes.length > 8 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  ... and {allRoutes.length - 8} more routes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DairyNetworkDesigner;