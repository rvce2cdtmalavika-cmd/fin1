import React, { useMemo } from 'react';
import { dairyProducts, vehicleTypes } from '@/data/dairyProducts';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity: number;
  production?: number;
  isVisible?: boolean;
}

interface OptimalRoute {
  path: Array<{ lat: number; lng: number; name: string; type: string }>;
  totalDistance: number;
  totalCost: number;
  totalTime: number;
  maxSpoilageRisk: number;
  efficiency: 'optimal' | 'good' | 'poor';
}

interface WeatherData {
  temperature: number;
  humidity: number;
}

interface DynamicMetrics {
  totalCost: number;
  totalTime: number;
  averageQuality: number;
  spoilageRisk: number;
  efficiency: number;
  temperatureCompliance: number;
  networkUtilization: number;
  routeOptimality: number;
  weatherImpact: number;
  costPerKm: number;
  timePerNode: number;
  qualityRetention: number;
}

interface DynamicMetricsCalculatorProps {
  selectedProducts: string[];
  selectedVehicles: string[];
  nodes: NetworkNode[];
  optimalRoute?: OptimalRoute | null;
  weatherData?: WeatherData;
}

export function useDynamicMetrics({
  selectedProducts,
  selectedVehicles,
  nodes,
  optimalRoute,
  weatherData
}: DynamicMetricsCalculatorProps): DynamicMetrics {
  
  return useMemo(() => {
    // Get selected product and vehicle data
    const selectedProductData = dairyProducts.filter(p => selectedProducts.includes(p.id));
    const selectedVehicleData = vehicleTypes.find(v => selectedVehicles.includes(v.id));
    
    // Default metrics
    let metrics: DynamicMetrics = {
      totalCost: 0,
      totalTime: 0,
      averageQuality: 100,
      spoilageRisk: 0,
      efficiency: 100,
      temperatureCompliance: 100,
      networkUtilization: 0,
      routeOptimality: 100,
      weatherImpact: 0,
      costPerKm: 0,
      timePerNode: 0,
      qualityRetention: 100
    };

    if (selectedProductData.length === 0 || !selectedVehicleData) {
      return metrics;
    }

    const primaryProduct = selectedProductData[0];
    const currentTemp = weatherData?.temperature || 25;
    const currentHumidity = weatherData?.humidity || 65;

    // Calculate network utilization
    const visibleNodes = nodes.filter(n => n.isVisible !== false);
    const totalCapacity = visibleNodes.reduce((sum, node) => sum + node.capacity, 0);
    const totalProduction = visibleNodes
      .filter(n => n.type === 'farm')
      .reduce((sum, node) => sum + (node.production || 0), 0);
    
    metrics.networkUtilization = totalCapacity > 0 ? Math.min(100, (totalProduction / totalCapacity) * 100) : 0;

    // If we have an optimal route, use its metrics
    if (optimalRoute) {
      metrics.totalCost = optimalRoute.totalCost;
      metrics.totalTime = optimalRoute.totalTime;
      metrics.spoilageRisk = optimalRoute.maxSpoilageRisk;
      metrics.costPerKm = optimalRoute.totalDistance > 0 ? optimalRoute.totalCost / optimalRoute.totalDistance : 0;
      metrics.timePerNode = optimalRoute.path.length > 0 ? optimalRoute.totalTime / optimalRoute.path.length : 0;
      
      // Route optimality based on efficiency rating
      metrics.routeOptimality = optimalRoute.efficiency === 'optimal' ? 95 : 
                               optimalRoute.efficiency === 'good' ? 75 : 50;
    } else {
      // Calculate estimated metrics based on network structure
      const avgDistance = calculateAverageNetworkDistance(visibleNodes);
      const estimatedRoutes = Math.max(1, Math.floor(visibleNodes.length / 3));
      
      metrics.totalCost = avgDistance * estimatedRoutes * selectedVehicleData.costPerKm;
      metrics.totalTime = (avgDistance / 45) * estimatedRoutes; // 45 km/h average speed
      metrics.costPerKm = selectedVehicleData.costPerKm;
      metrics.timePerNode = visibleNodes.length > 0 ? metrics.totalTime / visibleNodes.length : 0;
    }

    // Temperature compliance calculation
    const isWithinRange = currentTemp >= primaryProduct.temperatureRange.min && 
                         currentTemp <= primaryProduct.temperatureRange.max;
    
    metrics.temperatureCompliance = isWithinRange ? 100 : 
      Math.max(0, 100 - Math.abs(currentTemp - primaryProduct.temperatureRange.optimal) * 10);

    // Quality calculations based on temperature and time
    const tempDeviation = Math.abs(currentTemp - primaryProduct.temperatureRange.optimal);
    const timeImpact = metrics.totalTime * 2; // 2% quality loss per hour
    const tempImpact = tempDeviation * 5; // 5% quality loss per degree deviation
    
    metrics.averageQuality = Math.max(0, 100 - timeImpact - tempImpact);
    metrics.qualityRetention = metrics.averageQuality;

    // Spoilage risk calculation (if not from route)
    if (!optimalRoute) {
      const baseSpoilageRate = isWithinRange ? 
        primaryProduct.spoilageRate.perHourRefrigerated : 
        primaryProduct.spoilageRate.perHourAtAmbient;
      
      const tempFactor = Math.exp(tempDeviation / 10);
      metrics.spoilageRisk = Math.min(100, baseSpoilageRate * metrics.totalTime * tempFactor);
    }

    // Weather impact calculation
    const optimalTemp = primaryProduct.temperatureRange.optimal;
    const tempImpactPercent = Math.abs(currentTemp - optimalTemp) / optimalTemp * 100;
    const humidityImpact = currentHumidity > 85 ? (currentHumidity - 85) * 2 : 0;
    metrics.weatherImpact = Math.min(100, tempImpactPercent + humidityImpact);

    // Overall efficiency calculation
    const qualityWeight = 0.3;
    const costWeight = 0.25;
    const timeWeight = 0.25;
    const utilizationWeight = 0.2;

    const normalizedCost = Math.max(0, 100 - (metrics.costPerKm - 10) * 2);
    const normalizedTime = Math.max(0, 100 - metrics.timePerNode * 10);
    
    metrics.efficiency = (
      metrics.averageQuality * qualityWeight +
      normalizedCost * costWeight +
      normalizedTime * timeWeight +
      metrics.networkUtilization * utilizationWeight
    );

    // Round all metrics to reasonable precision
    Object.keys(metrics).forEach(key => {
      metrics[key as keyof DynamicMetrics] = Math.round(metrics[key as keyof DynamicMetrics] * 10) / 10;
    });

    return metrics;
  }, [selectedProducts, selectedVehicles, nodes, optimalRoute, weatherData]);
}

// Helper function to calculate average distance between nodes
function calculateAverageNetworkDistance(nodes: NetworkNode[]): number {
  if (nodes.length < 2) return 0;
  
  let totalDistance = 0;
  let pairCount = 0;
  
  for (let i = 0; i < nodes.length - 1; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = calculateHaversineDistance(
        nodes[i].lat, nodes[i].lng,
        nodes[j].lat, nodes[j].lng
      );
      totalDistance += distance;
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalDistance / pairCount : 0;
}

// Haversine distance calculation
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
