
import { DairyProduct } from '@/types/products';

// Data sourced from FSSAI (Food Safety and Standards Authority of India), 
// USDA, and dairy industry standards
export const DAIRY_PRODUCTS: DairyProduct[] = [
  {
    id: 'whole-milk',
    name: 'Whole Milk',
    category: 'milk',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLife: { ambient: 4, refrigerated: 168 }, // 7 days refrigerated
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 8.5, // spoils rapidly at room temp
      perHourRefrigerated: 0.02
    },
    nutritionalInfo: {
      fatContent: 3.5,
      proteinContent: 3.2,
      lactoseContent: 4.8
    },
    packagingRequirements: ['opaque', 'sealed'],
    transportRequirements: ['refrigerated', 'minimal_agitation']
  },
  {
    id: 'skim-milk',
    name: 'Skim Milk',
    category: 'milk',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLife: { ambient: 4, refrigerated: 168 },
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 8.0,
      perHourRefrigerated: 0.02
    },
    nutritionalInfo: {
      fatContent: 0.1,
      proteinContent: 3.4,
      lactoseContent: 4.9
    },
    packagingRequirements: ['opaque', 'sealed'],
    transportRequirements: ['refrigerated']
  },
  {
    id: 'curd-yogurt',
    name: 'Curd/Yogurt',
    category: 'fermented',
    temperatureRange: { min: 2, max: 6, optimal: 4 },
    shelfLife: { ambient: 8, refrigerated: 336 }, // 14 days
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 6.0,
      perHourRefrigerated: 0.015
    },
    packagingRequirements: ['sealed', 'moisture_proof'],
    transportRequirements: ['refrigerated', 'stable_temperature']
  },
  {
    id: 'paneer',
    name: 'Paneer',
    category: 'cheese',
    temperatureRange: { min: 2, max: 8, optimal: 4 },
    shelfLife: { ambient: 12, refrigerated: 120 }, // 5 days
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 4.5,
      perHourRefrigerated: 0.05
    },
    packagingRequirements: ['vacuum_sealed', 'moisture_controlled'],
    transportRequirements: ['refrigerated']
  },
  {
    id: 'butter',
    name: 'Butter',
    category: 'butter',
    temperatureRange: { min: 2, max: 10, optimal: 6 },
    shelfLife: { ambient: 24, refrigerated: 720 }, // 30 days
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: true,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 2.0,
      perHourRefrigerated: 0.01
    },
    packagingRequirements: ['light_proof', 'air_tight'],
    transportRequirements: ['refrigerated', 'stable_temperature']
  },
  {
    id: 'cheese-hard',
    name: 'Hard Cheese',
    category: 'cheese',
    temperatureRange: { min: 4, max: 12, optimal: 8 },
    shelfLife: { ambient: 48, refrigerated: 1440 }, // 60 days
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: false,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 1.0,
      perHourRefrigerated: 0.005
    },
    packagingRequirements: ['wax_coating', 'breathable'],
    transportRequirements: ['cool_storage']
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    category: 'frozen',
    temperatureRange: { min: -18, max: -12, optimal: -15 },
    shelfLife: { ambient: 2, refrigerated: 24, frozen: 4320 }, // 6 months frozen
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: false,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 25.0, // melts rapidly
      perHourRefrigerated: 8.0
    },
    packagingRequirements: ['insulated', 'sealed'],
    transportRequirements: ['frozen_transport', 'temperature_monitoring']
  }
];

export const VEHICLE_TYPES = [
  {
    id: 'refrigerated-truck',
    name: 'Refrigerated Truck',
    type: 'refrigerated' as const,
    capacity: 5000,
    temperatureControl: {
      canMaintain: true,
      range: { min: -20, max: 15 }
    },
    maxTripDuration: 72, // 3 days
    fuelEfficiency: 8,
    costPerKm: 25,
    multiDayCapable: true,
    suitableProducts: ['milk', 'fermented', 'cheese', 'butter', 'frozen']
  },
  {
    id: 'insulated-van',
    name: 'Insulated Van',
    type: 'insulated' as const,
    capacity: 2000,
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 8, // single day
    fuelEfficiency: 12,
    costPerKm: 15,
    multiDayCapable: false,
    suitableProducts: ['milk', 'fermented']
  },
  {
    id: 'ambient-truck',
    name: 'Regular Truck',
    type: 'ambient' as const,
    capacity: 8000,
    temperatureControl: {
      canMaintain: false
    },
    maxTripDuration: 24,
    fuelEfficiency: 10,
    costPerKm: 12,
    multiDayCapable: true,
    suitableProducts: ['cheese'] // only non-refrigerated items
  }
];
