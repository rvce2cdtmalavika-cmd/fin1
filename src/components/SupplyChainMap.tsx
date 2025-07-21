
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import { LatLng, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// Custom icons for different node types
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
  port: createIcon('#2563EB', '⚓'),
  cold_storage: createIcon('#06B6D4', '❄️'),
  market: createIcon('#7C3AED', '🏪'),
  truck: createIcon('#F59E0B', '🚛'),
  custom: createIcon('#6B7280', '📍'),
};

const defaultIcon = createIcon('#6B7280', '📍');

export interface MapNode {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: number;
  demand?: number;
  details?: string;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  route?: LatLng[];
  color?: string;
  weight?: number;
}

interface SupplyChainMapProps {
  nodes: MapNode[];
  edges: MapEdge[];
  onMapClick?: (lat: number, lng: number) => void;
  isAddingNode?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
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

function MapContent({ nodes, edges, onMapClick, isAddingNode }: Omit<SupplyChainMapProps, 'center' | 'zoom' | 'height'>) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for map to stabilize
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
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
      
      {nodes.map((node) => {
        try {
          const nodeIcon = nodeIcons[node.type as keyof typeof nodeIcons] || defaultIcon;
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={nodeIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm">{node.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize mb-2">
                    {node.type.replace('_', ' ')}
                  </p>
                  {node.capacity && (
                    <p className="text-xs">Capacity: {node.capacity.toLocaleString()} kg</p>
                  )}
                  {node.demand && (
                    <p className="text-xs">Demand: {node.demand.toLocaleString()} kg/day</p>
                  )}
                  {node.details && (
                    <p className="text-xs mt-1">{node.details}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
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
      
      {edges.map((edge) => {
        try {
          if (!edge.route || edge.route.length === 0) {
            return null;
          }
          
          return (
            <Polyline
              key={edge.id}
              positions={edge.route}
              color={edge.color || "#2563eb"}
              weight={edge.weight || 3}
              opacity={0.7}
            />
          );
        } catch (error) {
          console.error('Error rendering polyline:', error, edge);
          return null;
        }
      })}
      
      {isAddingNode && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Click on the map to add a new location</span>
          </div>
        </div>
      )}
    </>
  );
}

export function SupplyChainMap({ 
  nodes, 
  edges, 
  onMapClick, 
  isAddingNode = false,
  center = [12.9716, 77.5946], // Bengaluru center
  zoom = 11,
  height = "400px"
}: SupplyChainMapProps) {
  const mapRef = useRef<any>(null);

  return (
    <ErrorBoundary fallback={
      <div className="rounded-lg border bg-muted/50 p-8 text-center" style={{ height }}>
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Unable to load map</p>
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
            edges={edges} 
            onMapClick={onMapClick} 
            isAddingNode={isAddingNode} 
          />
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
}
