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
    name: 'Whole Milk (3.5% Fat)',
    category: 'milk',
    temperatureRange: { min: 1, max: 4, optimal: 3 },
    shelfLife: {
      ambient: 4, // hours at 25°C (FSSAI standards)
      refrigerated: 120, // 5 days at 4°C (pasteurized)
      frozen: 8760 // 1 year frozen (not recommended)
    },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 8.33, // Based on bacterial growth rate (doubles every 1.5h at 30°C)
      perHourRefrigerated: 0.21 // Based on psychrophilic bacteria growth at 4°C
    },
    nutritionalInfo: {
      fatContent: 3.5,
      proteinContent: 3.2,
      lactoseContent: 4.8
    },
    packagingRequirements: ['HDPE/LDPE pouches', 'Tetra Pak', 'Glass bottles'],
    transportRequirements: ['Cold chain 1-4°C', 'Minimal agitation', 'UV protection']
  },
  {
    id: 'skim-milk',
    name: 'Skim Milk (0.1% Fat)',
    category: 'milk',
    temperatureRange: { min: 1, max: 4, optimal: 3 },
    shelfLife: {
      ambient: 4,
      refrigerated: 144, // 6 days (longer than whole milk due to lower fat)
      frozen: 8760
    },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 7.5,
      perHourRefrigerated: 0.18
    },
    nutritionalInfo: {
      fatContent: 0.1,
      proteinContent: 3.4,
      lactoseContent: 4.9
    },
    packagingRequirements: ['HDPE/LDPE pouches', 'Tetra Pak'],
    transportRequirements: ['Cold chain 1-4°C', 'Minimal agitation']
  },
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt',
    category: 'fermented',
    temperatureRange: { min: 1, max: 4, optimal: 2 },
    shelfLife: {
      ambient: 6, // hours due to acidic pH
      refrigerated: 504, // 21 days (longer due to low pH and straining)
      frozen: 2160 // 3 months
    },
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 4.17, // Slower due to acidic environment
      perHourRefrigerated: 0.08
    },
    nutritionalInfo: {
      fatContent: 0.4,
      proteinContent: 10.0,
      lactoseContent: 4.0
    },
    packagingRequirements: ['Polystyrene cups', 'HDPE containers', 'Oxygen barrier'],
    transportRequirements: ['Cold chain 1-4°C', 'Gentle handling', 'Avoid freezing']
  },
  {
    id: 'cheddar-cheese',
    name: 'Cheddar Cheese (Aged 6 months)',
    category: 'cheese',
    temperatureRange: { min: 2, max: 8, optimal: 4 },
    shelfLife: {
      ambient: 8, // hours (hard cheese more stable)
      refrigerated: 1440, // 60 days (aged hard cheese)
      frozen: 4380 // 6 months frozen
    },
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 2.08, // Lower due to low moisture and pH
      perHourRefrigerated: 0.035
    },
    nutritionalInfo: {
      fatContent: 33.0,
      proteinContent: 25.0,
      lactoseContent: 0.1
    },
    packagingRequirements: ['Wax coating', 'Vacuum packaging', 'Breathable film'],
    transportRequirements: ['Cool storage 4-8°C', 'Humidity control 80-85%']
  },
  {
    id: 'paneer',
    name: 'Fresh Paneer',
    category: 'cheese',
    temperatureRange: { min: 1, max: 4, optimal: 2 },
    shelfLife: {
      ambient: 3, // hours (fresh cheese, high moisture)
      refrigerated: 96, // 4 days
      frozen: 720 // 1 month
    },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 12.5, // High due to moisture content
      perHourRefrigerated: 0.52
    },
    nutritionalInfo: {
      fatContent: 20.0,
      proteinContent: 18.0,
      lactoseContent: 2.6
    },
    packagingRequirements: ['Modified atmosphere packaging', 'Vacuum sealed'],
    transportRequirements: ['Strict cold chain 1-4°C', 'Minimal handling']
  },
  {
    id: 'salted-butter',
    name: 'Salted Butter (White Butter)',
    category: 'butter',
    temperatureRange: { min: 1, max: 6, optimal: 4 },
    shelfLife: {
      ambient: 12, // hours (salt preservative effect)
      refrigerated: 2160, // 90 days
      frozen: 8760 // 1 year
    },
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: true,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 1.67, // Salt preservative reduces spoilage
      perHourRefrigerated: 0.023
    },
    nutritionalInfo: {
      fatContent: 80.0,
      proteinContent: 0.9,
      lactoseContent: 0.06
    },
    packagingRequirements: ['Aluminum foil', 'Parchment paper', 'Light-proof'],
    transportRequirements: ['Cool storage 4-6°C', 'Protection from light and air']
  },
  {
    id: 'ice-cream',
    name: 'Premium Ice Cream',
    category: 'frozen',
    temperatureRange: { min: -18, max: -15, optimal: -18 },
    shelfLife: {
      ambient: 0.5, // 30 minutes before melting
      refrigerated: 24, // 1 day (not suitable)
      frozen: 4380 // 6 months at -18°C
    },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 100, // Complete spoilage within 1 hour
      perHourRefrigerated: 25 // Melts and spoils rapidly
    },
    nutritionalInfo: {
      fatContent: 14.0,
      proteinContent: 4.0,
      lactoseContent: 5.9
    },
    packagingRequirements: ['Insulated containers', 'Dry ice packaging'],
    transportRequirements: ['Frozen chain -18°C', 'No temperature fluctuation']
  }
];

export const vehicleTypes = [
  {
    id: 'small-refrigerated-van',
    name: 'Refrigerated Van (Tata Ace Cold)',
    type: 'refrigerated' as const,
    capacity: 750, // liters (realistic for small van)
    temperatureControl: {
      canMaintain: true,
      range: { min: -5, max: 8 }
    },
    maxTripDuration: 12, // hours
    fuelEfficiency: 14, // km/L (Tata Ace specifications)
    costPerKm: 18, // ₹18/km (fuel + maintenance + depreciation)
    multiDayCapable: false,
    suitableProducts: ['milk', 'fermented', 'cheese', 'butter']
  },
  {
    id: 'medium-refrigerated-truck',
    name: 'Refrigerated Truck (Eicher Pro 3015)',
    type: 'refrigerated' as const,
    capacity: 3500, // liters
    temperatureControl: {
      canMaintain: true,
      range: { min: -20, max: 10 }
    },
    maxTripDuration: 18, // hours
    fuelEfficiency: 9, // km/L
    costPerKm: 32, // ₹32/km
    multiDayCapable: true,
    suitableProducts: ['milk', 'fermented', 'cheese', 'butter', 'frozen']
  },
  {
    id: 'large-refrigerated-truck',
    name: 'Large Reefer Truck (Ashok Leyland 2820)',
    type: 'refrigerated' as const,
    capacity: 8000, // liters
    temperatureControl: {
      canMaintain: true,
      range: { min: -25, max: 12 }
    },
    maxTripDuration: 36, // hours (multi-zone delivery)
    fuelEfficiency: 6.5, // km/L
    costPerKm: 45, // ₹45/km
    multiDayCapable: true,
    suitableProducts: ['milk', 'fermented', 'cheese', 'butter', 'frozen']
  },
  {
    id: 'insulated-truck',
    name: 'Insulated Truck (Mahindra Bolero Pickup)',
    type: 'insulated' as const,
    capacity: 1200, // liters
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 6, // hours (before temperature rise)
    fuelEfficiency: 16, // km/L
    costPerKm: 12, // ₹12/km
    multiDayCapable: false,
    suitableProducts: ['cheese', 'butter'] // Less sensitive products only
  },
  {
    id: 'standard-truck',
    name: 'Standard Truck (Tata 407)',
    type: 'ambient' as const,
    capacity: 2500, // liters
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 4, // hours maximum for any dairy
    fuelEfficiency: 12, // km/L
    costPerKm: 8, // ₹8/km
    multiDayCapable: false,
    suitableProducts: ['cheese'] // Only very stable products
  },
  {
    id: 'milk-tanker',
    name: 'Insulated Milk Tanker (Stainless Steel)',
    type: 'insulated' as const,
    capacity: 5000, // liters (bulk liquid transport)
    temperatureControl: {
      canMaintain: false // Relies on thermal mass and insulation
    },
    maxTripDuration: 8, // hours (bulk collection to processing)
    fuelEfficiency: 7, // km/L (heavy vehicle)
    costPerKm: 28, // ₹28/km
    multiDayCapable: false,
    suitableProducts: ['milk'] // Bulk milk only
  }
];

// Keep the existing DAIRY_PRODUCTS export for backward compatibility
export const DAIRY_PRODUCTS = dairyProducts;
export const VEHICLE_TYPES = vehicleTypes;
