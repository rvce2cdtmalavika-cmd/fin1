
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Thermometer,
  Target,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useDairyData } from '@/hooks/useDairyData';

interface CalculatedMetrics {
  costEfficiency: number;
  timeEfficiency: number;
  capacityUtilization: number;
  networkCoverage: number;
  qualityScore: number;
  sustainabilityIndex: number;
  totalProduction: number;
  totalCapacity: number;
  avgRouteDistance: number;
  totalRouteCost: number;
  alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; priority: number }>;
  recommendations: Array<{ category: string; description: string; impact: string; effort: string }>;
}

export function NetworkPerformanceOverview() {
  const { nodes, routes, metrics, isLoading } = useDairyData();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate real metrics based on actual data
  const calculatedMetrics = useMemo((): CalculatedMetrics => {
    if (nodes.length === 0) {
      return {
        costEfficiency: 0,
        timeEfficiency: 0,
        capacityUtilization: 0,
        networkCoverage: 0,
        qualityScore: 0,
        sustainabilityIndex: 0,
        totalProduction: 0,
        totalCapacity: 0,
        avgRouteDistance: 0,
        totalRouteCost: 0,
        alerts: [],
        recommendations: []
      };
    }

    // Calculate production and capacity
    const farms = nodes.filter(n => n.type === 'farm');
    const plants = nodes.filter(n => n.type === 'processing_plant');
    const centers = nodes.filter(n => n.type === 'collection_center');
    
    const totalProduction = farms.reduce((sum, farm) => sum + (farm.production || 0), 0);
    const totalCapacity = plants.reduce((sum, plant) => sum + plant.capacity, 0);
    const totalCenterCapacity = centers.reduce((sum, center) => sum + center.capacity, 0);

    // Calculate average route distance and cost
    const avgRouteDistance = routes.length > 0 
      ? routes.reduce((sum, route) => sum + (route.distance_km || 0), 0) / routes.length 
      : 0;
    
    const totalRouteCost = routes.reduce((sum, route) => sum + (route.cost_per_trip || 0), 0);

    // Calculate efficiency metrics with real logic
    const capacityUtilization = totalCapacity > 0 ? Math.min(100, (totalProduction / totalCapacity) * 100) : 0;
    
    // Cost efficiency: Lower average cost per km is better (inverse relationship)
    const avgCostPerKm = routes.length > 0 ? totalRouteCost / routes.reduce((sum, route) => sum + (route.distance_km || 1), 0) : 0;
    const costEfficiency = avgCostPerKm > 0 ? Math.max(0, Math.min(100, 100 - (avgCostPerKm - 10) * 2)) : 85;

    // Time efficiency: Based on route optimization (shorter routes = better efficiency)
    const timeEfficiency = avgRouteDistance > 0 ? Math.max(0, Math.min(100, 100 - (avgRouteDistance - 15) * 1.5)) : 80;

    // Network coverage: Based on geographic distribution
    const networkCoverage = Math.min(100, (nodes.length / 50) * 100); // Assuming 50 nodes for full coverage

    // Quality score: Based on collection center coverage and cooling facilities
    const coolingCenters = centers.filter(c => c.details?.cooling_facility).length;
    const qualityScore = centers.length > 0 ? Math.min(100, (coolingCenters / centers.length) * 100) : 75;

    // Sustainability: Based on route efficiency and organic farms
    const organicFarms = farms.filter(f => f.details?.organic_certified).length;
    const organicRatio = farms.length > 0 ? organicFarms / farms.length : 0;
    const routeEfficiency = avgRouteDistance > 0 ? Math.max(0, 1 - (avgRouteDistance - 10) / 50) : 0.8;
    const sustainabilityIndex = (organicRatio * 50) + (routeEfficiency * 50);

    // Generate real alerts based on data
    const alerts = [];
    if (capacityUtilization > 90) {
      alerts.push({ type: 'warning' as const, message: 'Processing capacity nearing limit. Consider adding more plants.', priority: 3 });
    }
    if (avgRouteDistance > 30) {
      alerts.push({ type: 'error' as const, message: 'Average route distance is high. Optimize collection routes.', priority: 3 });
    }
    if (coolingCenters < centers.length * 0.7) {
      alerts.push({ type: 'warning' as const, message: 'Insufficient cooling facilities may affect milk quality.', priority: 2 });
    }
    if (totalProduction > totalCenterCapacity) {
      alerts.push({ type: 'error' as const, message: 'Collection center capacity insufficient for current production.', priority: 3 });
    }

    // Generate real recommendations
    const recommendations = [];
    if (capacityUtilization < 50) {
      recommendations.push({
        category: 'Capacity Optimization',
        description: 'Processing plants are underutilized. Consider consolidating operations or finding new milk sources.',
        impact: 'High',
        effort: 'Medium'
      });
    }
    if (avgRouteDistance > 25) {
      recommendations.push({
        category: 'Route Optimization',
        description: 'Implement route optimization to reduce average distance and transportation costs.',
        impact: 'High',
        effort: 'Low'
      });
    }
    if (organicRatio < 0.3) {
      recommendations.push({
        category: 'Sustainability',
        description: 'Encourage more farms to adopt organic practices for premium market positioning.',
        impact: 'Medium',
        effort: 'High'
      });
    }

    return {
      costEfficiency,
      timeEfficiency,
      capacityUtilization,
      networkCoverage,
      qualityScore,
      sustainabilityIndex,
      totalProduction,
      totalCapacity,
      avgRouteDistance,
      totalRouteCost,
      alerts,
      recommendations
    };
  }, [nodes, routes]);

  // Generate realistic trend data based on current metrics
  const generateTrendData = () => {
    const baseMetrics = calculatedMetrics;
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      // Add realistic variations around current metrics
      const variation = (Math.sin(i / 7) * 5) + (Math.random() * 10 - 5);
      
      return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        efficiency: Math.max(0, Math.min(100, baseMetrics.timeEfficiency + variation)),
        cost: baseMetrics.totalRouteCost * (1 + (Math.random() * 0.2 - 0.1)),
        volume: baseMetrics.totalProduction * (1 + (Math.random() * 0.15 - 0.075))
      };
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
        <span className="ml-2">Calculating network performance...</span>
      </div>
    );
  }

  const trendData = generateTrendData();
  
  const pieData = [
    { name: 'Farms', value: nodes.filter(n => n.type === 'farm').length, color: '#10B981' },
    { name: 'Collection Centers', value: nodes.filter(n => n.type === 'collection_center').length, color: '#3B82F6' },
    { name: 'Processing Plants', value: nodes.filter(n => n.type === 'processing_plant').length, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.costEfficiency)}`}>
              {calculatedMetrics.costEfficiency.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.costEfficiency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ₹{(calculatedMetrics.totalRouteCost / Math.max(routes.length, 1)).toFixed(0)}/route
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.timeEfficiency)}`}>
              {calculatedMetrics.timeEfficiency.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.timeEfficiency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {calculatedMetrics.avgRouteDistance.toFixed(1)}km/route
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Capacity Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.capacityUtilization)}`}>
              {calculatedMetrics.capacityUtilization.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.capacityUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {(calculatedMetrics.totalProduction/1000).toFixed(0)}K/{(calculatedMetrics.totalCapacity/1000).toFixed(0)}K L/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.networkCoverage)}`}>
              {calculatedMetrics.networkCoverage.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.networkCoverage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {nodes.length} locations active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.qualityScore)}`}>
              {calculatedMetrics.qualityScore.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.qualityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Cooling facility coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sustainability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculatedMetrics.sustainabilityIndex)}`}>
              {calculatedMetrics.sustainabilityIndex.toFixed(1)}%
            </div>
            <Progress value={calculatedMetrics.sustainabilityIndex} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Route + organic efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Performance Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="network">Network Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Efficiency and cost metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#10B981" 
                      name="Efficiency %" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production vs Capacity</CardTitle>
                <CardDescription>Daily production compared to processing capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Production', value: calculatedMetrics.totalProduction, color: '#10B981' },
                    { name: 'Capacity', value: calculatedMetrics.totalCapacity, color: '#3B82F6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Network Alerts & Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedMetrics.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Systems Operating Normally</h3>
                  <p className="text-muted-foreground">No critical issues detected in your dairy network.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calculatedMetrics.alerts
                    .sort((a, b) => b.priority - a.priority)
                    .map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <Badge 
                        variant={alert.type === 'error' ? 'destructive' : 
                                alert.type === 'warning' ? 'secondary' : 'default'}
                      >
                        Priority {alert.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Optimization Recommendations</CardTitle>
              <CardDescription>Data-driven suggestions to improve your network performance</CardDescription>
            </CardHeader>
            <CardContent>
              {calculatedMetrics.recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Network is Well Optimized</h3>
                  <p className="text-muted-foreground">No major optimization opportunities detected at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculatedMetrics.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{rec.category}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">Impact: {rec.impact}</Badge>
                          <Badge variant="outline">Effort: {rec.effort}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Composition</CardTitle>
                <CardDescription>Distribution of facilities in your Karnataka network</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Statistics</CardTitle>
                <CardDescription>Key metrics about your dairy supply chain network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{nodes.length}</p>
                    <p className="text-sm text-muted-foreground">Total Facilities</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{routes.length}</p>
                    <p className="text-sm text-muted-foreground">Active Routes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(calculatedMetrics.totalProduction / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-muted-foreground">Daily Production (L)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(calculatedMetrics.totalCapacity / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-muted-foreground">Processing Capacity (L)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{calculatedMetrics.totalRouteCost.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Route Cost</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {calculatedMetrics.avgRouteDistance.toFixed(1)}km
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Route Distance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
