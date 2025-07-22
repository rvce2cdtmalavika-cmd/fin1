export interface DairyProduct {
  id: string;
  name: string;
  category: 'milk' | 'fermented' | 'cheese' | 'butter' | 'frozen';
  temperatureRange: {
    min: number;
    max: number;
    optimal: number;
  };
  shelfLife: {
    ambient: number; // hours
    refrigerated: number; // hours
    frozen?: number; // hours
  };
  qualityFactors: {
    temperatureSensitivity: 'low' | 'medium' | 'high';
    lightSensitivity: boolean;
    oxygenSensitivity: boolean;
  };
  spoilageRate: {
    perHourAtAmbient: number;
    perHourRefrigerated: number;
  };
  nutritionalInfo?: {
    fatContent?: number; // percentage
    proteinContent?: number; // percentage
    lactoseContent?: number; // percentage
  };
  packagingRequirements: string[];
  transportRequirements: string[];
}

export const dairyProducts: DairyProduct[] = [
  {
    id: 'whole-milk',
    name: 'Whole Milk',
    category: 'milk',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLife: {
      ambient: 6, // hours
      refrigerated: 168, // 7 days
    },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 2.0,
      perHourRefrigerated: 0.1
    },
    nutritionalInfo: {
      fatContent: 3.5,
      proteinContent: 3.2,
      lactoseContent: 4.8
    },
    packagingRequirements: ['airtight', 'light-proof'],
    transportRequirements: ['refrigerated', 'upright']
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    category: 'fermented',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLife: {
      ambient: 4, // hours
      refrigerated: 336, // 14 days
    },
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 1.5,
      perHourRefrigerated: 0.05
    },
    nutritionalInfo: {
      fatContent: 1.5,
      proteinContent: 4.0,
      lactoseContent: 3.2
    },
    packagingRequirements: ['airtight', 'sealed'],
    transportRequirements: ['refrigerated', 'gentle']
  },
  {
    id: 'cheese',
    name: 'Cheese',
    category: 'cheese',
    temperatureRange: { min: 2, max: 8, optimal: 4 },
    shelfLife: {
      ambient: 12, // hours
      refrigerated: 720, // 30 days
    },
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 0.8,
      perHourRefrigerated: 0.02
    },
    nutritionalInfo: {
      fatContent: 25.0,
      proteinContent: 22.0,
      lactoseContent: 0.5
    },
    packagingRequirements: ['breathable', 'moisture-controlled'],
    transportRequirements: ['cool', 'dry']
  },
  {
    id: 'butter',
    name: 'Butter',
    category: 'butter',
    temperatureRange: { min: 0, max: 6, optimal: 3 },
    shelfLife: {
      ambient: 24, // hours
      refrigerated: 1440, // 60 days
    },
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: true,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 0.5,
      perHourRefrigerated: 0.01
    },
    nutritionalInfo: {
      fatContent: 82.0,
      proteinContent: 0.8,
      lactoseContent: 0.1
    },
    packagingRequirements: ['light-proof', 'airtight'],
    transportRequirements: ['refrigerated', 'stable']
  }
];

export const vehicleTypes = [
  {
    id: 'refrigerated-truck',
    name: 'Refrigerated Truck',
    type: 'refrigerated' as const,
    capacity: 5000,
    temperatureControl: {
      canMaintain: true,
      range: { min: -2, max: 8 }
    },
    maxTripDuration: 24,
    fuelEfficiency: 8,
    costPerKm: 25,
    multiDayCapable: true,
    suitableProducts: ['milk', 'fermented', 'cheese', 'butter']
  },
  {
    id: 'insulated-truck',
    name: 'Insulated Truck',
    type: 'insulated' as const,
    capacity: 8000,
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 8,
    fuelEfficiency: 12,
    costPerKm: 18,
    multiDayCapable: false,
    suitableProducts: ['cheese', 'butter']
  },
  {
    id: 'standard-truck',
    name: 'Standard Truck',
    type: 'ambient' as const,
    capacity: 10000,
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 6,
    fuelEfficiency: 15,
    costPerKm: 12,
    multiDayCapable: false,
    suitableProducts: ['processed']
  }
];

// Keep the existing DAIRY_PRODUCTS export for backward compatibility
export const DAIRY_PRODUCTS = dairyProducts;
export const VEHICLE_TYPES = vehicleTypes;
