import React from 'react';
import { Polyline, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface OptimalRouteProps {
  route: Array<{ lat: number; lng: number; name: string; type: string }>;
  totalDistance: number;
  totalCost: number;
  efficiency: 'optimal' | 'good' | 'poor';
}

const createRouteMarker = (index: number, isStart: boolean, isEnd: boolean) => {
  const color = isStart ? '#10B981' : isEnd ? '#EF4444' : '#3B82F6';
  const symbol = isStart ? '🚀' : isEnd ? '🎯' : '📍';
  
  return divIcon({
    className: 'custom-route-marker',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      ${symbol}
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #333;
      ">${index + 1}</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export function OptimalRouteVisualization({ route, totalDistance, totalCost, efficiency }: OptimalRouteProps) {
  if (route.length < 2) return null;

  const routeColor = efficiency === 'optimal' ? '#10B981' : 
                   efficiency === 'good' ? '#F59E0B' : '#EF4444';

  const routePositions = route.map(point => [point.lat, point.lng] as [number, number]);

  return (
    <>
      {/* Main route line with enhanced styling */}
      <Polyline
        positions={routePositions}
        color={routeColor}
        weight={6}
        opacity={0.8}
        dashArray={efficiency === 'optimal' ? undefined : '10, 5'}
      />
      
      {/* Shadow/outline for better visibility */}
      <Polyline
        positions={routePositions}
        color="#000000"
        weight={8}
        opacity={0.3}
      />

      {/* Route markers with sequence numbers */}
      {route.map((point, index) => (
        <Marker
          key={`route-${index}`}
          position={[point.lat, point.lng]}
          icon={createRouteMarker(index, index === 0, index === route.length - 1)}
        />
      ))}
    </>
  );
}