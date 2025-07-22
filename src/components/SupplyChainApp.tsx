
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedDairyNetworkDesigner } from './EnhancedDairyNetworkDesigner';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  Truck, 
  TrendingUp,
  MapPin,
  Network
} from 'lucide-react';

export function SupplyChainApp() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dairy Supply Chain Optimizer</h1>
                <p className="text-muted-foreground">
                  Advanced network optimization with Dijkstra's shortest path algorithm and real-time analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Dijkstra's Algorithm
              </Badge>
              <Badge variant="outline">
                <Network className="h-3 w-3 mr-1" />
                Shortest Path Optimization
              </Badge>
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                Real-time Network Analysis
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <EnhancedDairyNetworkDesigner />
        </div>
      </div>
    </ErrorBoundary>
  );
}
