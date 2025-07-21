
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Calculator, MapPin, Milk, Factory, Truck, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DairyNode {
  id: string;
  name: string;
  type: 'dairy_farm' | 'collection_center' | 'processing_plant' | 'distribution_center' | 'retail_outlet';
  lat: number;
  lng: number;
  capacity: number;
  dailyProduction?: number;
  storageCapacity?: number;
  processingCapacity?: number;
  temperature: number;
  shelfLife: number;
  operatingCost: number;
  products: string[];
}

export interface DairyRoute {
  id: string;
  from: string;
  to: string;
  distance: number;
  transportCost: number;
  transitTime: number;
  vehicleType: 'refrigerated_truck' | 'insulated_van' | 'milk_tanker';
  capacity: number;
}

const DAIRY_PRODUCTS = [
  'Fresh Milk',
  'Yogurt',
  'Cheese',
  'Butter',
  'Ice Cream',
  'Cream',
  'Paneer',
  'Buttermilk'
];

const NODE_TYPES = {
  dairy_farm: { icon: '🐄', color: 'bg-green-100 text-green-800', label: 'Dairy Farm' },
  collection_center: { icon: '🏭', color: 'bg-blue-100 text-blue-800', label: 'Collection Center' },
  processing_plant: { icon: '🏪', color: 'bg-purple-100 text-purple-800', label: 'Processing Plant' },
  distribution_center: { icon: '📦', color: 'bg-orange-100 text-orange-800', label: 'Distribution Center' },
  retail_outlet: { icon: '🏬', color: 'bg-red-100 text-red-800', label: 'Retail Outlet' }
};

export function DairyNetworkDesigner() {
  const [nodes, setNodes] = useState<DairyNode[]>([]);
  const [routes, setRoutes] = useState<DairyRoute[]>([]);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<DairyNode['type']>('dairy_farm');
  const [nodeForm, setNodeForm] = useState({
    name: '',
    lat: 0,
    lng: 0,
    capacity: 0,
    dailyProduction: 0,
    temperature: 4,
    shelfLife: 7,
    operatingCost: 0,
    products: [] as string[]
  });
  const { toast } = useToast();

  const addNode = () => {
    if (!nodeForm.name) {
      toast({
        title: "Error",
        description: "Please enter a node name",
        variant: "destructive"
      });
      return;
    }

    const newNode: DairyNode = {
      id: `node-${Date.now()}`,
      name: nodeForm.name,
      type: selectedNodeType,
      lat: nodeForm.lat,
      lng: nodeForm.lng,
      capacity: nodeForm.capacity,
      dailyProduction: nodeForm.dailyProduction,
      temperature: nodeForm.temperature,
      shelfLife: nodeForm.shelfLife,
      operatingCost: nodeForm.operatingCost,
      products: nodeForm.products
    };

    setNodes([...nodes, newNode]);
    setNodeForm({
      name: '',
      lat: 0,
      lng: 0,
      capacity: 0,
      dailyProduction: 0,
      temperature: 4,
      shelfLife: 7,
      operatingCost: 0,
      products: []
    });
    setIsAddingNode(false);
    
    toast({
      title: "Success",
      description: `${NODE_TYPES[selectedNodeType].label} added to network`,
    });
  };

  const optimizeNetwork = () => {
    // Simple optimization algorithm for dairy network
    const optimizedRoutes = [];
    const farms = nodes.filter(n => n.type === 'dairy_farm');
    const centers = nodes.filter(n => n.type === 'collection_center');
    const plants = nodes.filter(n => n.type === 'processing_plant');
    const distributors = nodes.filter(n => n.type === 'distribution_center');
    const retailers = nodes.filter(n => n.type === 'retail_outlet');

    // Connect farms to nearest collection centers
    farms.forEach(farm => {
      const nearestCenter = centers.reduce((closest, center) => {
        const distance = Math.sqrt(
          Math.pow(farm.lat - center.lat, 2) + Math.pow(farm.lng - center.lng, 2)
        );
        return !closest || distance < closest.distance ? { center, distance } : closest;
      }, null as any);

      if (nearestCenter) {
        optimizedRoutes.push({
          id: `route-${Date.now()}-${Math.random()}`,
          from: farm.id,
          to: nearestCenter.center.id,
          distance: nearestCenter.distance * 111, // Convert to km
          transportCost: nearestCenter.distance * 111 * 2.5, // ₹2.5 per km
          transitTime: nearestCenter.distance * 111 / 40, // 40 km/h average
          vehicleType: 'milk_tanker' as const,
          capacity: 5000
        });
      }
    });

    setRoutes(optimizedRoutes);
    toast({
      title: "Network Optimized",
      description: `Generated ${optimizedRoutes.length} optimized routes`,
    });
  };

  const calculateNetworkMetrics = () => {
    const totalNodes = nodes.length;
    const totalCapacity = nodes.reduce((sum, node) => sum + node.capacity, 0);
    const totalProduction = nodes.reduce((sum, node) => sum + (node.dailyProduction || 0), 0);
    const totalCost = nodes.reduce((sum, node) => sum + node.operatingCost, 0) + 
                     routes.reduce((sum, route) => sum + route.transportCost, 0);

    return {
      totalNodes,
      totalCapacity,
      totalProduction,
      totalCost,
      efficiency: totalProduction / totalCost || 0
    };
  };

  const metrics = calculateNetworkMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Network Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalNodes}</div>
            <p className="text-xs text-muted-foreground">Total facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProduction.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Liters per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCapacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Liters storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Operating Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Daily cost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Network Designer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(NODE_TYPES).map(([type, config]) => (
                <Button
                  key={type}
                  variant={selectedNodeType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedNodeType(type as DairyNode['type'])}
                  className="text-xs"
                >
                  {config.icon} {config.label}
                </Button>
              ))}
            </div>

            {isAddingNode && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={nodeForm.name}
                      onChange={(e) => setNodeForm({...nodeForm, name: e.target.value})}
                      placeholder="Enter facility name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity (L)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={nodeForm.capacity}
                      onChange={(e) => setNodeForm({...nodeForm, capacity: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={nodeForm.lat}
                      onChange={(e) => setNodeForm({...nodeForm, lat: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.000001"
                      value={nodeForm.lng}
                      onChange={(e) => setNodeForm({...nodeForm, lng: Number(e.target.value)})}
                    />
                  </div>
                </div>

                {selectedNodeType === 'dairy_farm' && (
                  <div>
                    <Label htmlFor="production">Daily Production (L)</Label>
                    <Input
                      id="production"
                      type="number"
                      value={nodeForm.dailyProduction}
                      onChange={(e) => setNodeForm({...nodeForm, dailyProduction: Number(e.target.value)})}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={nodeForm.temperature}
                      onChange={(e) => setNodeForm({...nodeForm, temperature: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                    <Input
                      id="shelfLife"
                      type="number"
                      value={nodeForm.shelfLife}
                      onChange={(e) => setNodeForm({...nodeForm, shelfLife: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addNode} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Add Node
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingNode(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setIsAddingNode(true)} disabled={isAddingNode}>
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
              <Button onClick={optimizeNetwork} disabled={nodes.length < 2}>
                <Calculator className="h-4 w-4 mr-2" />
                Optimize Network
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{NODE_TYPES[node.type].icon}</div>
                    <div>
                      <p className="font-medium">{node.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {NODE_TYPES[node.type].label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className={NODE_TYPES[node.type].color}>
                      {node.capacity.toLocaleString()}L
                    </Badge>
                    {node.dailyProduction && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {node.dailyProduction.toLocaleString()}L/day
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {nodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Milk className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No nodes added yet. Start designing your network!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimized Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {routes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">
                        {nodes.find(n => n.id === route.from)?.name} → {nodes.find(n => n.id === route.to)?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {route.vehicleType.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{route.transportCost.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {route.distance.toFixed(1)} km • {route.transitTime.toFixed(1)}h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
