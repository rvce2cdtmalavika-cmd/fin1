import { supabase } from '@/integrations/supabase/client';

export interface DairyFarm {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  daily_production_liters: number;
  cattle_count: number;
  farm_type: string;
  contact_person?: string;
  phone?: string;
  district: string;
  established_year?: number;
  organic_certified: boolean;
  active: boolean;
}

export interface ProcessingPlant {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  processing_capacity_liters_per_day: number;
  plant_type: string;
  products: string[];
  contact_person?: string;
  phone?: string;
  district: string;
  established_year?: number;
  certifications?: string[];
  active: boolean;
}

export interface CollectionCenter {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  storage_capacity_liters: number;
  cooling_facility: boolean;
  collection_schedule: string;
  serves_villages: string[];
  contact_person?: string;
  phone?: string;
  district: string;
  active: boolean;
}

export interface TransportRoute {
  id: string;
  route_name: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  distance_km: number;
  estimated_time_hours: number;
  vehicle_type: string;
  cost_per_trip: number;
  frequency_per_day: number;
  optimal_load_liters: number;
  active: boolean;
}

export interface DairyNetworkMetrics {
  totalFarms: number;
  totalProduction: number;
  totalProcessingCapacity: number;
  totalCollectionCenters: number;
  averageTransportCost: number;
  networkEfficiency: number;
  totalCapacity?: number;
  efficiency?: number;
}

class DairyService {
  async getDairyFarms(): Promise<DairyFarm[]> {
    const { data, error } = await supabase
      .from('dairy_farms')
      .select('*')
      .eq('active', true)
      .order('daily_production_liters', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProcessingPlants(): Promise<ProcessingPlant[]> {
    const { data, error } = await supabase
      .from('processing_plants')
      .select('*')
      .eq('active', true)
      .order('processing_capacity_liters_per_day', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCollectionCenters(): Promise<CollectionCenter[]> {
    const { data, error } = await supabase
      .from('collection_centers')
      .select('*')
      .eq('active', true)
      .order('storage_capacity_liters', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTransportRoutes(): Promise<TransportRoute[]> {
    const { data, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('active', true)
      .order('cost_per_trip', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async calculateNetworkMetrics(): Promise<DairyNetworkMetrics> {
    const [farms, plants, centers, routes] = await Promise.all([
      this.getDairyFarms(),
      this.getProcessingPlants(),
      this.getCollectionCenters(),
      this.getTransportRoutes()
    ]);

    const totalProduction = farms.reduce((sum, farm) => sum + farm.daily_production_liters, 0);
    const totalProcessingCapacity = plants.reduce((sum, plant) => sum + plant.processing_capacity_liters_per_day, 0);
    const averageTransportCost = routes.reduce((sum, route) => sum + route.cost_per_trip, 0) / routes.length;
    const networkEfficiency = Math.min((totalProduction / totalProcessingCapacity) * 100, 100);

    return {
      totalFarms: farms.length,
      totalProduction,
      totalProcessingCapacity,
      totalCollectionCenters: centers.length,
      averageTransportCost: averageTransportCost || 0,
      networkEfficiency: networkEfficiency || 0
    };
  }

  async addDairyFarm(farm: Omit<DairyFarm, 'id'>): Promise<DairyFarm> {
    const { data, error } = await supabase
      .from('dairy_farms')
      .insert([farm])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addProcessingPlant(plant: Omit<ProcessingPlant, 'id'>): Promise<ProcessingPlant> {
    const { data, error } = await supabase
      .from('processing_plants')
      .insert([plant])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addCollectionCenter(center: Omit<CollectionCenter, 'id'>): Promise<CollectionCenter> {
    const { data, error } = await supabase
      .from('collection_centers')
      .insert([center])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addTransportRoute(route: Omit<TransportRoute, 'id'>): Promise<TransportRoute> {
    const { data, error } = await supabase
      .from('transport_routes')
      .insert([route])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Demo scenarios
  async generateOptimizedRoutes(): Promise<TransportRoute[]> {
    const [farms, centers, plants] = await Promise.all([
      this.getDairyFarms(),
      this.getCollectionCenters(),
      this.getProcessingPlants()
    ]);

    const optimizedRoutes: Omit<TransportRoute, 'id'>[] = [];

    // Generate farm to collection center routes
    farms.forEach(farm => {
      const nearestCenter = centers.reduce((nearest, center) => {
        const farmDistance = Math.sqrt(
          Math.pow(farm.location_lat - center.location_lat, 2) + 
          Math.pow(farm.location_lng - center.location_lng, 2)
        );
        const nearestDistance = Math.sqrt(
          Math.pow(farm.location_lat - nearest.location_lat, 2) + 
          Math.pow(farm.location_lng - nearest.location_lng, 2)
        );
        return farmDistance < nearestDistance ? center : nearest;
      });

      const distance = Math.sqrt(
        Math.pow(farm.location_lat - nearestCenter.location_lat, 2) + 
        Math.pow(farm.location_lng - nearestCenter.location_lng, 2)
      ) * 111; // Convert to approximate km

      optimizedRoutes.push({
        route_name: `${farm.name} → ${nearestCenter.name}`,
        from_type: 'farm',
        from_id: farm.id,
        to_type: 'collection_center',
        to_id: nearestCenter.id,
        distance_km: distance,
        estimated_time_hours: distance / 40, // Assuming 40 km/h average speed
        vehicle_type: 'milk_tanker',
        cost_per_trip: distance * 8, // ₹8 per km
        frequency_per_day: 2,
        optimal_load_liters: Math.min(farm.daily_production_liters / 2, 2000),
        active: true
      });
    });

    // Generate collection center to processing plant routes
    centers.forEach(center => {
      const nearestPlant = plants.reduce((nearest, plant) => {
        const centerDistance = Math.sqrt(
          Math.pow(center.location_lat - plant.location_lat, 2) + 
          Math.pow(center.location_lng - plant.location_lng, 2)
        );
        const nearestDistance = Math.sqrt(
          Math.pow(center.location_lat - nearest.location_lat, 2) + 
          Math.pow(center.location_lng - nearest.location_lng, 2)
        );
        return centerDistance < nearestDistance ? plant : nearest;
      });

      const distance = Math.sqrt(
        Math.pow(center.location_lat - nearestPlant.location_lat, 2) + 
        Math.pow(center.location_lng - nearestPlant.location_lng, 2)
      ) * 111;

      optimizedRoutes.push({
        route_name: `${center.name} → ${nearestPlant.name}`,
        from_type: 'collection_center',
        from_id: center.id,
        to_type: 'processing_plant',
        to_id: nearestPlant.id,
        distance_km: distance,
        estimated_time_hours: distance / 45, // Faster on highways
        vehicle_type: 'refrigerated_truck',
        cost_per_trip: distance * 12, // ₹12 per km for refrigerated transport
        frequency_per_day: 1,
        optimal_load_liters: center.storage_capacity_liters,
        active: true
      });
    });

    // Insert optimized routes
    const { data, error } = await supabase
      .from('transport_routes')
      .insert(optimizedRoutes)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const dairyService = new DairyService();