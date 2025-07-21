
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplyChainService } from '@/services/supplyChainService';
import { useAuth } from '@/hooks/useAuth';
import { MapNode } from '@/components/SupplyChainMap';

export function useSupplyChainData() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<MapNode[]>([]);

  const { data: ports, isLoading: portsLoading } = useQuery({
    queryKey: ['ports'],
    queryFn: supplyChainService.getPorts,
  });

  const { data: coldStorages, isLoading: coldStoragesLoading } = useQuery({
    queryKey: ['cold-storages'],
    queryFn: supplyChainService.getColdStorages,
  });

  const { data: markets, isLoading: marketsLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: supplyChainService.getMarkets,
  });

  const { data: trucks, isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: supplyChainService.getTrucks,
  });

  const { data: dailyCatches, isLoading: catchesLoading } = useQuery({
    queryKey: ['daily-catches', user?.id],
    queryFn: () => supplyChainService.getDailyCatches(user?.id),
    enabled: !!user,
  });

  const { data: optimizationResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['optimization-results', user?.id],
    queryFn: () => supplyChainService.getOptimizationResults(user?.id || ''),
    enabled: !!user,
  });

  useEffect(() => {
    const allNodes: MapNode[] = [];

    // Add ports
    if (ports) {
      ports.forEach(port => {
        allNodes.push({
          id: port.id,
          name: port.name,
          type: 'port',
          lat: port.location_lat,
          lng: port.location_lng,
          details: `Code: ${port.code} | Region: ${port.region}`
        });
      });
    }

    // Add cold storages
    if (coldStorages) {
      coldStorages.forEach(storage => {
        allNodes.push({
          id: storage.id,
          name: storage.name,
          type: 'cold_storage',
          lat: storage.location_lat,
          lng: storage.location_lng,
          capacity: storage.capacity_kg,
          details: `${storage.temperature_range} | ₹${storage.cost_per_hour}/hr`
        });
      });
    }

    // Add markets
    if (markets) {
      markets.forEach(market => {
        allNodes.push({
          id: market.id,
          name: market.name,
          type: 'market',
          lat: market.location_lat,
          lng: market.location_lng,
          demand: market.population_served,
          details: `${market.market_type} market | ${market.city}, ${market.state}`
        });
      });
    }

    setNodes(allNodes);
  }, [ports, coldStorages, markets]);

  const isLoading = portsLoading || coldStoragesLoading || marketsLoading || trucksLoading;

  return {
    nodes,
    ports: ports || [],
    coldStorages: coldStorages || [],
    markets: markets || [],
    trucks: trucks || [],
    dailyCatches: dailyCatches || [],
    optimizationResults: optimizationResults || [],
    isLoading,
    catchesLoading,
    resultsLoading,
  };
}
