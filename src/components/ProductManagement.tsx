
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DAIRY_PRODUCTS, VEHICLE_TYPES } from '@/data/dairyProducts';
import { DairyProduct, VehicleType } from '@/types/products';
import { 
  Thermometer, 
  Clock, 
  AlertTriangle, 
  Truck, 
  Package,
  Info
} from 'lucide-react';

interface ProductManagementProps {
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
  selectedVehicles: string[];
  onVehiclesChange: (vehicles: string[]) => void;
}

export function ProductManagement({ 
  selectedProducts, 
  onProductsChange,
  selectedVehicles,
  onVehiclesChange 
}: ProductManagementProps) {
  const [customProducts, setCustomProducts] = useState<DairyProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<DairyProduct | null>(null);

  const allProducts = [...DAIRY_PRODUCTS, ...customProducts];

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const toggleVehicle = (vehicleId: string) => {
    if (selectedVehicles.includes(vehicleId)) {
      onVehiclesChange(selectedVehicles.filter(id => id !== vehicleId));
    } else {
      onVehiclesChange([...selectedVehicles, vehicleId]);
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 10) return 'text-green-600';
    if (temp < 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSpoilageRiskColor = (rate: number) => {
    if (rate < 1) return 'text-green-600';
    if (rate < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product & Vehicle Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products">Dairy Products</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicle Types</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Temperature ranges and shelf life data sourced from FSSAI and international dairy standards.
                  Peak collection times: 6-9 AM and 5-8 PM for fresh milk products.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProducts.includes(product.id) 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          <span className={getTemperatureColor(product.temperatureRange.optimal)}>
                            {product.temperatureRange.min}°C to {product.temperatureRange.max}°C
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Shelf: {product.shelfLife.refrigerated}h (refrigerated)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className={getSpoilageRiskColor(product.spoilageRate.perHourAtAmbient)}>
                            Risk: {product.spoilageRate.perHourAtAmbient}%/hr ambient
                          </span>
                        </div>

                        {product.nutritionalInfo && (
                          <div className="text-xs text-muted-foreground">
                            Fat: {product.nutritionalInfo.fatContent}%, 
                            Protein: {product.nutritionalInfo.proteinContent}%
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {product.qualityFactors.temperatureSensitivity === 'high' && (
                            <Badge variant="destructive" className="text-xs">High Temp Sensitivity</Badge>
                          )}
                          {product.qualityFactors.lightSensitivity && (
                            <Badge variant="secondary" className="text-xs">Light Sensitive</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-4">
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  Vehicle specifications include multi-day capability for extended routes and single-trip options for perishables.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VEHICLE_TYPES.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className={`cursor-pointer transition-all ${
                      selectedVehicles.includes(vehicle.id) 
                        ? 'ring-2 ring-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleVehicle(vehicle.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{vehicle.name}</h3>
                        <Badge variant={vehicle.type === 'refrigerated' ? 'default' : 'secondary'}>
                          {vehicle.type}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <span>Capacity: {vehicle.capacity}L</span>
                          <span>Max Trip: {vehicle.maxTripDuration}h</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <span>Efficiency: {vehicle.fuelEfficiency} km/L</span>
                          <span>Cost: ₹{vehicle.costPerKm}/km</span>
                        </div>

                        {vehicle.temperatureControl.canMaintain && (
                          <div className="text-green-600">
                            Temperature Control: {vehicle.temperatureControl.range?.min}°C to {vehicle.temperatureControl.range?.max}°C
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge variant={vehicle.multiDayCapable ? 'default' : 'outline'}>
                            {vehicle.multiDayCapable ? 'Multi-day Capable' : 'Single Trip'}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Suitable for: {vehicle.suitableProducts.join(', ')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
