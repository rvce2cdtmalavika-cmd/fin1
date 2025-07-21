import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, LogOut, User, MapPin, BarChart3, Settings, Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupplyChainData } from '@/hooks/useSupplyChainData';
import { SupplyChainMap, MapEdge } from './SupplyChainMap';
import { ErrorBoundary } from './ErrorBoundary';

export default function SupplyChainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { 
    nodes, 
    ports, 
    coldStorages, 
    markets, 
    trucks, 
    dailyCatches, 
    optimizationResults,
    isLoading,
    catchesLoading,
    resultsLoading 
  } = useSupplyChainData();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of the application.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading supply chain data...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Supply Chain Optimizer</span>
              <Badge variant="outline" className="ml-2">v2.0</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Supply Chain Management System
            </h1>
            <p className="text-muted-foreground">
              Real-time supply chain optimization for fisheries logistics across India
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Interactive Map
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Management
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Optimization
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Ports</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ports.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Fishing ports in network
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cold Storage</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{coldStorages.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total capacity: {coldStorages.reduce((sum, cs) => sum + cs.capacity_kg, 0).toLocaleString()} kg
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Markets</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{markets.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Distribution centers
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Trucks</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{trucks.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Fleet capacity: {trucks.reduce((sum, truck) => sum + truck.capacity_kg, 0).toLocaleString()} kg
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Supply Chain Network Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <SupplyChainMap 
                    nodes={nodes} 
                    edges={edges}
                    height="500px"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Interactive Supply Chain Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupplyChainMap 
                    nodes={nodes} 
                    edges={edges}
                    height="600px"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Daily Catches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {catchesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : dailyCatches.length > 0 ? (
                      <div className="space-y-3">
                        {dailyCatches.slice(0, 5).map((catchItem) => (
                          <div key={catchItem.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{catchItem.fish_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {catchItem.ports?.name || 'Unknown Port'} - {new Date(catchItem.catch_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{catchItem.volume_kg.toLocaleString()} kg</p>
                              <p className="text-sm text-muted-foreground">{catchItem.quality_grade}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No daily catches recorded</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Network Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Nodes</p>
                        <p className="text-2xl font-bold">{nodes.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Routes</p>
                        <p className="text-2xl font-bold">{edges.length}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Ports</span>
                        <Badge variant="secondary">{ports.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cold Storage</span>
                        <Badge variant="secondary">{coldStorages.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Markets</span>
                        <Badge variant="secondary">{markets.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Trucks</span>
                        <Badge variant="secondary">{trucks.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Engine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Advanced Optimization Coming Soon</h3>
                    <p className="text-muted-foreground mb-4">
                      Real-time route optimization and demand forecasting features are under development.
                    </p>
                    <Button disabled>
                      Run Optimization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {resultsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : optimizationResults.length > 0 ? (
                    <div className="space-y-3">
                      {optimizationResults.slice(0, 10).map((result) => (
                        <div key={result.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{result.fish_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.ports?.name || 'Unknown Port'} → {result.markets?.name || 'Unknown Market'}
                              </p>
                            </div>
                            <Badge variant={result.net_profit > 0 ? "default" : "destructive"}>
                              ₹{result.net_profit.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Volume:</span> {result.volume_kg.toLocaleString()} kg
                            </div>
                            <div>
                              <span className="text-muted-foreground">Distance:</span> {result.distance_km.toFixed(1)} km
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span> {result.travel_time_hours.toFixed(1)}h
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No optimization results available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}