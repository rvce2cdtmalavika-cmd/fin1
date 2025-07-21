
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Thermometer,
  Truck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface OptimizationParams {
  objectiveFunction: 'minimize_cost' | 'minimize_time' | 'maximize_efficiency';
  constraints: {
    maxTransportTime: number;
    temperatureRange: { min: number; max: number };
    maxCapacityUtilization: number;
    shelfLifeBuffer: number;
  };
  dairySpecific: {
    spoilageRate: number;
    coolingCost: number;
    qualityDegradation: number;
  };
}

interface OptimizationResult {
  objective: string;
  totalCost: number;
  totalTime: number;
  efficiency: number;
  spoilagePercentage: number;
  recommendations: string[];
  routeOptimizations: {
    route: string;
    originalCost: number;
    optimizedCost: number;
    savings: number;
  }[];
}

export function DairyOptimizationEngine() {
  const [params, setParams] = useState<OptimizationParams>({
    objectiveFunction: 'minimize_cost',
    constraints: {
      maxTransportTime: 4,
      temperatureRange: { min: 2, max: 6 },
      maxCapacityUtilization: 85,
      shelfLifeBuffer: 2
    },
    dairySpecific: {
      spoilageRate: 0.02,
      coolingCost: 0.15,
      qualityDegradation: 0.01
    }
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const runOptimization = async () => {
    setIsOptimizing(true);
    setProgress(0);

    // Simulate optimization process
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Generate sample optimization result
    const optimizationResult: OptimizationResult = {
      objective: params.objectiveFunction.replace('_', ' ').toUpperCase(),
      totalCost: 125000,
      totalTime: 18.5,
      efficiency: 0.87,
      spoilagePercentage: 1.8,
      recommendations: [
        'Consolidate milk collection routes to reduce transportation costs by 15%',
        'Implement temperature monitoring at all nodes to reduce spoilage',
        'Add intermediate cooling stations for routes longer than 3 hours',
        'Optimize processing plant schedules to handle peak collection times',
        'Consider adding a distribution center in the northern region'
      ],
      routeOptimizations: [
        {
          route: 'Farm A → Collection Center 1',
          originalCost: 2500,
          optimizedCost: 2100,
          savings: 400
        },
        {
          route: 'Collection Center 1 → Processing Plant',
          originalCost: 5000,
          optimizedCost: 4200,
          savings: 800
        },
        {
          route: 'Processing Plant → Distribution Center',
          originalCost: 3500,
          optimizedCost: 3000,
          savings: 500
        }
      ]
    };

    setResult(optimizationResult);
    setIsOptimizing(false);
  };

  const updateConstraint = (key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [key]: value
      }
    }));
  };

  const updateDairySpecific = (key: string, value: number) => {
    setParams(prev => ({
      ...prev,
      dairySpecific: {
        ...prev.dairySpecific,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Optimization Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="objective" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="objective">Objective</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
                <TabsTrigger value="dairy">Dairy Specific</TabsTrigger>
              </TabsList>
              
              <TabsContent value="objective" className="space-y-4">
                <div>
                  <Label htmlFor="objective">Optimization Objective</Label>
                  <Select
                    value={params.objectiveFunction}
                    onValueChange={(value) => setParams(prev => ({ ...prev, objectiveFunction: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimize_cost">Minimize Total Cost</SelectItem>
                      <SelectItem value="minimize_time">Minimize Transit Time</SelectItem>
                      <SelectItem value="maximize_efficiency">Maximize Efficiency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="constraints" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxTime">Max Transport Time (hours)</Label>
                    <Input
                      id="maxTime"
                      type="number"
                      value={params.constraints.maxTransportTime}
                      onChange={(e) => updateConstraint('maxTransportTime', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Max Capacity Utilization (%)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={params.constraints.maxCapacityUtilization}
                      onChange={(e) => updateConstraint('maxCapacityUtilization', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempMin">Min Temperature (°C)</Label>
                    <Input
                      id="tempMin"
                      type="number"
                      value={params.constraints.temperatureRange.min}
                      onChange={(e) => updateConstraint('temperatureRange', {
                        ...params.constraints.temperatureRange,
                        min: Number(e.target.value)
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempMax">Max Temperature (°C)</Label>
                    <Input
                      id="tempMax"
                      type="number"
                      value={params.constraints.temperatureRange.max}
                      onChange={(e) => updateConstraint('temperatureRange', {
                        ...params.constraints.temperatureRange,
                        max: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shelfLife">Shelf Life Buffer (days)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    value={params.constraints.shelfLifeBuffer}
                    onChange={(e) => updateConstraint('shelfLifeBuffer', Number(e.target.value))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="dairy" className="space-y-4">
                <div>
                  <Label htmlFor="spoilage">Spoilage Rate (%/hour)</Label>
                  <Input
                    id="spoilage"
                    type="number"
                    step="0.01"
                    value={params.dairySpecific.spoilageRate}
                    onChange={(e) => updateDairySpecific('spoilageRate', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="cooling">Cooling Cost (₹/L/hour)</Label>
                  <Input
                    id="cooling"
                    type="number"
                    step="0.01"
                    value={params.dairySpecific.coolingCost}
                    onChange={(e) => updateDairySpecific('coolingCost', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Quality Degradation (%/hour)</Label>
                  <Input
                    id="quality"
                    type="number"
                    step="0.01"
                    value={params.dairySpecific.qualityDegradation}
                    onChange={(e) => updateDairySpecific('qualityDegradation', Number(e.target.value))}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runOptimization} 
              disabled={isOptimizing} 
              className="w-full"
            >
              {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
            </Button>

            {isOptimizing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress}% complete
                </p>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Optimization considers perishability, temperature requirements, and quality degradation specific to dairy products.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{result.totalCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Daily operational cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Transit Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.totalTime}h</div>
                <p className="text-xs text-muted-foreground">Average transit time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(result.efficiency * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Network efficiency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Spoilage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.spoilagePercentage}%</div>
                <p className="text-xs text-muted-foreground">Product spoilage</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Optimizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.routeOptimizations.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{route.route}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{route.originalCost} → ₹{route.optimizedCost}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        -₹{route.savings}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
