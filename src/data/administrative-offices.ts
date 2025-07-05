import layerAData from './new-layers/layer-a.json';
import layerBData from './new-layers/layer-b.json';
import layerCData from './new-layers/layer-c.json';

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

// Helper function to calculate radius based on type for Layer A
function calculateLayerARadius(type: 'urban' | 'suburban', radiusType: 'reception' | 'management'): number {
  if (radiusType === 'reception') {
    return type === 'urban' ? 2.5 : 5; // Urban: 2-3km (using 2.5km as default), Suburban: 5km
  } else { // management
    return type === 'urban' ? 5 : 10; // Urban: 5km, Suburban: 10km
  }
}

// Helper function to calculate radius based on type (for backward compatibility, though Layer B no longer uses type)
function calculateRadiusByType(type?: 'urban' | 'suburban', defaultRadius: number = 5): number {
  if (type === 'urban') return 3; // Urban areas: 3km
  if (type === 'suburban') return 8; // Mountainous/suburban areas: 8km
  return defaultRadius; // Default: 5km
}

// Layer A: Chi nhánh (Branches) - each point has 2 circles: management and reception with type-based radius
export const layerAOffices: AdministrativeOffice[] = layerAData
  .filter(office => office.name && office.location && office.location.lat && office.location.lng)
  .map((office, index) => {
    const officeType = (office.type as 'urban' | 'suburban') || 'urban';
    return {
      id: `layer-a-${index}`,
      name: office.name,
      location: office.location,
      address: office.address,
      region: office.region || 'Đà Nẵng',
      layer: 'A' as const,
      radius: calculateLayerARadius(officeType, 'reception'), // Reception radius based on type
      managementRadius: calculateLayerARadius(officeType, 'management'), // Management radius based on type
      receptionRadius: calculateLayerARadius(officeType, 'reception'), // Reception radius based on type
      procedures_2024: office.procedures_2024,
      procedures_6months_2025: office.procedures_6months_2025,
      type: officeType,
    };
  });

// Layer B: Điểm tiếp nhận (Reception Points) - new commune/ward offices (no type, fixed default radius)
export const layerBOffices: AdministrativeOffice[] = layerBData
  .filter(office => office.location && office.location.latitude && office.location.longitude && office.new_commune_ward)
  .map((office, index) => ({
    id: `layer-b-${index}`,
    name: office.new_commune_ward,
    location: {
      lat: office.location.latitude,
      lng: office.location.longitude,
    },
    address: office.location.address,
    region: 'Đà Nẵng',
    layer: 'B' as const,
    radius: 5, // Fixed default radius since Layer B no longer has type-based radius
    phone: office.location.phone,
    old_commune_ward: office.old_commune_ward,
    is_commune: office.is_commune,
    type: undefined, // Layer B no longer has type classification
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
    name: 'Các Chi Nhánh Hành Chính Cấp Quận/Huyện Cũ',
    description: 'Chi nhánh hành chính cấp quận/huyện',
    radius: 2.5, // Reception radius (urban default)
    managementRadius: 5, // Management radius (urban default)
    color: '#DC2626', // Red
    fillColor: '#FEE2E2',
    strokeColor: '#DC2626',
    count: layerAOffices.length,
  },
  B: {
    name: 'Các Trung Tâm Hành Chính Cấp Xã/Phường Mới',
    description: 'Trung tâm hành chính cấp xã/phường mới',
    radius: 5, // Fixed default radius
    color: '#2563EB', // Blue
    fillColor: '#DBEAFE',
    strokeColor: '#2563EB',
    count: layerBOffices.length,
  },
  C: {
    name: 'Các Điểm Tiếp Nhận Do Bưu Điện Quản Lý',
    description: 'Điểm tiếp nhận do bưu điện quản lý',
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
