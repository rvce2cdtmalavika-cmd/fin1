
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, LogOut, User, MapPin, BarChart3, Settings, Network, Milk } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupplyChainData } from '@/hooks/useSupplyChainData';
import { SupplyChainMap } from './SupplyChainMap';
import DairyNetworkDesigner from './DairyNetworkDesigner';
import { DairyOptimizationEngine } from './DairyOptimizationEngine';
import { ErrorBoundary } from './ErrorBoundary';

export default function SupplyChainApp() {
  const [activeTab, setActiveTab] = useState<string>('designer');
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { 
    nodes, 
    ports, 
    coldStorages, 
    markets, 
    trucks, 
    isLoading
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
          <Milk className="h-12 w-12 animate-bounce text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dairy supply chain optimizer...</p>
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
              <Milk className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Dairy Supply Chain Optimizer</span>
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
              <Milk className="h-8 w-8 text-primary" />
              Dairy Supply Chain Network Optimizer
            </h1>
            <p className="text-muted-foreground">
              Design and optimize your perishable FMCG supply chain network for minimum cost, time, and maximum efficiency.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="designer" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network Designer
              </TabsTrigger>
              <TabsTrigger value="optimizer" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Optimization Engine
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Network Map
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="designer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Dairy Network Designer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DairyNetworkDesigner />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimizer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Dairy Supply Chain Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DairyOptimizationEngine />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Interactive Network Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupplyChainMap 
                    nodes={nodes} 
                    edges={[]}
                    height="600px"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network Nodes</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{nodes.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total network facilities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processing Plants</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ports.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active processing facilities
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
                      Total capacity: {coldStorages.reduce((sum, cs) => sum + cs.capacity_kg, 0).toLocaleString()} L
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distribution Centers</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{markets.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active distribution points
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Network Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Milk className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Advanced Analytics Dashboard</h3>
                    <p className="text-muted-foreground mb-4">
                      Real-time network performance metrics, cost analysis, and efficiency tracking for dairy supply chains.
                    </p>
                    <Button disabled>
                      Generate Analytics Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}
