
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDairyData } from '@/hooks/useDairyData';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Truck, 
  MapPin,
  ThermometerSun
} from 'lucide-react';

export function EssentialNetworkMetrics() {
  const { nodes, routes } = useDairyData();

  // Calculate essential metrics based on real data
  const calculateMetrics = () => {
    const farms = nodes.filter(n => n.type === 'farm');
    const centers = nodes.filter(n => n.type === 'collection_center');
    const plants = nodes.filter(n => n.type === 'processing_plant');

    // Cost Efficiency: Based on route optimization potential
    const totalDistance = routes.reduce((sum, route) => sum + (route.distance_km || 0), 0);
    const averageDistance = totalDistance / Math.max(routes.length, 1);
    const costEfficiency = Math.max(0, 100 - (averageDistance / 50) * 100);

    // Time Efficiency: Based on average delivery times
    const averageDeliveryTime = routes.reduce((sum, route) => sum + (route.estimated_time_hours || 0), 0) / Math.max(routes.length, 1);
    const timeEfficiency = Math.max(0, 100 - (averageDeliveryTime / 8) * 100);

    // Capacity Utilization: Production vs Processing capacity
    const totalProduction = farms.reduce((sum, farm) => sum + farm.capacity, 0);
    const totalProcessingCapacity = plants.reduce((sum, plant) => sum + plant.capacity, 0);
    const capacityUtilization = Math.min(100, (totalProduction / Math.max(totalProcessingCapacity, 1)) * 100);

    // Network Coverage: Geographic distribution efficiency
    const avgFarmsPerCenter = farms.length / Math.max(centers.length, 1);
    const networkCoverage = Math.min(100, Math.max(0, 100 - (avgFarmsPerCenter - 5) * 10));

    // Quality Score: Based on route distances (shorter = better quality preservation)
    const qualityScore = Math.max(0, 100 - (averageDistance / 30) * 50);

    return {
      costEfficiency: Math.round(costEfficiency),
      timeEfficiency: Math.round(timeEfficiency),
      capacityUtilization: Math.round(capacityUtilization),
      networkCoverage: Math.round(networkCoverage),
      qualityScore: Math.round(qualityScore),
      totalDistance: Math.round(totalDistance),
      totalProduction: totalProduction,
      totalProcessingCapacity: totalProcessingCapacity,
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10
    };
  };

  const metrics = calculateMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Efficiency</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.costEfficiency)}`}>
                  {metrics.costEfficiency}%
                </p>
                <Badge variant="outline" className="mt-1">
                  {getScoreBadge(metrics.costEfficiency)}
                </Badge>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Efficiency</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.timeEfficiency)}`}>
                  {metrics.timeEfficiency}%
                </p>
                <Badge variant="outline" className="mt-1">
                  {getScoreBadge(metrics.timeEfficiency)}
                </Badge>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacity Utilization</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.capacityUtilization)}`}>
                  {metrics.capacityUtilization}%
                </p>
                <Badge variant="outline" className="mt-1">
                  {getScoreBadge(metrics.capacityUtilization)}
                </Badge>
              </div>
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Network Coverage</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.networkCoverage)}`}>
                  {metrics.networkCoverage}%
                </p>
                <Badge variant="outline" className="mt-1">
                  {getScoreBadge(metrics.networkCoverage)}
                </Badge>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.qualityScore)}`}>
                  {metrics.qualityScore}%
                </p>
                <Badge variant="outline" className="mt-1">
                  {getScoreBadge(metrics.qualityScore)}
                </Badge>
              </div>
              <ThermometerSun className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Network Distance</span>
                <span className="font-semibold">{metrics.totalDistance} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Delivery Time</span>
                <span className="font-semibold">{metrics.averageDeliveryTime} hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Routes</span>
                <span className="font-semibold">{routes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network Nodes</span>
                <span className="font-semibold">{nodes.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Daily Milk Production</span>
                <span className="font-semibold">{metrics.totalProduction.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Processing Capacity</span>
                <span className="font-semibold">{metrics.totalProcessingCapacity.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Capacity Surplus/Deficit</span>
                <span className={`font-semibold ${metrics.totalProcessingCapacity >= metrics.totalProduction ? 'text-green-600' : 'text-red-600'}`}>
                  {(metrics.totalProcessingCapacity - metrics.totalProduction).toLocaleString()} L
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Utilization Rate</span>
                <span className="font-semibold">{metrics.capacityUtilization}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Explanations */}
      <Card>
        <CardHeader>
          <CardTitle>Metric Calculations Logic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Cost Efficiency</h4>
              <p className="text-muted-foreground">Based on average route distances. Shorter routes = higher efficiency. Calculated as: 100 - (avg_distance/50)*100</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Time Efficiency</h4>
              <p className="text-muted-foreground">Based on delivery times. Faster deliveries = higher efficiency. Calculated as: 100 - (avg_time/8)*100</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Capacity Utilization</h4>
              <p className="text-muted-foreground">Production capacity vs processing capacity ratio. Shows how well the network balances supply and demand.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Network Coverage</h4>
              <p className="text-muted-foreground">Geographic distribution efficiency. Optimal ratio is ~5 farms per collection center.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quality Score</h4>
              <p className="text-muted-foreground">Based on route distances affecting milk quality. Shorter routes preserve quality better.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
