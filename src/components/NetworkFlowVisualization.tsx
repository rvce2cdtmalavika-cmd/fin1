import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  calculateNetworkFlow, 
  findAllShortestPaths,
  NetworkFlowResult,
  ShortestPathResult 
} from '@/algorithms/dijkstra';
import { 
  Route, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Network,
  Zap
} from 'lucide-react';

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
}

interface NetworkFlowVisualizationProps {
  nodes: NetworkNode[];
  weatherTemp?: number;
  onPathSelect?: (path: ShortestPathResult) => void;
}

export function NetworkFlowVisualization({ 
  nodes, 
  weatherTemp = 25,
  onPathSelect 
}: NetworkFlowVisualizationProps) {
  
  // Calculate network flow optimization
  const networkFlow = useMemo((): NetworkFlowResult => {
    return calculateNetworkFlow(nodes, weatherTemp);
  }, [nodes, weatherTemp]);

  // Find all shortest paths for visualization
  const allPaths = useMemo((): ShortestPathResult[] => {
    return findAllShortestPaths(nodes, weatherTemp);
  }, [nodes, weatherTemp]);

  // Group paths by efficiency
  const pathsByEfficiency = useMemo(() => {
    const optimal = allPaths.filter(p => p.isOptimal);
    const suboptimal = allPaths.filter(p => !p.isOptimal);
    
    return { optimal, suboptimal };
  }, [allPaths]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 80) return 'Excellent';
    if (efficiency >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getSpoilageRiskColor = (risk: number) => {
    if (risk <= 2) return 'text-green-600';
    if (risk <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Network Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Flow Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                ₹{networkFlow.totalCost.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Network Cost</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {networkFlow.totalTime.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Total Delivery Time</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className={`text-2xl font-bold ${getSpoilageRiskColor(networkFlow.averageSpoilageRisk)}`}>
                {networkFlow.averageSpoilageRisk.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Spoilage Risk</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className={`text-2xl font-bold ${getEfficiencyColor(networkFlow.networkEfficiency)}`}>
                {networkFlow.networkEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Network Efficiency</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Network Performance</span>
              <Badge variant={networkFlow.networkEfficiency >= 80 ? 'default' : 
                            networkFlow.networkEfficiency >= 60 ? 'secondary' : 'destructive'}>
                {getEfficiencyBadge(networkFlow.networkEfficiency)}
              </Badge>
            </div>
            <Progress value={networkFlow.networkEfficiency} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Active Flow Paths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Active Supply Chain Flows ({networkFlow.flows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {networkFlow.flows.map((flow, index) => (
              <div 
                key={index}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onPathSelect?.(flow.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{flow.from.name}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{flow.to.name}</span>
                  </div>
                  <Badge variant={flow.path.isOptimal ? 'default' : 'secondary'}>
                    {flow.path.isOptimal ? 'Optimal' : 'Suboptimal'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <div className="font-medium">{flow.volume.toLocaleString()}L</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance:</span>
                    <div className="font-medium">{flow.path.totalDistance}km</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-medium">{flow.path.totalTime}h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <div className="font-medium">₹{flow.path.totalCost}</div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Path: {flow.path.path.length} nodes • 
                  Spoilage Risk: {flow.path.totalSpoilageRisk.toFixed(1)}%
                </div>
              </div>
            ))}
            
            {networkFlow.flows.length === 0 && (
              <div className="text-center py-8">
                <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Flows</h3>
                <p className="text-muted-foreground">
                  Add farms and retail outlets to generate supply chain flows.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Path Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Optimal Paths ({pathsByEfficiency.optimal.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pathsByEfficiency.optimal.map((path, index) => (
                <div 
                  key={index}
                  className="p-2 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-green-100"
                  onClick={() => onPathSelect?.(path)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {path.totalDistance}km • {path.totalTime}h
                    </span>
                    <span className="text-xs text-green-600">
                      {path.totalSpoilageRisk.toFixed(1)}% risk
                    </span>
                  </div>
                </div>
              ))}
              
              {pathsByEfficiency.optimal.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No optimal paths found. Consider adding more intermediate nodes.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Suboptimal Paths ({pathsByEfficiency.suboptimal.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pathsByEfficiency.suboptimal.map((path, index) => (
                <div 
                  key={index}
                  className="p-2 bg-yellow-50 border border-yellow-200 rounded cursor-pointer hover:bg-yellow-100"
                  onClick={() => onPathSelect?.(path)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {path.totalDistance}km • {path.totalTime}h
                    </span>
                    <span className="text-xs text-yellow-600">
                      {path.totalSpoilageRisk.toFixed(1)}% risk
                    </span>
                  </div>
                </div>
              ))}
              
              {pathsByEfficiency.suboptimal.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All paths are optimal! Great network design.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Information */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Dijkstra's Algorithm Implementation:</strong> This system uses Dijkstra's shortest path algorithm 
          with multi-objective optimization considering distance, time, cost, and spoilage risk. 
          The algorithm ensures logical supply chain flow: Farm → Collection Center → Processing Plant → 
          Distributor → Retail, with real-time optimization based on current network conditions.
        </AlertDescription>
      </Alert>
    </div>
  );
}