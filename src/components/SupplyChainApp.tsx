
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedDairyNetworkDesigner } from './EnhancedDairyNetworkDesigner';
import { 
  Truck, 
  TrendingUp,
  MapPin
} from 'lucide-react';

export function SupplyChainApp() {
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
              <h1 className="text-3xl font-bold tracking-tight">Karnataka Dairy Supply Chain Optimizer</h1>
              <p className="text-muted-foreground">
                Interactive network design and optimization platform for dairy supply chains across Karnataka
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Real-time Optimization
            </Badge>
            <Badge variant="outline">
              <MapPin className="h-3 w-3 mr-1" />
              Karnataka Region Focus
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <EnhancedDairyNetworkDesigner />
      </div>
    </div>
  );
}
