
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dairyProducts } from '@/data/dairyProducts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Thermometer,
  AlertTriangle
} from 'lucide-react';

interface RealTimeMetricsProps {
  selectedProducts: string[];
  selectedVehicles: string[];
  routes: any[];
  weatherData?: {
    temperature: number;
    humidity: number;
  };
}

interface MetricData {
  totalCost: number;
  totalTime: number;
  averageQuality: number;
  spoilageRisk: number;
  efficiency: number;
  temperatureCompliance: number;
}

export function RealTimeMetrics({ 
  selectedProducts, 
  selectedVehicles, 
  routes,
  weatherData 
}: RealTimeMetricsProps) {
  const [previousMetrics, setPreviousMetrics] = useState<MetricData | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const currentMetrics = useMemo(() => {
    // Calculate real-time metrics based on selected products and routes
    let totalCost = 0;
    let totalTime = 0;
    let qualityScores: number[] = [];
    let spoilageRisks: number[] = [];
    let tempCompliance: number[] = [];

    selectedProducts.forEach(productId => {
      const product = dairyProducts.find(p => p.id === productId);
      if (!product) return;

      routes.forEach(route => {
        // Calculate product-specific costs
        const distance = route.distance_km || 0;
        const baseTransportCost = distance * 15; // ₹15 per km base rate
        
        // Adjust cost based on product requirements
        const tempRequirementMultiplier = product.temperatureRange.max < 5 ? 1.5 : 1.0;
        const routeCost = baseTransportCost * tempRequirementMultiplier;
        
        totalCost += routeCost;
        
        // Calculate time including product-specific handling
        const travelTime = distance / 40; // 40 km/h average speed
        const handlingTime = product.shelfLife.refrigerated > 48 ? 0.5 : 1.0; // Less handling for longer shelf life
        totalTime += (travelTime + handlingTime);
        
        // Calculate quality score based on temperature compliance
        const currentTemp = weatherData?.temperature || 25;
        const isWithinRange = currentTemp >= product.temperatureRange.min && 
                            currentTemp <= product.temperatureRange.max;
        
        const qualityScore = isWithinRange ? 95 : Math.max(70, 95 - (Math.abs(currentTemp - product.temperatureRange.max) * 5));
        qualityScores.push(qualityScore);
        
        // Calculate spoilage risk
        const timeRisk = (travelTime / (product.shelfLife.refrigerated / 24)) * 100;
        const tempRisk = isWithinRange ? 0 : Math.min(50, Math.abs(currentTemp - product.temperatureRange.max) * 10);
        spoilageRisks.push(timeRisk + tempRisk);
        
        // Temperature compliance
        tempCompliance.push(isWithinRange ? 100 : Math.max(0, 100 - (Math.abs(currentTemp - product.temperatureRange.max) * 20)));
      });
    });

    const metrics: MetricData = {
      totalCost: totalCost,
      totalTime: totalTime,
      averageQuality: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0,
      spoilageRisk: spoilageRisks.length > 0 ? spoilageRisks.reduce((a, b) => a + b, 0) / spoilageRisks.length : 0,
      efficiency: Math.max(0, 100 - ((totalTime * 10) + (spoilageRisks.reduce((a, b) => a + b, 0) / spoilageRisks.length || 0))),
      temperatureCompliance: tempCompliance.length > 0 ? tempCompliance.reduce((a, b) => a + b, 0) / tempCompliance.length : 100
    };

    return metrics;
  }, [selectedProducts, selectedVehicles, routes, weatherData]);

  // Trigger animation when metrics change
  useEffect(() => {
    if (previousMetrics) {
      setAnimationTrigger(prev => prev + 1);
    }
    setPreviousMetrics(currentMetrics);
  }, [currentMetrics]);

  const getChangeIndicator = (current: number, previous: number | undefined, isInverse = false) => {
    if (previous === undefined) return null;
    
    const change = current - previous;
    const isPositive = isInverse ? change < 0 : change > 0;
    const changePercent = Math.abs((change / previous) * 100);
    
    if (Math.abs(change) < 0.1) return null;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {changePercent.toFixed(1)}%
      </div>
    );
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (value >= thresholds.warning) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cost Metrics */}
        <Card className={animationTrigger > 0 ? 'animate-pulse' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">₹{currentMetrics.totalCost.toFixed(0)}</div>
              {getChangeIndicator(currentMetrics.totalCost, previousMetrics?.totalCost, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transport & handling costs
            </p>
          </CardContent>
        </Card>

        {/* Time Metrics */}
        <Card className={animationTrigger > 0 ? 'animate-pulse' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{currentMetrics.totalTime.toFixed(1)}h</div>
              {getChangeIndicator(currentMetrics.totalTime, previousMetrics?.totalTime, true)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Including travel & handling
            </p>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card className={animationTrigger > 0 ? 'animate-pulse' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{currentMetrics.averageQuality.toFixed(0)}%</div>
              {getChangeIndicator(currentMetrics.averageQuality, previousMetrics?.averageQuality)}
            </div>
            <Progress value={currentMetrics.averageQuality} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Temperature compliance based
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Network Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Efficiency</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentMetrics.efficiency.toFixed(0)}%</span>
                {getStatusBadge(currentMetrics.efficiency, { good: 80, warning: 60 })}
              </div>
            </div>
            <Progress value={currentMetrics.efficiency} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Temperature Compliance</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentMetrics.temperatureCompliance.toFixed(0)}%</span>
                {getStatusBadge(currentMetrics.temperatureCompliance, { good: 95, warning: 85 })}
              </div>
            </div>
            <Progress value={currentMetrics.temperatureCompliance} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Spoilage Risk
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentMetrics.spoilageRisk.toFixed(1)}%</span>
                {getStatusBadge(100 - currentMetrics.spoilageRisk, { good: 80, warning: 60 })}
              </div>
            </div>
            <Progress value={Math.min(100, currentMetrics.spoilageRisk)} className="h-2" />
            
            {weatherData && (
              <div className="text-xs text-muted-foreground">
                Current conditions: {weatherData.temperature}°C, {weatherData.humidity}% humidity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product-specific metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Product Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProducts.map(productId => {
              const product = dairyProducts.find(p => p.id === productId);
              if (!product) return null;
              
              const currentTemp = weatherData?.temperature || 25;
              const isCompliant = currentTemp >= product.temperatureRange.min && 
                                currentTemp <= product.temperatureRange.max;
              
              return (
                <div key={productId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{product.name}</span>
                    <Badge variant={isCompliant ? "default" : "destructive"}>
                      {isCompliant ? "OK" : "Alert"}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Required: {product.temperatureRange.min}°C to {product.temperatureRange.max}°C</p>
                    <p>Shelf life: {product.shelfLife.refrigerated}h</p>
                    <p>Spoilage rate: {product.spoilageRate.perHourRefrigerated}%/h</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
