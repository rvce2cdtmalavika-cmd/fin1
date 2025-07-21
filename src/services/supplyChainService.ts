
import { supabase } from '@/integrations/supabase/client';

export interface Port {
  id: string;
  name: string;
  code: string;
  region: string;
  state: string;
  location_lat: number;
  location_lng: number;
  contact_person?: string;
  phone?: string;
  active: boolean;
}

export interface ColdStorage {
  id: string;
  name: string;
  state: string;
  city: string;
  location_lat: number;
  location_lng: number;
  capacity_kg: number;
  cost_per_hour: number;
  temperature_range?: string;
  refrigeration_type?: string;
  contact_person?: string;
  phone?: string;
  active: boolean;
}

export interface Market {
  id: string;
  name: string;
  state: string;
  city: string;
  location_lat: number;
  location_lng: number;
  market_type?: string;
  population_served?: number;
  active: boolean;
}

export interface Truck {
  id: string;
  license_plate: string;
  truck_type: string;
  capacity_kg: number;
  max_distance_km: number;
  cost_per_km: number;
  fuel_efficiency_kmpl?: number;
  owner_name?: string;
  phone?: string;
  available: boolean;
  home_port_id?: string;
}

export interface DailyCatch {
  id: string;
  port_id: string;
  user_id: string;
  catch_date: string;
  fish_type: string;
  volume_kg: number;
  quality_grade?: string;
  estimated_price_per_kg?: number;
  weather_conditions?: string;
}

export interface OptimizationResult {
  id: string;
  user_id: string;
  port_id: string;
  market_id: string;
  cold_storage_id?: string;
  truck_id: string;
  fish_type: string;
  volume_kg: number;
  distance_km: number;
  travel_time_hours: number;
  total_cost: number;
  revenue: number;
  net_profit: number;
  spoilage_percentage: number;
  route_data?: any;
  optimization_date: string;
}

class SupplyChainService {
  async getPorts() {
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching ports:', error);
      throw error;
    }
    return data as Port[];
  }

  async getColdStorages() {
    const { data, error } = await supabase
      .from('cold_storage')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching cold storages:', error);
      throw error;
    }
    return data as ColdStorage[];
  }

  async getMarkets() {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
    return data as Market[];
  }

  async getTrucks() {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('available', true)
      .order('license_plate');
    
    if (error) {
      console.error('Error fetching trucks:', error);
      throw error;
    }
    return data as Truck[];
  }

  async getDailyCatches(userId?: string) {
    let query = supabase
      .from('daily_catches')
      .select(`
        *,
        ports:port_id (name, code)
      `)
      .order('catch_date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching daily catches:', error);
      throw error;
    }
    return data;
  }

  async saveOptimizationResult(result: Omit<OptimizationResult, 'id'>) {
    const { data, error } = await supabase
      .from('optimization_results')
      .insert({
        ...result,
        fish_type: result.fish_type as 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving optimization result:', error);
      throw error;
    }
    return data as OptimizationResult;
  }

  async getOptimizationResults(userId: string) {
    const { data, error } = await supabase
      .from('optimization_results')
      .select(`
        *,
        ports:port_id (name, code),
        markets:market_id (name, city),
        trucks:truck_id (license_plate, truck_type),
        cold_storage:cold_storage_id (name, city)
      `)
      .eq('user_id', userId)
      .order('optimization_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching optimization results:', error);
      throw error;
    }
    return data;
  }

  async addDailyCatch(catchData: Omit<DailyCatch, 'id'>) {
    const { data, error } = await supabase
      .from('daily_catches')
      .insert({
        ...catchData,
        fish_type: catchData.fish_type as 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding daily catch:', error);
      throw error;
    }
    return data as DailyCatch;
  }
}

export const supplyChainService = new SupplyChainService();
