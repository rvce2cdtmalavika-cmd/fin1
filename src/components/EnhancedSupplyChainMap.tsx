import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLng, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Loader2, Route, Target } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { OptimalRouteVisualization } from './OptimalRouteVisualization';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Enhanced custom icons for different node types
const createEnhancedIcon = (type: string, isSelected: boolean = false) => {
  const iconConfig = {
    farm: { color: '#10B981', emoji: '🐄', size: isSelected ? 36 : 30 },
    collection_center: { color: '#3B82F6', emoji: '🏭', size: isSelected ? 36 : 30 },
    processing_plant: { color: '#8B5CF6', emoji: '⚙️', size: isSelected ? 36 : 30 },
    distributor: { color: '#F59E0B', emoji: '📦', size: isSelected ? 36 : 30 },
    retail: { color: '#EF4444', emoji: '🏪', size: isSelected ? 36 : 30 },
    custom: { color: '#6B7280', emoji: '📍', size: isSelected ? 36 : 30 },
  };

  const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.custom;
  
  return divIcon({
    className: 'custom-enhanced-icon',
    html: `<div style="
      background-color: ${config.color};
      width: ${config.size}px;
      height: ${config.size}px;
      border-radius: 50%;
      border: ${isSelected ? '4px' : '2px'} solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${config.size * 0.5}px;
      box-shadow: 0 ${isSelected ? '6px 12px' : '2px 4px'} rgba(0,0,0,${isSelected ? '0.4' : '0.3'});
      transition: all 0.3s ease;
      ${isSelected ? 'transform: scale(1.1);' : ''}
    ">${config.emoji}</div>`,
    iconSize: [config.size, config.size],
    iconAnchor: [config.size / 2, config.size / 2],
  });
};

export interface EnhancedMapNode {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: number;
  demand?: number;
  production?: number;
  details?: string;
  district?: string;
  contact?: string;
  phone?: string;
  isVisible?: boolean;
}

export interface OptimalRoute {
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

interface EnhancedSupplyChainMapProps {
  nodes: EnhancedMapNode[];
  onMapClick?: (lat: number, lng: number) => void;
  isAddingNode?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  optimalRoute?: OptimalRoute | null;
  selectedNodeId?: string;
  onNodeSelect?: (nodeId: string) => void;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapContent({ 
  nodes, 
  onMapClick, 
  isAddingNode, 
  optimalRoute, 
  selectedNodeId, 
  onNodeSelect 
}: Omit<EnhancedSupplyChainMapProps, 'center' | 'zoom' | 'height'>) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading enhanced map...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* Render optimal route first (behind markers) */}
      {optimalRoute && (
        <OptimalRouteVisualization
          route={optimalRoute.path}
          totalDistance={optimalRoute.totalDistance}
          totalCost={optimalRoute.totalCost}
          efficiency={optimalRoute.efficiency}
        />
      )}
      
      {/* Render network nodes */}
      {nodes
        .filter(node => node.isVisible !== false)
        .map((node) => {
          try {
            const isSelected = selectedNodeId === node.id;
            const nodeIcon = createEnhancedIcon(node.type, isSelected);
            
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
                      {node.capacity && (
                        <p><strong>Capacity:</strong> {node.capacity.toLocaleString()} L</p>
                      )}
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
                      {node.details && (
                        <p><strong>Details:</strong> {node.details}</p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      Coordinates: {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          } catch (error) {
            console.error('Error rendering marker:', error, node);
            return null;
          }
        })}
      
      {/* Adding node indicator */}
      {isAddingNode && (
        <div className="absolute top-4 left-4 z-[1000]">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Target className="h-4 w-4" />
                <span>Click on the map to add a new location</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Route information overlay */}
      {optimalRoute && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm">Optimal Route</span>
                <Badge variant={
                  optimalRoute.efficiency === 'optimal' ? 'default' : 
                  optimalRoute.efficiency === 'good' ? 'secondary' : 'destructive'
                }>
                  {optimalRoute.efficiency.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{optimalRoute.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">₹{optimalRoute.totalCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{optimalRoute.totalTime.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Spoilage Risk:</span>
                  <span className="font-medium">{optimalRoute.maxSpoilageRisk.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle:</span>
                  <span className="font-medium text-xs">{optimalRoute.vehicleType}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export function EnhancedSupplyChainMap({ 
  nodes, 
  onMapClick, 
  isAddingNode = false,
  center = [12.9716, 77.5946], // Bengaluru center
  zoom = 8,
  height = "500px",
  optimalRoute = null,
  selectedNodeId,
  onNodeSelect
}: EnhancedSupplyChainMapProps) {
  const mapRef = useRef<any>(null);

  return (
    <ErrorBoundary fallback={
      <div className="rounded-lg border bg-muted/50 p-8 text-center" style={{ height }}>
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Unable to load enhanced map</p>
      </div>
    }>
      <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <MapContent 
            nodes={nodes} 
            onMapClick={onMapClick} 
            isAddingNode={isAddingNode}
            optimalRoute={optimalRoute}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
          />
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
}