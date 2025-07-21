
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EnhancedDairyNetworkDesigner } from './EnhancedDairyNetworkDesigner';
import { 
  Truck, 
  BarChart3, 
  Settings, 
  Users,
  Milk,
  MapPin,
  TrendingUp
} from 'lucide-react';

export function SupplyChainApp() {
  const [activeTab, setActiveTab] = useState('dairy');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Supply Chain Optimizer</h1>
              <p className="text-muted-foreground">
                AI-powered optimization platform for agricultural and food supply chains
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Karnataka Region Active
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              Multi-user Platform
            </Badge>
            <Badge variant="outline">
              <BarChart3 className="h-3 w-3 mr-1" />
              Real-time Analytics
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dairy" className="flex items-center gap-2">
              <Milk className="h-4 w-4" />
              Dairy Supply Chain
            </TabsTrigger>
            <TabsTrigger value="fisheries" className="flex items-center gap-2" disabled>
              <div className="h-4 w-4">🐟</div>
              Fisheries (Coming Soon)
            </TabsTrigger>
            <TabsTrigger value="agriculture" className="flex items-center gap-2" disabled>
              <div className="h-4 w-4">🌾</div>
              Agriculture (Coming Soon)
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2" disabled>
              <MapPin className="h-4 w-4" />
              General Logistics (Coming Soon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dairy" className="space-y-6">
            <EnhancedDairyNetworkDesigner />
          </TabsContent>

          <TabsContent value="fisheries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">🐟</div>
                  Fisheries Supply Chain Optimizer
                </CardTitle>
                <CardDescription>
                  Specialized optimization for fisheries and seafood supply chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Fisheries supply chain optimization with cold storage, port management, 
                    and catch-to-market tracking is under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agriculture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">🌾</div>
                  Agricultural Supply Chain Optimizer
                </CardTitle>
                <CardDescription>
                  Comprehensive optimization for agricultural produce and farming networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Agricultural supply chain optimization with farm-to-market tracking, 
                    seasonal planning, and crop-specific logistics is in development.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  General Logistics Optimizer
                </CardTitle>
                <CardDescription>
                  Multi-modal logistics optimization for general supply chain networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚧</div>
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    General purpose supply chain optimization with multi-modal transportation, 
                    warehouse management, and distribution networks is planned for future release.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
