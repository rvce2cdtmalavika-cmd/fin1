import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  findAllShortestPaths, 
  ShortestPathResult,
  NetworkNode as AlgorithmNode 
} from '@/algorithms/dijkstra';
import { 
  MapPin, 
  Route, 
  Eye, 
  EyeOff,
  Zap,
  Info
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface NetworkNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant' | 'distributor' | 'retail';
  lat: number;
  lng: number;
  capacity: number;
  production?: number;
  demand?: number;
  isVisible: boolean;
  district?: string;
  contact?: string;
  phone?: string;
}

interface EnhancedNetworkMapProps {
  nodes: NetworkNode[];
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string;
  weatherTemp?: number;
  showOptimalPaths?: boolean;
  selectedPath?: ShortestPathResult | null;
}

// Enhanced custom icons for different node types
const createNetworkIcon = (type: string, isSelected: boolean = false, isConnected: boolean = false) => {
  const iconConfig = {
    farm: { color: '#10B981', emoji: '🐄', size: isSelected ? 40 : 32 },
    collection_center: { color: '#3B82F6', emoji: '🏭', size: isSelected ? 40 : 32 },
    processing_plant: { color: '#8B5CF6', emoji: '⚙️', size: isSelected ? 40 : 32 },
    distributor: { color: '#F59E0B', emoji: '📦', size: isSelected ? 40 : 32 },
    retail: { color: '#EF4444', emoji: '🏪', size: isSelected ? 40 : 32 },
  };

  const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.farm;
  const borderColor = isConnected ? '#22C55E' : 'white';
  const borderWidth = isSelected ? 4 : isConnected ? 3 : 2;
  
  return divIcon({
    className: 'custom-network-icon',
    html: `<div style="
      background-color: ${config.color};
      width: ${config.size}px;
      height: ${config.size}px;
      border-radius: 50%;
      border: ${borderWidth}px solid ${borderColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${config.size * 0.5}px;
      box-shadow: 0 ${isSelected ? '8px 16px' : '4px 8px'} rgba(0,0,0,${isSelected ? '0.4' : '0.3'});
      transition: all 0.3s ease;
      ${isSelected ? 'transform: scale(1.1);' : ''}
      ${isConnected ? 'animation: pulse 2s infinite;' : ''}
    ">${config.emoji}</div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>`,
    iconSize: [config.size, config.size],
    iconAnchor: [config.size / 2, config.size / 2],
  });
};

export function EnhancedNetworkMap({ 
  nodes, 
  onNodeSelect,
  selectedNodeId,
  weatherTemp = 25,
  showOptimalPaths = true,
  selectedPath
}: EnhancedNetworkMapProps) {
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [pathFilter, setPathFilter] = useState<'all' | 'optimal' | 'suboptimal'>('optimal');

  // Convert nodes to algorithm format
  const algorithmNodes: AlgorithmNode[] = useMemo(() => 
    nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      lat: node.lat,
      lng: node.lng,
      capacity: node.capacity,
      production: node.production,
      demand: node.demand,
      isVisible: node.isVisible
    })), [nodes]
  );

  // Calculate all shortest paths
  const allPaths = useMemo(() => {
    return findAllShortestPaths(algorithmNodes, weatherTemp);
  }, [algorithmNodes, weatherTemp]);

  // Filter paths based on current filter
  const filteredPaths = useMemo(() => {
    if (selectedPath) return [selectedPath];
    if (!showAllPaths) return [];
    
    switch (pathFilter) {
      case 'optimal':
        return allPaths.filter(p => p.isOptimal);
      case 'suboptimal':
        return allPaths.filter(p => !p.isOptimal);
      default:
        return allPaths;
    }
  }, [allPaths, showAllPaths, pathFilter, selectedPath]);

  // Get connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    const connected = new Set<string>();
    filteredPaths.forEach(path => {
      path.path.forEach(nodeId => connected.add(nodeId));
    });
    return connected;
  }, [filteredPaths]);

  // Get path color based on efficiency
  const getPathColor = (path: ShortestPathResult) => {
    if (path.isOptimal) return '#10B981'; // Green for optimal
    if (path.totalSpoilageRisk > 10) return '#EF4444'; // Red for high risk
    return '#F59E0B'; // Orange for suboptimal
  };

  // Get path positions for polyline
  const getPathPositions = (path: ShortestPathResult) => {
    return path.path.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return node ? [node.lat, node.lng] as [number, number] : [0, 0] as [number, number];
    }).filter(pos => pos[0] !== 0 && pos[1] !== 0);
  };

  const visibleNodes = nodes.filter(n => n.isVisible);

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Enhanced Network Visualization
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAllPaths(!showAllPaths)}
                variant={showAllPaths ? "default" : "outline"}
                size="sm"
              >
                {showAllPaths ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAllPaths ? 'Hide Paths' : 'Show Paths'}
              </Button>
              
              {showAllPaths && (
                <div className="flex gap-1">
                  <Button
                    onClick={() => setPathFilter('optimal')}
                    variant={pathFilter === 'optimal' ? "default" : "outline"}
                    size="sm"
                  >
                    Optimal
                  </Button>
                  <Button
                    onClick={() => setPathFilter('suboptimal')}
                    variant={pathFilter === 'suboptimal' ? "default" : "outline"}
                    size="sm"
                  >
                    Suboptimal
                  </Button>
                  <Button
                    onClick={() => setPathFilter('all')}
                    variant={pathFilter === 'all' ? "default" : "outline"}
                    size="sm"
                  >
                    All
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                🐄 {nodes.filter(n => n.type === 'farm' && n.isVisible).length}
              </div>
              <div className="text-sm text-muted-foreground">Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                🏭 {nodes.filter(n => n.type === 'collection_center' && n.isVisible).length}
              </div>
              <div className="text-sm text-muted-foreground">Collection Centers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ⚙️ {nodes.filter(n => n.type === 'processing_plant' && n.isVisible).length}
              </div>
              <div className="text-sm text-muted-foreground">Processing Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                📦 {nodes.filter(n => n.type === 'distributor' && n.isVisible).length}
              </div>
              <div className="text-sm text-muted-foreground">Distributors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                🏪 {nodes.filter(n => n.type === 'retail' && n.isVisible).length}
              </div>
              <div className="text-sm text-muted-foreground">Retail Outlets</div>
            </div>
          </div>

          {filteredPaths.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline">
                <Route className="h-3 w-3 mr-1" />
                {filteredPaths.length} paths shown
              </Badge>
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {filteredPaths.filter(p => p.isOptimal).length} optimal
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          <div className="relative rounded-lg overflow-hidden border" style={{ height: '600px' }}>
            <MapContainer
              center={[12.9716, 77.5946]} // Bangalore center
              zoom={8}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render shortest paths */}
              {filteredPaths.map((path, index) => {
                const positions = getPathPositions(path);
                const color = getPathColor(path);
                
                return (
                  <Polyline
                    key={`path-${index}`}
                    positions={positions}
                    color={color}
                    weight={path.isOptimal ? 4 : 2}
                    opacity={0.8}
                    dashArray={path.isOptimal ? undefined : '10, 5'}
                  />
                );
              })}
              
              {/* Render network nodes */}
              {visibleNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const nodeIcon = createNetworkIcon(node.type, isSelected, isConnected);
                
                return (
                  <Marker
                    key={node.id}
                    position={[node.lat, node.lng]}
                    icon={nodeIcon}
                    eventHandlers={{
                      click: () => onNodeSelect?.(node.id)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[250px]">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm">{node.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {node.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <p><strong>Capacity:</strong> {node.capacity.toLocaleString()} L</p>
                          {node.production && (
                            <p><strong>Production:</strong> {node.production.toLocaleString()} L/day</p>
                          )}
                          {node.demand && (
                            <p><strong>Demand:</strong> {node.demand.toLocaleString()} L/day</p>
                          )}
                          {node.district && (
                            <p><strong>District:</strong> {node.district}</p>
                          )}
                          {node.contact && (
                            <p><strong>Contact:</strong> {node.contact}</p>
                          )}
                          {node.phone && (
                            <p><strong>Phone:</strong> {node.phone}</p>
                          )}
                        </div>
                        
                        {isConnected && (
                          <div className="mt-2 pt-2 border-t">
                            <Badge variant="default" className="text-xs">
                              <Route className="h-3 w-3 mr-1" />
                              Connected in network flow
                            </Badge>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          Coordinates: {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Path Information */}
      {selectedPath && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Selected Path Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{selectedPath.totalDistance}km</div>
                <div className="text-sm text-muted-foreground">Total Distance</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{selectedPath.totalTime}h</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">₹{selectedPath.totalCost}</div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${getSpoilageRiskColor(selectedPath.totalSpoilageRisk)}`}>
                  {selectedPath.totalSpoilageRisk}%
                </div>
                <div className="text-sm text-muted-foreground">Spoilage Risk</div>
              </div>
            </div>
            
            <div className="mt-4">
              <Badge variant={selectedPath.isOptimal ? 'default' : 'secondary'}>
                {selectedPath.isOptimal ? 'Optimal Path' : 'Suboptimal Path'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Network Visualization:</strong> This map shows the optimized dairy supply chain network 
          with shortest paths calculated using Dijkstra's algorithm. Green paths are optimal, 
          orange paths are suboptimal, and red paths have high spoilage risk. 
          Connected nodes pulse to indicate active network participation.
        </AlertDescription>
      </Alert>
    </div>
  );

  function getSpoilageRiskColor(risk: number): string {
    if (risk <= 2) return 'text-green-600';
    if (risk <= 5) return 'text-yellow-600';
    return 'text-red-600';
  }
}