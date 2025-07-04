import layerAData from './layers/layer-a.json';
import layerBData from './layers/layer-b.json';
import layerCData from './layers/layer-c.json';

// Define the data structure for administrative offices
export interface AdministrativeOffice {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  region: string;
  procedures_2024?: number;
  procedures_6months_2025?: number;
  layer: 'A' | 'B' | 'C';
  radius: number; // in kilometers - primary radius
  managementRadius?: number; // in kilometers - only for Layer A (15km default)
  receptionRadius?: number; // in kilometers - only for Layer A (5km default)
  phone?: string;
  old_commune_ward?: string;
  is_commune?: boolean;
  type?: 'urban' | 'suburban'; // for radius calculation
  postid?: string; // for Layer C (post offices)
}

// Helper function to calculate radius based on type
function calculateRadiusByType(type?: 'urban' | 'suburban', defaultRadius: number = 5): number {
  if (type === 'urban') return 3; // Urban areas: 3km
  if (type === 'suburban') return 8; // Mountainous/suburban areas: 8km
  return defaultRadius; // Default: 5km
}

// Layer A: Chi nhánh (Branches) - each point has 2 circles: management (15km) and reception (5km)
export const layerAOffices: AdministrativeOffice[] = layerAData.map((office, index) => ({
  id: `layer-a-${index}`,
  name: office.name,
  location: office.location,
  address: office.address,
  region: 'Đà Nẵng',
  layer: 'A',
  radius: 5, // Reception radius (adjustable)
  managementRadius: 15, // Management radius (adjustable)
  receptionRadius: 5, // Reception radius (adjustable)
  phone: office.phone,
  type: office.type as 'urban' | 'suburban',
}));

// Layer B: Điểm tiếp nhận (Reception Points) - new commune/ward offices
export const layerBOffices: AdministrativeOffice[] = layerBData
  .filter(office => office.location && office.location.lat && office.location.lng)
  .map((office, index) => ({
    id: `layer-b-${index}`,
    name: office.name,
    location: office.location,
    address: office.address,
    region: 'Đà Nẵng',
    layer: 'B',
    radius: calculateRadiusByType(office.type as 'urban' | 'suburban'),
    phone: office.phone,
    type: office.type as 'urban' | 'suburban',
  }));

// Layer C: Điểm tăng cường (Reinforcement Points) - post offices
export const layerCOffices: AdministrativeOffice[] = layerCData
  .filter(office => office.location && office.location.lat && office.location.lng)
  .map((office, index) => ({
    id: `layer-c-${index}`,
    name: office.name,
    location: office.location,
    address: office.address,
    region: office.province || 'Đà Nẵng',
    layer: 'C',
    radius: calculateRadiusByType(undefined), // Post offices default to 5km since no type specified
    phone: office.phone || undefined,
    postid: office.postid,
    type: undefined, // Post offices don't have type classification
  }));

// Combined all layers
export const allAdministrativeOffices: AdministrativeOffice[] = [
  ...layerAOffices,
  ...layerBOffices,
  ...layerCOffices,
];

// Layer configurations for UI
export const layerConfigurations = {
  A: {
    name: 'Chi nhánh',
    description: 'Trung tâm hành chính công (Phường)',
    radius: 5, // Reception radius
    managementRadius: 15, // Management radius
    color: '#DC2626', // Red
    fillColor: '#FEE2E2',
    strokeColor: '#DC2626',
    count: layerAOffices.length,
  },
  B: {
    name: 'Điểm tiếp nhận',
    description: 'Trung tâm hành chính công (Xã)',
    radius: 5, // Default radius
    color: '#2563EB', // Blue
    fillColor: '#DBEAFE',
    strokeColor: '#2563EB',
    count: layerBOffices.length,
  },
  C: {
    name: 'Điểm tăng cường',
    description: 'Bưu điện',
    radius: 5, // Default radius
    color: '#059669', // Green
    fillColor: '#D1FAE5',
    strokeColor: '#059669',
    count: layerCOffices.length,
  },
};

// Helper function to get offices by layer
export function getOfficesByLayer(layer: 'A' | 'B' | 'C'): AdministrativeOffice[] {
  switch (layer) {
    case 'A':
      return layerAOffices;
    case 'B':
      return layerBOffices;
    case 'C':
      return layerCOffices;
    default:
      return [];
  }
}

// Helper function to get layer configuration
export function getLayerConfig(layer: 'A' | 'B' | 'C') {
  return layerConfigurations[layer];
}

// Utility function to calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Utility function to check if a Layer B office is within any Layer A circle
export function isLayerBWithinLayerA(
  layerBOffice: AdministrativeOffice,
  layerAOffices: AdministrativeOffice[],
  useManagementRadius: boolean = false
): { isWithin: boolean; containingOffice?: AdministrativeOffice; distance?: number } {
  for (const layerAOffice of layerAOffices) {
    const radius = useManagementRadius 
      ? (layerAOffice.managementRadius || 15) 
      : (layerAOffice.receptionRadius || 5);
    
    const distance = calculateDistance(
      layerBOffice.location.lat,
      layerBOffice.location.lng,
      layerAOffice.location.lat,
      layerAOffice.location.lng
    );
    
    if (distance <= radius) {
      return { 
        isWithin: true, 
        containingOffice: layerAOffice, 
        distance 
      };
    }
  }
  
  return { isWithin: false };
}

// Utility function to get Layer B offices categorized by their relationship to Layer A
export function categorizeLayerBOffices(
  layerBOffices: AdministrativeOffice[],
  layerAOffices: AdministrativeOffice[],
  useManagementRadius: boolean = false
): {
  withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }>;
  outsideLayerA: AdministrativeOffice[];
} {
  const withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }> = [];
  const outsideLayerA: AdministrativeOffice[] = [];
  
  for (const layerBOffice of layerBOffices) {
    const result = isLayerBWithinLayerA(layerBOffice, layerAOffices, useManagementRadius);
    
    if (result.isWithin && result.containingOffice && result.distance !== undefined) {
      withinLayerA.push({
        ...layerBOffice,
        containingOffice: result.containingOffice,
        distance: result.distance
      });
    } else {
      outsideLayerA.push(layerBOffice);
    }
  }
  
  return { withinLayerA, outsideLayerA };
}
