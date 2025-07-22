export interface DairyProduct {
  id: string;
  name: string;
  category: 'milk' | 'fermented' | 'cheese' | 'butter' | 'frozen';
  temperatureRange: {
    min: number;
    max: number;
    optimal: number;
  };
  shelfLifeHours: number;
  spoilageRatePerHour: number;
  temperatureSensitivity: 'low' | 'medium' | 'high';
  qualityFactors: {
    temperatureSensitivity: 'low' | 'medium' | 'high';
    lightSensitivity: boolean;
    oxygenSensitivity: boolean;
  };
  spoilageRate: {
    perHourAtAmbient: number;
    perHourRefrigerated: number;
  };
}

export const dairyProducts: DairyProduct[] = [
  {
    id: 'whole-milk',
    name: 'Whole Milk',
    category: 'milk',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLifeHours: 168, // 7 days
    spoilageRatePerHour: 0.5,
    temperatureSensitivity: 'high',
    qualityFactors: {
      temperatureSensitivity: 'high',
      lightSensitivity: true,
      oxygenSensitivity: false
    },
    spoilageRate: {
      perHourAtAmbient: 2.0,
      perHourRefrigerated: 0.1
    }
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    category: 'fermented',
    temperatureRange: { min: 0, max: 4, optimal: 2 },
    shelfLifeHours: 336, // 14 days
    spoilageRatePerHour: 0.3,
    temperatureSensitivity: 'medium',
    qualityFactors: {
      temperatureSensitivity: 'medium',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 1.5,
      perHourRefrigerated: 0.05
    }
  },
  {
    id: 'cheese',
    name: 'Cheese',
    category: 'cheese',
    temperatureRange: { min: 2, max: 8, optimal: 4 },
    shelfLifeHours: 720, // 30 days
    spoilageRatePerHour: 0.1,
    temperatureSensitivity: 'low',
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: false,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 0.8,
      perHourRefrigerated: 0.02
    }
  },
  {
    id: 'butter',
    name: 'Butter',
    category: 'butter',
    temperatureRange: { min: 0, max: 6, optimal: 3 },
    shelfLifeHours: 1440, // 60 days
    spoilageRatePerHour: 0.05,
    temperatureSensitivity: 'low',
    qualityFactors: {
      temperatureSensitivity: 'low',
      lightSensitivity: true,
      oxygenSensitivity: true
    },
    spoilageRate: {
      perHourAtAmbient: 0.5,
      perHourRefrigerated: 0.01
    }
  }
];

// Keep the existing DAIRY_PRODUCTS export for backward compatibility
export const DAIRY_PRODUCTS = dairyProducts;
