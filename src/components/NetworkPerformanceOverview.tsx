
import React, { useState, useEffect } from 'react';
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

interface PerformanceMetrics {
  costEfficiency: number;
  timeEfficiency: number;
  capacityUtilization: number;
  networkCoverage: number;
  qualityScore: number;
  sustainabilityIndex: number;
  trends: {
    daily: Array<{ date: string; cost: number; efficiency: number; volume: number }>;
    monthly: Array<{ month: string; profit: number; waste: number; satisfaction: number }>;
  };
  alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; priority: number }>;
  recommendations: Array<{ category: string; description: string; impact: string; effort: string }>;
}

export function NetworkPerformanceOverview() {
  const { nodes, routes, metrics, isLoading } = useDairyData();
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Calculate performance metrics based on actual network data
    if (nodes.length > 0 && routes.length > 0) {
      calculatePerformanceMetrics();
    }
  }, [nodes, routes, selectedTimeframe]);

  const calculatePerformanceMetrics = () => {
    const totalProduction = nodes
      .filter(n => n.type === 'farm')
      .reduce((sum, farm) => sum + (farm.production || 0), 0);
    
    const totalCapacity = nodes
      .filter(n => n.type === 'processing_plant')
      .reduce((sum, plant) => sum + plant.capacity, 0);

    const totalRoutes = routes.length;
    const avgDistance = routes.reduce((sum, route) => sum + (route.distance_km || 0), 0) / totalRoutes;

    // Generate sample performance data with realistic calculations
    const metrics: PerformanceMetrics = {
      costEfficiency: Math.min(95, 70 + (totalRoutes * 2)), // Better with more optimized routes
      timeEfficiency: Math.min(92, 60 + (nodes.length * 1.5)), // Better with more collection points
      capacityUtilization: Math.min(100, (totalProduction / totalCapacity) * 100),
      networkCoverage: Math.min(100, (nodes.length / 50) * 100), // Assuming 50 is optimal coverage
      qualityScore: 85 + Math.random() * 10, // Sample quality score
      sustainabilityIndex: 78 + Math.random() * 15,
      
      trends: {
        daily: generateDailyTrends(),
        monthly: generateMonthlyTrends()
      },
      
      alerts: [
        { type: 'warning', message: 'Cooling capacity at Hoskote center running at 95%', priority: 2 },
        { type: 'info', message: 'New route optimization available for Tumkur district', priority: 1 },
        { type: 'error', message: 'Temperature breach detected in Route TM-003', priority: 3 }
      ],
      
      recommendations: [
        {
          category: 'Cost Optimization',
          description: 'Consolidate milk collection routes in Ramanagara district',
          impact: 'High',
          effort: 'Medium'
        },
        {
          category: 'Capacity Planning',
          description: 'Add intermediate cooling station between Kolar and Bangalore',
          impact: 'Medium',
          effort: 'High'
        },
        {
          category: 'Quality Improvement',
          description: 'Implement real-time temperature monitoring on all vehicles',
          impact: 'High',
          effort: 'Low'
        }
      ]
    };

    setPerformanceData(metrics);
  };

  const generateDailyTrends = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        cost: 125000 + Math.random() * 25000,
        efficiency: 80 + Math.random() * 15,
        volume: 180000 + Math.random() * 40000
      });
    }
    return data;
  };

  const generateMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      profit: 2500000 + Math.random() * 1000000,
      waste: 2 + Math.random() * 3,
      satisfaction: 85 + Math.random() * 10
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  if (isLoading || !performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
        <span className="ml-2">Calculating network performance...</span>
      </div>
    );
  }

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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.costEfficiency)}`}>
              {performanceData.costEfficiency.toFixed(1)}%
            </div>
            <Progress value={performanceData.costEfficiency} className="mt-2" />
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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.timeEfficiency)}`}>
              {performanceData.timeEfficiency.toFixed(1)}%
            </div>
            <Progress value={performanceData.timeEfficiency} className="mt-2" />
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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.capacityUtilization)}`}>
              {performanceData.capacityUtilization.toFixed(1)}%
            </div>
            <Progress value={performanceData.capacityUtilization} className="mt-2" />
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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.networkCoverage)}`}>
              {performanceData.networkCoverage.toFixed(1)}%
            </div>
            <Progress value={performanceData.networkCoverage} className="mt-2" />
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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.qualityScore)}`}>
              {performanceData.qualityScore.toFixed(1)}%
            </div>
            <Progress value={performanceData.qualityScore} className="mt-2" />
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
            <div className={`text-2xl font-bold ${getScoreColor(performanceData.sustainabilityIndex)}`}>
              {performanceData.sustainabilityIndex.toFixed(1)}%
            </div>
            <Progress value={performanceData.sustainabilityIndex} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="network">Network Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance Trends</CardTitle>
                <CardDescription>Cost, efficiency, and volume over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData.trends.daily}>
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
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#3B82F6" 
                      name="Cost (₹)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit & Waste Analysis</CardTitle>
                <CardDescription>Financial performance and waste reduction trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData.trends.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#10B981" name="Profit (₹)" />
                    <Bar dataKey="waste" fill="#EF4444" name="Waste %" />
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
                Active Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.alerts
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions to improve your network performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.recommendations.map((rec, index) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Composition</CardTitle>
                <CardDescription>Distribution of facility types in your network</CardDescription>
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
                      {(nodes.filter(n => n.type === 'farm').reduce((sum, n) => sum + (n.production || 0), 0) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-muted-foreground">Daily Production (L)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(nodes.filter(n => n.type === 'processing_plant').reduce((sum, n) => sum + n.capacity, 0) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-muted-foreground">Processing Capacity (L)</p>
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
