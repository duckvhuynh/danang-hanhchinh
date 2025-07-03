import oldDistrictData from './old-district.json';
import administrativeInfoData from './administrative-information.json';
import oldCommuneWardData from './old-commune-ward.json';

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
  radius: number; // in kilometers
  phone?: string;
  old_commune_ward?: string;
  is_commune?: boolean;
}

// Layer A: 22 administrative service offices (17 old QN districts + 5 DN quận) - 7km radius
export const layerAOffices: AdministrativeOffice[] = oldDistrictData.map((office, index) => ({
  id: `layer-a-${index}`,
  name: office.name,
  location: office.location,
  address: office.address,
  region: office.region,
  procedures_2024: office.procedures_2024,
  procedures_6months_2025: office.procedures_6months_2025,
  layer: 'A',
  radius: 7, // 7km radius as per PRD
}));

// Layer B: 93 centers of new xã (commune/ward centers) - 5km radius
export const layerBOffices: AdministrativeOffice[] = administrativeInfoData.commune_ward_list
  .filter(item => item.location && item.location.latitude && item.location.longitude)
  .map((office, index) => ({
    id: `layer-b-${index}`,
    name: `UBND ${office.is_commune ? 'xã' : 'phường'} ${office.new_commune_ward}`,
    location: {
      lat: office.location.latitude,
      lng: office.location.longitude,
    },
    address: office.location.address,
    region: 'Đà Nẵng',
    layer: 'B',
    radius: 5, // 5km radius as per PRD
    phone: office.location.phone,
    old_commune_ward: office.old_commune_ward,
    is_commune: office.is_commune,
  }));

// Layer C: All former xã (excluding those already in A/B) - 5km radius
export const layerCOffices: AdministrativeOffice[] = oldCommuneWardData
  .filter(office => {
    // Exclude offices that are already in Layer A or B
    const isInLayerA = layerAOffices.some(layerA => 
      layerA.name === office.name || 
      layerA.location.lat === office.location.lat && layerA.location.lng === office.location.lng
    );
    
    const isInLayerB = layerBOffices.some(layerB => 
      Math.abs(layerB.location.lat - office.location.lat) < 0.001 && 
      Math.abs(layerB.location.lng - office.location.lng) < 0.001
    );
    
    return !isInLayerA && !isInLayerB;
  })
  .map((office, index) => ({
    id: `layer-c-${index}`,
    name: office.name,
    location: office.location,
    address: office.address,
    region: office.region,
    procedures_2024: office.procedures_2024,
    procedures_6months_2025: office.procedures_6months_2025,
    layer: 'C',
    radius: 5, // 5km radius as per PRD
    old_commune_ward: office.old_commune_ward,
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
    name: 'Trụ sở UBND cấp huyện',
    description: '22 trụ sở hành chính (17 QN cũ + 5 DN)',
    radius: 7,
    color: '#DC2626', // Red
    fillColor: '#FEE2E2',
    strokeColor: '#DC2626',
    count: layerAOffices.length,
  },
  B: {
    name: 'Trung tâm xã/phường mới',
    description: '93 trung tâm xã/phường sau sáp nhập',
    radius: 5,
    color: '#2563EB', // Blue
    fillColor: '#DBEAFE',
    strokeColor: '#2563EB',
    count: layerBOffices.length,
  },
  C: {
    name: 'Trụ sở xã/phường cũ',
    description: 'Các trụ sở xã/phường trước sáp nhập',
    radius: 5,
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
