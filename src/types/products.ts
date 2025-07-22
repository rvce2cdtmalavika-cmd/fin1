
export interface DairyProduct {
  id: string;
  name: string;
  category: 'milk' | 'fermented' | 'cheese' | 'butter' | 'frozen';
  temperatureRange: {
    min: number; // °C
    max: number; // °C
    optimal: number; // °C
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
    perHourAtAmbient: number; // percentage
    perHourRefrigerated: number; // percentage
  };
  nutritionalInfo?: {
    fatContent?: number; // percentage
    proteinContent?: number; // percentage
    lactoseContent?: number; // percentage
  };
  packagingRequirements: string[];
  transportRequirements: string[];
}

export interface WeatherConditions {
  temperature: number; // °C
  humidity: number; // percentage
  precipitation: number; // mm/hour
  windSpeed: number; // km/h
  uvIndex: number;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
}

export interface VehicleType {
  id: string;
  name: string;
  type: 'refrigerated' | 'insulated' | 'ambient';
  capacity: number; // liters
  temperatureControl: {
    canMaintain: boolean;
    range?: { min: number; max: number };
  };
  maxTripDuration: number; // hours
  fuelEfficiency: number; // km/liter
  costPerKm: number;
  multiDayCapable: boolean;
  suitableProducts: string[]; // product categories
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'farm' | 'collection_center' | 'processing_plant' | 'distributor' | 'retail';
  location: {
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  };
  capacity: {
    storage: number; // liters
    processing?: number; // liters per hour
    refrigerated?: number; // liters
  };
  operatingHours: {
    open: string; // HH:mm
    close: string; // HH:mm
    peakHours?: string[]; // ["06:00-09:00", "17:00-20:00"]
  };
  supportedProducts: string[];
  temperatureCapabilities: {
    ambient: boolean;
    refrigerated: boolean;
    frozen: boolean;
  };
  contact?: {
    person?: string;
    phone?: string;
    email?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  isVisible?: boolean; // Add this property for node visibility
}
