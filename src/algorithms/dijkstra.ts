/**
 * Dijkstra's Algorithm Implementation for Dairy Supply Chain Optimization
 * 
 * This implementation finds the shortest path in a weighted graph considering:
 * - Distance (km)
 * - Time (hours)
 * - Cost (₹)
 * - Spoilage risk (%)
 * 
 * The algorithm uses a priority queue (min-heap) for optimal performance
 * and supports multi-objective optimization with configurable weights.
 */

export interface NetworkNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant' | 'distributor' | 'retail';
  lat: number;
  lng: number;
  capacity: number;
  production?: number;
  demand?: number;
  isVisible: boolean;
}

export interface NetworkEdge {
  from: string;
  to: string;
  distance: number; // km
  time: number; // hours
  cost: number; // ₹
  spoilageRisk: number; // %
  vehicleType: string;
  capacity: number; // liters
}

export interface OptimizationWeights {
  distance: number;
  time: number;
  cost: number;
  spoilageRisk: number;
}

export interface ShortestPathResult {
  path: string[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  totalSpoilageRisk: number;
  edges: NetworkEdge[];
  isOptimal: boolean;
}

export interface NetworkFlowResult {
  flows: Array<{
    from: NetworkNode;
    to: NetworkNode;
    volume: number;
    path: ShortestPathResult;
  }>;
  totalCost: number;
  totalTime: number;
  averageSpoilageRisk: number;
  networkEfficiency: number;
}

/**
 * Priority Queue implementation for Dijkstra's algorithm
 */
class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Calculate Haversine distance between two geographic points
 */
export function calculateHaversineDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate spoilage risk based on time and temperature
 */
export function calculateSpoilageRisk(
  timeHours: number, 
  temperature: number = 25,
  productType: string = 'milk'
): number {
  const baseRates = {
    milk: { ambient: 8.33, refrigerated: 0.21 },
    yogurt: { ambient: 4.17, refrigerated: 0.08 },
    cheese: { ambient: 2.08, refrigerated: 0.035 },
    butter: { ambient: 1.67, refrigerated: 0.023 }
  };
  
  const rates = baseRates[productType as keyof typeof baseRates] || baseRates.milk;
  const isRefrigerated = temperature <= 4;
  const spoilageRate = isRefrigerated ? rates.refrigerated : rates.ambient;
  
  // Apply temperature factor for non-refrigerated conditions
  const tempFactor = isRefrigerated ? 1 : Math.exp((temperature - 25) / 10);
  
  return Math.min(spoilageRate * timeHours * tempFactor, 100);
}

/**
 * Generate network edges based on logical supply chain flow
 */
export function generateNetworkEdges(
  nodes: NetworkNode[],
  weatherTemp: number = 25
): NetworkEdge[] {
  const edges: NetworkEdge[] = [];
  
  const farms = nodes.filter(n => n.type === 'farm' && n.isVisible);
  const centers = nodes.filter(n => n.type === 'collection_center' && n.isVisible);
  const plants = nodes.filter(n => n.type === 'processing_plant' && n.isVisible);
  const distributors = nodes.filter(n => n.type === 'distributor' && n.isVisible);
  const retailers = nodes.filter(n => n.type === 'retail' && n.isVisible);

  // Farm → Collection Center connections
  farms.forEach(farm => {
    centers.forEach(center => {
      const distance = calculateHaversineDistance(
        farm.lat, farm.lng, center.lat, center.lng
      );
      
      // Only connect if within reasonable distance (50km for collection)
      if (distance <= 50) {
        const time = distance / 40; // 40 km/h average speed for collection
        const cost = distance * 15; // ₹15/km for collection vehicles
        const spoilageRisk = calculateSpoilageRisk(time, weatherTemp, 'milk');
        
        edges.push({
          from: farm.id,
          to: center.id,
          distance,
          time,
          cost,
          spoilageRisk,
          vehicleType: 'milk_tanker',
          capacity: Math.min(farm.production || 0, 2000)
        });
      }
    });
  });

  // Collection Center → Processing Plant connections
  centers.forEach(center => {
    plants.forEach(plant => {
      const distance = calculateHaversineDistance(
        center.lat, center.lng, plant.lat, plant.lng
      );
      
      // Connect if within 100km for processing
      if (distance <= 100) {
        const time = distance / 50; // 50 km/h highway speed
        const cost = distance * 20; // ₹20/km for refrigerated transport
        const spoilageRisk = calculateSpoilageRisk(time, weatherTemp, 'milk');
        
        edges.push({
          from: center.id,
          to: plant.id,
          distance,
          time,
          cost,
          spoilageRisk,
          vehicleType: 'refrigerated_truck',
          capacity: center.capacity
        });
      }
    });
  });

  // Processing Plant → Distributor connections
  plants.forEach(plant => {
    distributors.forEach(distributor => {
      const distance = calculateHaversineDistance(
        plant.lat, plant.lng, distributor.lat, distributor.lng
      );
      
      if (distance <= 150) {
        const time = distance / 60; // 60 km/h for distribution
        const cost = distance * 18; // ₹18/km for distribution
        const spoilageRisk = calculateSpoilageRisk(time, weatherTemp, 'milk');
        
        edges.push({
          from: plant.id,
          to: distributor.id,
          distance,
          time,
          cost,
          spoilageRisk,
          vehicleType: 'distribution_truck',
          capacity: plant.capacity / 10 // Assume 10% of daily capacity per trip
        });
      }
    });
  });

  // Distributor → Retail connections
  distributors.forEach(distributor => {
    retailers.forEach(retailer => {
      const distance = calculateHaversineDistance(
        distributor.lat, distributor.lng, retailer.lat, retailer.lng
      );
      
      if (distance <= 75) {
        const time = distance / 45; // 45 km/h for local delivery
        const cost = distance * 12; // ₹12/km for local delivery
        const spoilageRisk = calculateSpoilageRisk(time, weatherTemp, 'milk');
        
        edges.push({
          from: distributor.id,
          to: retailer.id,
          distance,
          time,
          cost,
          spoilageRisk,
          vehicleType: 'delivery_van',
          capacity: retailer.demand || 500
        });
      }
    });
  });

  return edges;
}

/**
 * Dijkstra's Algorithm implementation with multi-objective optimization
 */
export function dijkstraShortestPath(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  startNodeId: string,
  endNodeId: string,
  weights: OptimizationWeights = { distance: 0.3, time: 0.3, cost: 0.2, spoilageRisk: 0.2 }
): ShortestPathResult | null {
  
  // Build adjacency list
  const graph = new Map<string, NetworkEdge[]>();
  nodes.forEach(node => graph.set(node.id, []));
  
  edges.forEach(edge => {
    const adjacentEdges = graph.get(edge.from) || [];
    adjacentEdges.push(edge);
    graph.set(edge.from, adjacentEdges);
  });

  // Initialize distances and previous nodes
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const edgeMap = new Map<string, NetworkEdge>();
  
  nodes.forEach(node => {
    distances.set(node.id, node.id === startNodeId ? 0 : Infinity);
    previous.set(node.id, null);
  });

  const pq = new PriorityQueue<string>();
  pq.enqueue(startNodeId, 0);

  const visited = new Set<string>();

  while (!pq.isEmpty()) {
    const currentNodeId = pq.dequeue();
    if (!currentNodeId || visited.has(currentNodeId)) continue;
    
    visited.add(currentNodeId);
    
    if (currentNodeId === endNodeId) break;

    const currentDistance = distances.get(currentNodeId) || Infinity;
    const adjacentEdges = graph.get(currentNodeId) || [];

    adjacentEdges.forEach(edge => {
      if (visited.has(edge.to)) return;

      // Calculate composite weight using multi-objective optimization
      const normalizedDistance = edge.distance / 100; // Normalize to 0-1 scale
      const normalizedTime = edge.time / 10;
      const normalizedCost = edge.cost / 1000;
      const normalizedSpoilage = edge.spoilageRisk / 100;

      const compositeWeight = 
        weights.distance * normalizedDistance +
        weights.time * normalizedTime +
        weights.cost * normalizedCost +
        weights.spoilageRisk * normalizedSpoilage;

      const newDistance = currentDistance + compositeWeight;
      const currentBest = distances.get(edge.to) || Infinity;

      if (newDistance < currentBest) {
        distances.set(edge.to, newDistance);
        previous.set(edge.to, currentNodeId);
        edgeMap.set(edge.to, edge);
        pq.enqueue(edge.to, newDistance);
      }
    });
  }

  // Reconstruct path
  if (!previous.has(endNodeId) || previous.get(endNodeId) === null) {
    return null; // No path found
  }

  const path: string[] = [];
  const pathEdges: NetworkEdge[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    if (current !== startNodeId) {
      const edge = edgeMap.get(current);
      if (edge) pathEdges.unshift(edge);
    }
    current = previous.get(current) || null;
  }

  // Calculate totals
  const totalDistance = pathEdges.reduce((sum, edge) => sum + edge.distance, 0);
  const totalTime = pathEdges.reduce((sum, edge) => sum + edge.time, 0);
  const totalCost = pathEdges.reduce((sum, edge) => sum + edge.cost, 0);
  const totalSpoilageRisk = Math.max(...pathEdges.map(edge => edge.spoilageRisk));

  // Determine if path is optimal (heuristic based on efficiency thresholds)
  const isOptimal = totalDistance < 200 && totalTime < 8 && totalSpoilageRisk < 5;

  return {
    path,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime: Math.round(totalTime * 10) / 10,
    totalCost: Math.round(totalCost),
    totalSpoilageRisk: Math.round(totalSpoilageRisk * 10) / 10,
    edges: pathEdges,
    isOptimal
  };
}

/**
 * Calculate network flow optimization for entire supply chain
 */
export function calculateNetworkFlow(
  nodes: NetworkNode[],
  weatherTemp: number = 25,
  optimizationWeights: OptimizationWeights = { distance: 0.3, time: 0.3, cost: 0.2, spoilageRisk: 0.2 }
): NetworkFlowResult {
  const edges = generateNetworkEdges(nodes, weatherTemp);
  const flows: NetworkFlowResult['flows'] = [];
  
  const farms = nodes.filter(n => n.type === 'farm' && n.isVisible);
  const retailers = nodes.filter(n => n.type === 'retail' && n.isVisible);
  
  let totalCost = 0;
  let totalTime = 0;
  let spoilageRisks: number[] = [];
  let successfulPaths = 0;

  // Find optimal paths from each farm to each retailer
  farms.forEach(farm => {
    retailers.forEach(retailer => {
      const shortestPath = dijkstraShortestPath(
        nodes, edges, farm.id, retailer.id, optimizationWeights
      );
      
      if (shortestPath) {
        const volume = Math.min(
          farm.production || 0,
          retailer.demand || 500
        );
        
        flows.push({
          from: farm,
          to: retailer,
          volume,
          path: shortestPath
        });
        
        totalCost += shortestPath.totalCost;
        totalTime += shortestPath.totalTime;
        spoilageRisks.push(shortestPath.totalSpoilageRisk);
        successfulPaths++;
      }
    });
  });

  const averageSpoilageRisk = spoilageRisks.length > 0 
    ? spoilageRisks.reduce((sum, risk) => sum + risk, 0) / spoilageRisks.length 
    : 0;

  // Calculate network efficiency based on successful path ratio and performance
  const totalPossiblePaths = farms.length * retailers.length;
  const pathSuccessRate = totalPossiblePaths > 0 ? successfulPaths / totalPossiblePaths : 0;
  const performanceScore = Math.max(0, 100 - averageSpoilageRisk - (totalTime / successfulPaths || 0) * 2);
  const networkEfficiency = (pathSuccessRate * 50) + (performanceScore * 0.5);

  return {
    flows,
    totalCost: Math.round(totalCost),
    totalTime: Math.round(totalTime * 10) / 10,
    averageSpoilageRisk: Math.round(averageSpoilageRisk * 10) / 10,
    networkEfficiency: Math.round(networkEfficiency * 10) / 10
  };
}

/**
 * Find all shortest paths in the network (for visualization)
 */
export function findAllShortestPaths(
  nodes: NetworkNode[],
  weatherTemp: number = 25
): ShortestPathResult[] {
  const edges = generateNetworkEdges(nodes, weatherTemp);
  const paths: ShortestPathResult[] = [];
  
  const sourceNodes = nodes.filter(n => 
    ['farm', 'collection_center', 'processing_plant', 'distributor'].includes(n.type) && n.isVisible
  );
  const targetNodes = nodes.filter(n => 
    ['collection_center', 'processing_plant', 'distributor', 'retail'].includes(n.type) && n.isVisible
  );

  sourceNodes.forEach(source => {
    targetNodes.forEach(target => {
      if (source.id !== target.id) {
        const path = dijkstraShortestPath(nodes, edges, source.id, target.id);
        if (path) {
          paths.push(path);
        }
      }
    });
  });

  return paths;
}