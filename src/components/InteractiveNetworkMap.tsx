
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDairyData } from '@/hooks/useDairyData';
import { 
  MapPin, 
  Settings, 
  Zap, 
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Target
} from 'lucide-react';

interface OptimizationConstraints {
  maxDistance: number;
  costWeight: number;
  timeWeight: number;
  qualityWeight: number;
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant';
  lat: number;
  lng: number;
  capacity: number;
  marker?: any;
}

interface OptimizedRoute {
  from: NetworkNode;
  to: NetworkNode;
  distance: number;
  cost: number;
  time: number;
  efficiency: 'optimal' | 'suboptimal' | 'problematic';
  polyline?: any;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function InteractiveNetworkMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [constraints, setConstraints] = useState<OptimizationConstraints>({
    maxDistance: 50,
    costWeight: 40,
    timeWeight: 30,
    qualityWeight: 30
  });
  
  const { nodes: dairyNodes } = useDairyData();
  const { toast } = useToast();

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      setIsApiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBkR-LW8k3RE3yvVwUMfkXDIVWPwdlnkTA&libraries=places,geometry&callback=initMap`;
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

  // Initialize map and convert dairy data to nodes
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || map) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 }, // Bangalore
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

    setMap(googleMap);

    // Convert dairy data to network nodes
    const networkNodes: NetworkNode[] = dairyNodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      lat: node.lat,
      lng: node.lng,
      capacity: node.capacity
    }));

    setNodes(networkNodes);
    
    // Add click listener for adding new nodes
    googleMap.addListener('click', (event: any) => {
      const newNode: NetworkNode = {
        id: `temp_${Date.now()}`,
        name: `New Location`,
        type: 'farm',
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        capacity: 1000
      };
      
      setSelectedNode(newNode);
    });

  }, [isApiLoaded, dairyNodes]);

  // Render nodes on map
  useEffect(() => {
    if (!map || !nodes.length) return;

    // Clear existing markers
    nodes.forEach(node => {
      if (node.marker) {
        node.marker.setMap(null);
      }
    });

    // Add markers for each node
    const updatedNodes = nodes.map(node => {
      const marker = new window.google.maps.Marker({
        position: { lat: node.lat, lng: node.lng },
        map: map,
        title: node.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: getNodeColor(node.type),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        draggable: true
      });

      // Add drag listener
      marker.addListener('dragend', (event: any) => {
        updateNodePosition(node.id, event.latLng.lat(), event.latLng.lng());
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedNode(node);
      });

      return { ...node, marker };
    });

    setNodes(updatedNodes);
  }, [map, nodes.length]);

  const getNodeColor = (type: string) => {
    const colors = {
      farm: '#10B981',
      collection_center: '#3B82F6',
      processing_plant: '#8B5CF6'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const updateNodePosition = (nodeId: string, lat: number, lng: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, lat, lng } : node
    ));
    
    // Trigger re-optimization if currently showing optimized routes
    if (showOptimization) {
      optimizeNetwork();
    }
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

  const optimizeNetwork = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      const farms = nodes.filter(n => n.type === 'farm');
      const centers = nodes.filter(n => n.type === 'collection_center');
      const plants = nodes.filter(n => n.type === 'processing_plant');
      
      const routes: OptimizedRoute[] = [];

      // Optimize farm to collection center routes
      farms.forEach(farm => {
        let bestCenter = null;
        let minScore = Infinity;

        centers.forEach(center => {
          const distance = calculateDistance(farm.lat, farm.lng, center.lat, center.lng);
          if (distance <= constraints.maxDistance) {
            const cost = distance * 15; // ₹15 per km
            const time = distance / 40; // 40 km/h
            const score = (cost * constraints.costWeight + time * constraints.timeWeight) / 100;
            
            if (score < minScore) {
              minScore = score;
              bestCenter = center;
            }
          }
        });

        if (bestCenter) {
          const distance = calculateDistance(farm.lat, farm.lng, bestCenter.lat, bestCenter.lng);
          const cost = distance * 15;
          const time = distance / 40;
          const efficiency = distance < 20 ? 'optimal' : distance < 40 ? 'suboptimal' : 'problematic';
          
          routes.push({
            from: farm,
            to: bestCenter,
            distance,
            cost,
            time,
            efficiency
          });
        }
      });

      // Optimize collection center to processing plant routes
      centers.forEach(center => {
        let bestPlant = null;
        let minDistance = Infinity;

        plants.forEach(plant => {
          const distance = calculateDistance(center.lat, center.lng, plant.lat, plant.lng);
          if (distance < minDistance) {
            minDistance = distance;
            bestPlant = plant;
          }
        });

        if (bestPlant) {
          const distance = calculateDistance(center.lat, center.lng, bestPlant.lat, bestPlant.lng);
          const cost = distance * 20; // ₹20 per km
          const time = distance / 45; // 45 km/h
          const efficiency = distance < 30 ? 'optimal' : distance < 60 ? 'suboptimal' : 'problematic';
          
          routes.push({
            from: center,
            to: bestPlant,
            distance,
            cost,
            time,
            efficiency
          });
        }
      });

      setOptimizedRoutes(routes);
      setShowOptimization(true);
      
      toast({
        title: "Network Optimized",
        description: `Generated ${routes.length} optimized routes`,
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
  }, [nodes, constraints, toast]);

  // Render routes on map
  useEffect(() => {
    if (!map || !showOptimization) return;

    // Clear existing polylines
    optimizedRoutes.forEach(route => {
      if (route.polyline) {
        route.polyline.setMap(null);
      }
    });

    // Add new polylines
    const updatedRoutes = optimizedRoutes.map(route => {
      const getRouteColor = (efficiency: string) => {
        switch (efficiency) {
          case 'optimal': return '#10B981';
          case 'suboptimal': return '#F59E0B';
          case 'problematic': return '#EF4444';
          default: return '#6B7280';
        }
      };

      const polyline = new window.google.maps.Polyline({
        path: [
          { lat: route.from.lat, lng: route.from.lng },
          { lat: route.to.lat, lng: route.to.lng }
        ],
        geodesic: true,
        strokeColor: getRouteColor(route.efficiency),
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      return { ...route, polyline };
    });

    setOptimizedRoutes(updatedRoutes);
  }, [map, showOptimization, optimizedRoutes.length]);

  const addNode = (type: 'farm' | 'collection_center' | 'processing_plant') => {
    if (selectedNode) {
      const newNode: NetworkNode = {
        ...selectedNode,
        type,
        name: `New ${type.replace('_', ' ')}`,
        id: `${type}_${Date.now()}`
      };
      
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(null);
      
      toast({
        title: "Node Added",
        description: `Added new ${type.replace('_', ' ')} to the network`,
      });
    }
  };

  const resetOptimization = () => {
    setShowOptimization(false);
    setOptimizedRoutes([]);
    optimizedRoutes.forEach(route => {
      if (route.polyline) {
        route.polyline.setMap(null);
      }
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
    <div className="space-y-4">
      {/* Constraint Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Network Optimization Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
              <Label>Cost Weight: {constraints.costWeight}%</Label>
              <Slider
                value={[constraints.costWeight]}
                onValueChange={([value]) => setConstraints(prev => ({ ...prev, costWeight: value }))}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Time Weight: {constraints.timeWeight}%</Label>
              <Slider
                value={[constraints.timeWeight]}
                onValueChange={([value]) => setConstraints(prev => ({ ...prev, timeWeight: value }))}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Quality Weight: {constraints.qualityWeight}%</Label>
              <Slider
                value={[constraints.qualityWeight]}
                onValueChange={([value]) => setConstraints(prev => ({ ...prev, qualityWeight: value }))}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={optimizeNetwork} disabled={isOptimizing} size="sm">
              {isOptimizing ? (
                <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Optimize Network
            </Button>
            
            <Button 
              onClick={() => setShowOptimization(!showOptimization)} 
              variant="outline" 
              size="sm"
              disabled={!optimizedRoutes.length}
            >
              {showOptimization ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showOptimization ? 'Hide Routes' : 'Show Routes'}
            </Button>
            
            <Button onClick={resetOptimization} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
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
            <CardTitle>Add New Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Selected coordinates: {selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={() => addNode('farm')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Farm
              </Button>
              <Button onClick={() => addNode('collection_center')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Collection Center
              </Button>
              <Button onClick={() => addNode('processing_plant')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Processing Plant
              </Button>
              <Button onClick={() => setSelectedNode(null)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Results */}
      {showOptimization && optimizedRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {optimizedRoutes.filter(r => r.efficiency === 'optimal').length}
                </div>
                <div className="text-sm text-muted-foreground">Optimal Routes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {optimizedRoutes.filter(r => r.efficiency === 'suboptimal').length}
                </div>
                <div className="text-sm text-muted-foreground">Suboptimal Routes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {optimizedRoutes.filter(r => r.efficiency === 'problematic').length}
                </div>
                <div className="text-sm text-muted-foreground">Problematic Routes</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Optimal (&lt;20km)
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Suboptimal (20-40km)
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Problematic (&gt;40km)
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          Click anywhere on the map to add a new location. Drag existing markers to reposition them. 
          Adjust constraints and click "Optimize Network" to see the optimal routes visualized on the map.
        </AlertDescription>
      </Alert>
    </div>
  );
}
