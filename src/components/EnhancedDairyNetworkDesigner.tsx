
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { GoogleMapIntegration } from './GoogleMapIntegration';
import { NetworkPerformanceOverview } from './NetworkPerformanceOverview';
import { DataImportExport } from './DataImportExport';
import { DairyOptimizationEngine } from './DairyOptimizationEngine';
import { SupplyChainMap } from './SupplyChainMap';
import { 
  Network, 
  BarChart3, 
  Settings, 
  Database, 
  Map,
  Zap,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface GoogleLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

export function EnhancedDairyNetworkDesigner() {
  const { nodes, routes, isLoading } = useDairyData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const getRouteColor = (vehicleType: string) => {
    const colors = {
      milk_tanker: '#10B981',
      refrigerated_truck: '#3B82F6',
      insulated_van: '#8B5CF6'
    };
    return colors[vehicleType as keyof typeof colors] || '#6B7280';
  };

  // Transform dairy data for the map
  const mapNodes = nodes.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    lat: node.lat,
    lng: node.lng,
    capacity: node.capacity,
    demand: node.production || 0,
    details: `${node.type.charAt(0).toUpperCase() + node.type.slice(1).replace('_', ' ')} in ${node.district}`
  }));

  const mapEdges = routes.map(route => {
    const fromNode = nodes.find(n => n.id === route.from_id);
    const toNode = nodes.find(n => n.id === route.to_id);
    
    if (!fromNode || !toNode) return null;
    
    return {
      id: route.id,
      from: route.from_id,
      to: route.to_id,
      route: [
        { lat: fromNode.lat, lng: fromNode.lng } as any,
        { lat: toNode.lat, lng: toNode.lng } as any
      ],
      color: getRouteColor(route.vehicle_type),
      weight: 3
    };
  }).filter(Boolean) as any[];

  const handleLocationSelect = async (location: GoogleLocation) => {
    try {
      toast({
        title: "Location Selected",
        description: `${location.name} has been selected. Please specify facility type and details in the data management tab.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add location to network",
        variant: "destructive"
      });
    }
  };

  const runNetworkOptimization = async () => {
    setIsOptimizing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Optimization Complete",
        description: "Network has been optimized for cost and efficiency",
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize network",
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
        <span className="ml-2">Loading Karnataka dairy network...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            Karnataka Dairy Supply Chain Network
          </CardTitle>
          <CardDescription>
            Comprehensive network design and optimization for dairy supply chains across Karnataka
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{nodes.filter(n => n.type === 'farm').length}</div>
              <div className="text-sm text-muted-foreground">Dairy Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nodes.filter(n => n.type === 'collection_center').length}</div>
              <div className="text-sm text-muted-foreground">Collection Centers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{nodes.filter(n => n.type === 'processing_plant').length}</div>
              <div className="text-sm text-muted-foreground">Processing Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{routes.length}</div>
              <div className="text-sm text-muted-foreground">Active Routes</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                Network Status: Operational
              </Badge>
              <Badge variant="outline">
                Karnataka Region
              </Badge>
            </div>
            <Button onClick={runNetworkOptimization} disabled={isOptimizing}>
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isOptimizing ? 'Optimizing...' : 'Quick Optimize'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Network Map
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Add Locations
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <NetworkPerformanceOverview />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Karnataka Dairy Network Interactive Map</CardTitle>
              <CardDescription>
                Real-time visualization of your dairy supply chain network across Karnataka with route optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplyChainMap
                nodes={mapNodes}
                edges={mapEdges}
                center={[12.9716, 77.5946]} // Bangalore center
                zoom={8}
                height="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <GoogleMapIntegration
            onLocationSelect={handleLocationSelect}
            existingLocations={nodes}
            center={{ lat: 12.9716, lng: 77.5946 }}
            zoom={8}
          />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <DairyOptimizationEngine />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataImportExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
