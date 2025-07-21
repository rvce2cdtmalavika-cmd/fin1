
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useDairyData } from '@/hooks/useDairyData';
import { InteractiveNetworkMap } from './InteractiveNetworkMap';
import { EssentialNetworkMetrics } from './EssentialNetworkMetrics';
import { EnhancedDataImportExport } from './EnhancedDataImportExport';
import { 
  Network, 
  BarChart3, 
  Database, 
  Map,
  CheckCircle
} from 'lucide-react';

export function EnhancedDairyNetworkDesigner() {
  const { nodes, routes, isLoading } = useDairyData();
  const [activeTab, setActiveTab] = useState('network');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span className="ml-2">Loading Karnataka dairy network...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            Karnataka Dairy Supply Chain Network Designer
          </CardTitle>
          <CardDescription>
            Interactive network optimization tool for dairy supply chains across Karnataka with real-time visualization and constraint-based optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{nodes.filter(n => n.type === 'farm').length}</div>
              <div className="text-sm text-muted-foreground">Dairy Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nodes.filter(n => n.type === 'collection_center').length}</div>
              <div className="text-sm text-muted-foreground">Collection Centers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{nodes.filter(n => n.type === 'processing_plant').length}</div>
              <div className="text-sm text-muted-foreground">Processing Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{routes.length}</div>
              <div className="text-sm text-muted-foreground">Active Routes</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                Network Status: Operational
              </Badge>
              <Badge variant="outline">
                Karnataka Region
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Interactive Network Map
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4">
          <InteractiveNetworkMap />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <EssentialNetworkMetrics />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <EnhancedDataImportExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
