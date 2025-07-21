import { useQuery } from '@tanstack/react-query';
import { dairyService, type DairyFarm, type ProcessingPlant, type CollectionCenter, type TransportRoute, type DairyNetworkMetrics } from '@/services/dairyService';

export interface DairyMapNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant';
  lat: number;
  lng: number;
  capacity: number;
  production?: number;
  contact?: string;
  phone?: string;
  district: string;
  details: any;
}

export const useDairyData = () => {
  const { data: farms = [], isLoading: farmsLoading } = useQuery({
    queryKey: ['dairy-farms'],
    queryFn: () => dairyService.getDairyFarms(),
  });

  const { data: plants = [], isLoading: plantsLoading } = useQuery({
    queryKey: ['processing-plants'],
    queryFn: () => dairyService.getProcessingPlants(),
  });

  const { data: centers = [], isLoading: centersLoading } = useQuery({
    queryKey: ['collection-centers'],
    queryFn: () => dairyService.getCollectionCenters(),
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => dairyService.getTransportRoutes(),
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['network-metrics'],
    queryFn: () => dairyService.calculateNetworkMetrics(),
  });

  // Transform data into map nodes
  const nodes: DairyMapNode[] = [
    ...farms.map(farm => ({
      id: farm.id,
      name: farm.name,
      type: 'farm' as const,
      lat: farm.location_lat,
      lng: farm.location_lng,
      capacity: farm.daily_production_liters,
      production: farm.daily_production_liters,
      contact: farm.contact_person,
      phone: farm.phone,
      district: farm.district,
      details: farm
    })),
    ...plants.map(plant => ({
      id: plant.id,
      name: plant.name,
      type: 'processing_plant' as const,
      lat: plant.location_lat,
      lng: plant.location_lng,
      capacity: plant.processing_capacity_liters_per_day,
      contact: plant.contact_person,
      phone: plant.phone,
      district: plant.district,
      details: plant
    })),
    ...centers.map(center => ({
      id: center.id,
      name: center.name,
      type: 'collection_center' as const,
      lat: center.location_lat,
      lng: center.location_lng,
      capacity: center.storage_capacity_liters,
      contact: center.contact_person,
      phone: center.phone,
      district: center.district,
      details: center
    }))
  ];

  const isLoading = farmsLoading || plantsLoading || centersLoading || routesLoading || metricsLoading;

  return {
    nodes,
    farms,
    plants,
    centers,
    routes,
    metrics,
    isLoading,
    // Individual loading states
    farmsLoading,
    plantsLoading,
    centersLoading,
    routesLoading,
    metricsLoading
  };
};