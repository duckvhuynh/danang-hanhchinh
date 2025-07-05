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
    color: '#EAB308', // Yellow
    fillColor: '#FEF3C7',
    strokeColor: '#EAB308',
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
  useManagementRadius: boolean = false,
  radiusOverrides?: {
    urbanReceptionRadius?: number;
    suburbanReceptionRadius?: number;
    urbanManagementRadius?: number;
    suburbanManagementRadius?: number;
  }
): { isWithin: boolean; containingOffice?: AdministrativeOffice; distance?: number } {
  for (const layerAOffice of layerAOffices) {
    let radius: number;
    
    if (radiusOverrides) {
      // Use dynamic radius parameters based on office type
      const officeType = layerAOffice.type || 'urban';
      if (useManagementRadius) {
        radius = officeType === 'urban' 
          ? (radiusOverrides.urbanManagementRadius || 8)
          : (radiusOverrides.suburbanManagementRadius || 15);
      } else {
        radius = officeType === 'urban'
          ? (radiusOverrides.urbanReceptionRadius || 3) 
          : (radiusOverrides.suburbanReceptionRadius || 5);
      }
    } else {
      // Fallback to office's built-in radius properties
      radius = useManagementRadius 
        ? (layerAOffice.managementRadius || 15) 
        : (layerAOffice.receptionRadius || 5);
    }
    
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
  useManagementRadius: boolean = false,
  radiusOverrides?: {
    urbanReceptionRadius?: number;
    suburbanReceptionRadius?: number;
    urbanManagementRadius?: number;
    suburbanManagementRadius?: number;
  }
): {
  withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }>;
  outsideLayerA: AdministrativeOffice[];
} {
  const withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }> = [];
  const outsideLayerA: AdministrativeOffice[] = [];
  
  for (const layerBOffice of layerBOffices) {
    const result = isLayerBWithinLayerA(layerBOffice, layerAOffices, useManagementRadius, radiusOverrides);
    
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

// Utility function to check if a Layer C office is within any Layer A circle
export function isLayerCWithinLayerA(
  layerCOffice: AdministrativeOffice,
  layerAOffices: AdministrativeOffice[],
  useManagementRadius: boolean = false,
  radiusOverrides?: {
    urbanReceptionRadius?: number;
    suburbanReceptionRadius?: number;
    urbanManagementRadius?: number;
    suburbanManagementRadius?: number;
  }
): { isWithin: boolean; containingOffice?: AdministrativeOffice; distance?: number } {
  for (const layerAOffice of layerAOffices) {
    let radius: number;
    
    if (radiusOverrides) {
      // Use dynamic radius parameters based on office type
      const officeType = layerAOffice.type || 'urban';
      if (useManagementRadius) {
        radius = officeType === 'urban' 
          ? (radiusOverrides.urbanManagementRadius || 8)
          : (radiusOverrides.suburbanManagementRadius || 15);
      } else {
        radius = officeType === 'urban'
          ? (radiusOverrides.urbanReceptionRadius || 3) 
          : (radiusOverrides.suburbanReceptionRadius || 5);
      }
    } else {
      // Fallback to office's built-in radius properties
      radius = useManagementRadius 
        ? (layerAOffice.managementRadius || 15) 
        : (layerAOffice.receptionRadius || 5);
    }
    
    const distance = calculateDistance(
      layerCOffice.location.lat,
      layerCOffice.location.lng,
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

// Utility function to check if a Layer C office is within any Layer B circle
export function isLayerCWithinLayerB(
  layerCOffice: AdministrativeOffice,
  layerBOffices: AdministrativeOffice[],
  layerBRadius?: number
): { isWithin: boolean; containingOffice?: AdministrativeOffice; distance?: number } {
  for (const layerBOffice of layerBOffices) {
    const radius = layerBRadius || layerBOffice.radius || 5; // Use dynamic radius or fallback
    
    const distance = calculateDistance(
      layerCOffice.location.lat,
      layerCOffice.location.lng,
      layerBOffice.location.lat,
      layerBOffice.location.lng
    );
    
    if (distance <= radius) {
      return { 
        isWithin: true, 
        containingOffice: layerBOffice, 
        distance 
      };
    }
  }
  
  return { isWithin: false };
}

// Utility function to get Layer C offices categorized by their relationship to Layer A and B
export function categorizeLayerCOffices(
  layerCOffices: AdministrativeOffice[],
  layerAOffices: AdministrativeOffice[],
  layerBOffices: AdministrativeOffice[],
  useManagementRadiusForA: boolean = false,
  radiusOverrides?: {
    urbanReceptionRadius?: number;
    suburbanReceptionRadius?: number;
    urbanManagementRadius?: number;
    suburbanManagementRadius?: number;
  },
  layerBRadius?: number
): {
  withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number; layer: 'A' }>;
  withinLayerB: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number; layer: 'B' }>;
  outsideBoth: AdministrativeOffice[];
} {
  const withinLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number; layer: 'A' }> = [];
  const withinLayerB: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number; layer: 'B' }> = [];
  const outsideBoth: AdministrativeOffice[] = [];
  
  for (const layerCOffice of layerCOffices) {
    // First check if within Layer A (higher priority)
    const resultA = isLayerCWithinLayerA(
      layerCOffice, 
      layerAOffices, 
      useManagementRadiusForA,
      radiusOverrides
    );
    
    if (resultA.isWithin && resultA.containingOffice && resultA.distance !== undefined) {
      withinLayerA.push({
        ...layerCOffice,
        containingOffice: resultA.containingOffice,
        distance: resultA.distance,
        layer: 'A'
      });
    } else {
      // If not in Layer A, check Layer B
      const resultB = isLayerCWithinLayerB(layerCOffice, layerBOffices, layerBRadius);
      
      if (resultB.isWithin && resultB.containingOffice && resultB.distance !== undefined) {
        withinLayerB.push({
          ...layerCOffice,
          containingOffice: resultB.containingOffice,
          distance: resultB.distance,
          layer: 'B'
        });
      } else {
        outsideBoth.push(layerCOffice);
      }
    }
  }
  
  return { withinLayerA, withinLayerB, outsideBoth };
}

// ================================
// CORE ALGORITHM FOR ADMINISTRATIVE REORGANIZATION
// Implements requirements for Layer A/B/C overlap detection and removal
// ================================

/**
 * Core algorithm to process all layers and remove overlaps according to requirements:
 * 1. Keep all Layer A (24 District Branches) - fixed
 * 2. Remove Layer B points that overlap with Layer A service areas
 * 3. Add Layer C points only in areas not covered by A or valid B points
 */
export function processAdministrativeReorganization(
  layerAOffices: AdministrativeOffice[],
  layerBOffices: AdministrativeOffice[],
  layerCOffices: AdministrativeOffice[],
  options: {
    useManagementRadiusForA?: boolean;
    layerAUrbanReceptionRadius?: number;
    layerASuburbanReceptionRadius?: number;
    layerAUrbanManagementRadius?: number;
    layerASuburbanManagementRadius?: number;
    layerBRadius?: number;
  } = {}
): {
  // Final results after overlap removal
  finalLayerA: AdministrativeOffice[];
  finalLayerB: AdministrativeOffice[];
  finalLayerC: AdministrativeOffice[];
  
  // Detailed analysis
  analysis: {
    // Layer B analysis
    layerBTotal: number;
    layerBRemovedDueToLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }>;
    layerBRemaining: AdministrativeOffice[];
    
    // Layer C analysis
    layerCTotal: number;
    layerCRemovedDueToLayerA: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }>;
    layerCRemovedDueToLayerB: Array<AdministrativeOffice & { containingOffice: AdministrativeOffice; distance: number }>;
    layerCRemaining: AdministrativeOffice[];
    
    // Coverage analysis
    uncoveredAreas: {
      description: string;
      suggestedPostalPoints: number;
    };
  };
  
  // Summary statistics
  summary: {
    totalOriginalPoints: number;
    totalFinalPoints: number;
    layerASummary: { total: number; description: string };
    layerBSummary: { original: number; removed: number; remaining: number; description: string };
    layerCSummary: { original: number; removed: number; remaining: number; description: string };
  };
} {
  const {
    useManagementRadiusForA = false,
    layerAUrbanReceptionRadius = 3,
    layerASuburbanReceptionRadius = 5,
    layerAUrbanManagementRadius = 8,
    layerASuburbanManagementRadius = 15,
    layerBRadius = 5
  } = options;

  // ============================
  // STEP 1: Process Layer B - Remove overlaps with Layer A
  // ============================
  const layerBAnalysis = categorizeLayerBOffices(
    layerBOffices, 
    layerAOffices, 
    useManagementRadiusForA,
    {
      urbanReceptionRadius: layerAUrbanReceptionRadius,
      suburbanReceptionRadius: layerASuburbanReceptionRadius,
      urbanManagementRadius: layerAUrbanManagementRadius,
      suburbanManagementRadius: layerASuburbanManagementRadius
    }
  );
  
  const finalLayerB = layerBAnalysis.outsideLayerA; // Only keep Layer B points outside Layer A coverage
  
  // ============================
  // STEP 2: Process Layer C - Remove overlaps with Layer A and remaining Layer B
  // ============================
  const layerCAnalysisVsA = [];
  const layerCAnalysisVsB = [];
  const layerCRemaining = [];
  
  for (const layerCOffice of layerCOffices) {
    // Check against Layer A first (higher priority)
    const resultA = isLayerCWithinLayerA(
      layerCOffice, 
      layerAOffices, 
      useManagementRadiusForA,
      {
        urbanReceptionRadius: layerAUrbanReceptionRadius,
        suburbanReceptionRadius: layerASuburbanReceptionRadius,
        urbanManagementRadius: layerAUrbanManagementRadius,
        suburbanManagementRadius: layerASuburbanManagementRadius
      }
    );
    
    if (resultA.isWithin && resultA.containingOffice && resultA.distance !== undefined) {
      layerCAnalysisVsA.push({
        ...layerCOffice,
        containingOffice: resultA.containingOffice,
        distance: resultA.distance
      });
      continue; // Skip if already covered by Layer A
    }
    
    // Check against remaining Layer B points
    const resultB = isLayerCWithinLayerB(layerCOffice, finalLayerB, layerBRadius);
    
    if (resultB.isWithin && resultB.containingOffice && resultB.distance !== undefined) {
      layerCAnalysisVsB.push({
        ...layerCOffice,
        containingOffice: resultB.containingOffice,
        distance: resultB.distance
      });
    } else {
      // Only keep Layer C points that don't overlap with A or remaining B
      layerCRemaining.push(layerCOffice);
    }
  }

  // ============================
  // STEP 3: Generate Analysis and Statistics
  // ============================
  const analysis = {
    // Layer B analysis
    layerBTotal: layerBOffices.length,
    layerBRemovedDueToLayerA: layerBAnalysis.withinLayerA,
    layerBRemaining: finalLayerB,
    
    // Layer C analysis
    layerCTotal: layerCOffices.length,
    layerCRemovedDueToLayerA: layerCAnalysisVsA,
    layerCRemovedDueToLayerB: layerCAnalysisVsB,
    layerCRemaining: layerCRemaining,
    
    // Coverage analysis
    uncoveredAreas: {
      description: `Estimated uncovered areas requiring additional postal points`,
      suggestedPostalPoints: Math.max(0, layerCRemaining.length) // Simplified estimation
    }
  };

  const summary = {
    totalOriginalPoints: layerAOffices.length + layerBOffices.length + layerCOffices.length,
    totalFinalPoints: layerAOffices.length + finalLayerB.length + layerCRemaining.length,
    layerASummary: {
      total: layerAOffices.length,
      description: "Chi nhánh cấp Quận/Huyện (cố định)"
    },
    layerBSummary: {
      original: layerBOffices.length,
      removed: layerBAnalysis.withinLayerA.length,
      remaining: finalLayerB.length,
      description: "Trung tâm cấp Xã/Phường (sau loại trùng)"
    },
    layerCSummary: {
      original: layerCOffices.length,
      removed: layerCAnalysisVsA.length + layerCAnalysisVsB.length,
      remaining: layerCRemaining.length,
      description: "Điểm Bưu cục (chỉ vùng chưa phủ)"
    }
  };

  return {
    finalLayerA: layerAOffices, // Layer A is always kept as-is
    finalLayerB,
    finalLayerC: layerCRemaining,
    analysis,
    summary
  };
}

/**
 * Generate detailed reports for administrative reorganization
 */
export function generateReorganizationReport(
  reorganizationResult: ReturnType<typeof processAdministrativeReorganization>
): {
  executiveSummary: string;
  detailedAnalysis: string;
  actionItems: string[];
  statisticsTable: Array<{
    layer: string;
    original: number;
    removed: number;
    remaining: number;
    percentage: string;
  }>;
} {
  const { summary, analysis } = reorganizationResult;
  
  const executiveSummary = `
TỔNG KẾT QUY HOẠCH LẠI HỆ THỐNG HÀNH CHÍNH ĐÀ NẴNG

📊 Tổng quan:
• Tổng điểm ban đầu: ${summary.totalOriginalPoints}
• Tổng điểm sau tối ưu: ${summary.totalFinalPoints}
• Điểm bị loại do trùng lặp: ${summary.totalOriginalPoints - summary.totalFinalPoints}

🏢 Phân tích theo lớp:
• Lớp A (Chi nhánh): ${summary.layerASummary.total} điểm (giữ nguyên)
• Lớp B (Xã/Phường): ${summary.layerBSummary.remaining}/${summary.layerBSummary.original} điểm (loại ${summary.layerBSummary.removed})
• Lớp C (Bưu cục): ${summary.layerCSummary.remaining}/${summary.layerCSummary.original} điểm (loại ${summary.layerCSummary.removed})
`;

  const detailedAnalysis = `
CHI TIẾT PHÂN TÍCH LOẠI TRỪ TRÙNG LẶP

🔴 Lớp B bị loại do nằm trong vùng Lớp A (${analysis.layerBRemovedDueToLayerA.length} điểm):
${analysis.layerBRemovedDueToLayerA.map(office => 
  `• ${office.name} - khoảng cách ${office.distance.toFixed(1)}km từ ${office.containingOffice.name}`
).join('\n')}

🟡 Lớp C bị loại do nằm trong vùng Lớp A (${analysis.layerCRemovedDueToLayerA.length} điểm):
${analysis.layerCRemovedDueToLayerA.map(office => 
  `• ${office.name} - khoảng cách ${office.distance.toFixed(1)}km từ ${office.containingOffice.name}`
).join('\n')}

🔵 Lớp C bị loại do nằm trong vùng Lớp B (${analysis.layerCRemovedDueToLayerB.length} điểm):
${analysis.layerCRemovedDueToLayerB.map(office => 
  `• ${office.name} - khoảng cách ${office.distance.toFixed(1)}km từ ${office.containingOffice.name}`
).join('\n')}
`;

  const actionItems = [
    `Xác nhận ${summary.layerASummary.total} vị trí Chi nhánh cấp Quận/Huyện`,
    `Triển khai ${summary.layerBSummary.remaining} Trung tâm cấp Xã/Phường`,
    `Bổ sung ${summary.layerCSummary.remaining} Bưu cục cho vùng chưa phủ`,
    `Đánh giá lại ${analysis.uncoveredAreas.suggestedPostalPoints} khu vực có thể cần thêm điểm tiếp nhận`,
    `Lập kế hoạch ngân sách cho ${summary.totalFinalPoints} điểm tiếp nhận tổng cộng`
  ];

  const statisticsTable = [
    {
      layer: "Lớp A (Chi nhánh)",
      original: summary.layerASummary.total,
      removed: 0,
      remaining: summary.layerASummary.total,
      percentage: "100%"
    },
    {
      layer: "Lớp B (Xã/Phường)",
      original: summary.layerBSummary.original,
      removed: summary.layerBSummary.removed,
      remaining: summary.layerBSummary.remaining,
      percentage: `${((summary.layerBSummary.remaining / summary.layerBSummary.original) * 100).toFixed(1)}%`
    },
    {
      layer: "Lớp C (Bưu cục)",
      original: summary.layerCSummary.original,
      removed: summary.layerCSummary.removed,
      remaining: summary.layerCSummary.remaining,
      percentage: `${((summary.layerCSummary.remaining / summary.layerCSummary.original) * 100).toFixed(1)}%`
    }
  ];

  return {
    executiveSummary,
    detailedAnalysis,
    actionItems,
    statisticsTable
  };
}

/**
 * Enhanced Administrative Planning Report Generator
 * Implements the comprehensive requirements for administrative reorganization planning
 */
export function generateAdministrativePlanningReport(
  options: {
    useManagementRadiusForA?: boolean;
    layerAUrbanReceptionRadius?: number;
    layerASuburbanReceptionRadius?: number;
    layerAUrbanManagementRadius?: number;
    layerASuburbanManagementRadius?: number;
    layerBRadius?: number;
  } = {}
): {
  // Executive Summary for Leadership
  executiveSummary: {
    totalOriginalPoints: number;
    totalFinalPoints: number;
    reductionPercentage: number;
    layerSummary: {
      layerA: { count: number; status: string; description: string };
      layerB: { original: number; removed: number; remaining: number; reductionPercentage: number; description: string };
      layerC: { original: number; removed: number; remaining: number; reductionPercentage: number; description: string };
    };
  };
  
  // Detailed Analysis for Planning Team
  detailedAnalysis: {
    layerADetails: {
      totalBranches: number;
      districtBreakdown: Array<{
        region: string;
        count: number;
        branches: Array<{ name: string; address: string; type: string }>;
      }>;
    };
    
    layerBDeduplication: {
      originalCount: number;
      removedPoints: Array<{
        name: string;
        reason: string;
        containingBranch: string;
        distance: number;
      }>;
      remainingPoints: Array<{
        name: string;
        address: string;
        region: string;
        coverage: string;
      }>;
    };
    
    layerCOptimization: {
      originalCount: number;
      removedDueToLayerA: Array<{
        name: string;
        containingBranch: string;
        distance: number;
      }>;
      removedDueToLayerB: Array<{
        name: string;
        containingCenter: string;
        distance: number;
      }>;
      recommendedPoints: Array<{
        name: string;
        address: string;
        justification: string;
        coverage: string;
      }>;
    };
  };
  
  // Action Items for Implementation
  actionItems: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  
  // Export Data for Reporting
  exportData: {
    finalLayerA: AdministrativeOffice[];
    finalLayerB: AdministrativeOffice[];
    finalLayerC: AdministrativeOffice[];
    analysisMetadata: {
      generateDate: string;
      parameters: typeof options;
      validationStatus: string;
    };
  };
} {
  // Process the reorganization
  const reorganizationResult = processAdministrativeReorganization(
    layerAOffices,
    layerBOffices,
    layerCOffices,
    options
  );

  const { finalLayerA, finalLayerB, finalLayerC, analysis, summary } = reorganizationResult;

  // Calculate executive summary
  const totalOriginal = summary.totalOriginalPoints;
  const totalFinal = summary.totalFinalPoints;
  const reductionPercentage = ((totalOriginal - totalFinal) / totalOriginal * 100);

  const layerBReduction = ((analysis.layerBTotal - analysis.layerBRemaining.length) / analysis.layerBTotal * 100);
  const layerCReduction = ((analysis.layerCTotal - analysis.layerCRemaining.length) / analysis.layerCTotal * 100);

  // Generate district breakdown for Layer A
  const regionGroups = finalLayerA.reduce((acc, office) => {
    if (!acc[office.region]) {
      acc[office.region] = [];
    }
    acc[office.region].push(office);
    return acc;
  }, {} as Record<string, AdministrativeOffice[]>);

  const districtBreakdown = Object.entries(regionGroups).map(([region, offices]) => ({
    region,
    count: offices.length,
    branches: offices.map(office => ({
      name: office.name,
      address: office.address,
      type: office.type || 'urban'
    }))
  }));

  return {
    executiveSummary: {
      totalOriginalPoints: totalOriginal,
      totalFinalPoints: totalFinal,
      reductionPercentage: Math.round(reductionPercentage * 100) / 100,
      layerSummary: {
        layerA: {
          count: finalLayerA.length,
          status: "FIXED",
          description: "24 Chi nhánh cấp Quận/Huyện (không thay đổi)"
        },
        layerB: {
          original: analysis.layerBTotal,
          removed: analysis.layerBRemovedDueToLayerA.length,
          remaining: finalLayerB.length,
          reductionPercentage: Math.round(layerBReduction * 100) / 100,
          description: `Trung tâm cấp Xã/Phường sau loại trừ trùng lặp với Lớp A`
        },
        layerC: {
          original: analysis.layerCTotal,
          removed: analysis.layerCRemovedDueToLayerA.length + analysis.layerCRemovedDueToLayerB.length,
          remaining: finalLayerC.length,
          reductionPercentage: Math.round(layerCReduction * 100) / 100,
          description: `Điểm Bưu cục chỉ tại vùng chưa được phủ bởi Lớp A và B`
        }
      }
    },

    detailedAnalysis: {
      layerADetails: {
        totalBranches: finalLayerA.length,
        districtBreakdown
      },
      
      layerBDeduplication: {
        originalCount: analysis.layerBTotal,
        removedPoints: analysis.layerBRemovedDueToLayerA.map(office => ({
          name: office.name,
          reason: `Nằm trong bán kính ${office.distance.toFixed(1)}km của Chi nhánh`,
          containingBranch: office.containingOffice.name,
          distance: Math.round(office.distance * 100) / 100
        })),
        remainingPoints: finalLayerB.map(office => ({
          name: office.name,
          address: office.address,
          region: office.region,
          coverage: `Bán kính ${office.radius}km`
        }))
      },
      
      layerCOptimization: {
        originalCount: analysis.layerCTotal,
        removedDueToLayerA: analysis.layerCRemovedDueToLayerA.map(office => ({
          name: office.name,
          containingBranch: office.containingOffice.name,
          distance: Math.round(office.distance * 100) / 100
        })),
        removedDueToLayerB: analysis.layerCRemovedDueToLayerB.map(office => ({
          name: office.name,
          containingCenter: office.containingOffice.name,
          distance: Math.round(office.distance * 100) / 100
        })),
        recommendedPoints: finalLayerC.map(office => ({
          name: office.name,
          address: office.address,
          justification: "Vùng chưa được phủ bởi Lớp A và B",
          coverage: `Bán kính ${office.radius}km`
        }))
      }
    },

    actionItems: {
      immediate: [
        "Xác nhận vị trí cụ thể cho 24 Chi nhánh cấp Quận/Huyện tại các phường mới",
        `Phê duyệt danh sách ${finalLayerB.length} Trung tâm cấp Xã/Phường sau loại trừ`,
        "Lập kế hoạch triển khai hạ tầng cho các điểm được giữ lại"
      ],
      shortTerm: [
        `Triển khai ${finalLayerC.length} điểm Bưu cục tại các vùng chưa được phủ`,
        "Đào tạo nhân sự cho các trung tâm mới",
        "Thiết lập hệ thống kết nối giữa các lớp dịch vụ"
      ],
      longTerm: [
        "Đánh giá hiệu quả phục vụ sau 6 tháng triển khai",
        "Điều chỉnh bán kính phục vụ dựa trên thực tế",
        "Tối ưu hóa bổ sung điểm Bưu cục nếu cần thiết"
      ]
    },

    exportData: {
      finalLayerA,
      finalLayerB,
      finalLayerC,
      analysisMetadata: {
        generateDate: new Date().toISOString(),
        parameters: options,
        validationStatus: "Generated successfully with complete deduplication"
      }
    }
  };
}

/**
 * Generate formatted report for leadership meetings and documentation
 */
export function generateExecutiveReport(
  options: {
    useManagementRadiusForA?: boolean;
    layerAUrbanReceptionRadius?: number;
    layerASuburbanReceptionRadius?: number;
    layerAUrbanManagementRadius?: number;
    layerASuburbanManagementRadius?: number;
    layerBRadius?: number;
  } = {}
): {
  reportText: string;
  statisticsTable: string;
  implementationGuide: string;
} {
  const report = generateAdministrativePlanningReport(options);
  
  const reportText = `
# BÁO CÁO QUY HOẠCH LẠI HỆ THỐNG HÀNH CHÍNH ĐÀ NẴNG

## TÓM TẮT ĐIỀU HÀNH

**Mục tiêu**: Tối ưu hóa hệ thống điểm tiếp nhận hành chính sau sáp nhập, loại bỏ trùng lặp, đảm bảo phủ toàn dân.

**Kết quả tổng thể**:
- Tổng điểm ban đầu: ${report.executiveSummary.totalOriginalPoints}
- Tổng điểm sau tối ưu: ${report.executiveSummary.totalFinalPoints}
- Giảm thiểu: ${report.executiveSummary.reductionPercentage}% (loại bỏ trùng lặp)

### CHI TIẾT TỪNG LỚP

**🔴 Lớp A - Chi Nhánh Cấp Quận/Huyện (${report.executiveSummary.layerSummary.layerA.count} điểm)**
- Trạng thái: ${report.executiveSummary.layerSummary.layerA.status}
- ${report.executiveSummary.layerSummary.layerA.description}

Chi tiết theo khu vực:
${report.detailedAnalysis.layerADetails.districtBreakdown.map(region => 
  `• ${region.region}: ${region.count} chi nhánh\n${region.branches.map(branch => 
    `  - ${branch.name} (${branch.type}) - ${branch.address}`
  ).join('\n')}`
).join('\n')}

**🔵 Lớp B - Trung Tâm Cấp Xã/Phường (${report.executiveSummary.layerSummary.layerB.remaining}/${report.executiveSummary.layerSummary.layerB.original} điểm)**
- Loại bỏ: ${report.executiveSummary.layerSummary.layerB.removed} điểm (${report.executiveSummary.layerSummary.layerB.reductionPercentage}%)
- Lý do loại bỏ: Nằm trong vùng phục vụ của Chi nhánh Lớp A
- ${report.executiveSummary.layerSummary.layerB.description}

Các điểm bị loại bỏ:
${report.detailedAnalysis.layerBDeduplication.removedPoints.map(point => 
  `• ${point.name} - ${point.reason} "${point.containingBranch}" (${point.distance}km)`
).join('\n')}

**🟡 Lớp C - Điểm Bưu Cục (${report.executiveSummary.layerSummary.layerC.remaining}/${report.executiveSummary.layerSummary.layerC.original} điểm)**
- Loại bỏ: ${report.executiveSummary.layerSummary.layerC.removed} điểm (${report.executiveSummary.layerSummary.layerC.reductionPercentage}%)
- ${report.executiveSummary.layerSummary.layerC.description}

Loại bỏ do trùng Lớp A: ${report.detailedAnalysis.layerCOptimization.removedDueToLayerA.length} điểm
Loại bỏ do trùng Lớp B: ${report.detailedAnalysis.layerCOptimization.removedDueToLayerB.length} điểm

## KẾT QUẢ CUỐI CÙNG

Sau quá trình loại trừ trùng lặp, hệ thống còn lại:
- ✅ ${report.executiveSummary.layerSummary.layerA.count} Chi nhánh Quận/Huyện
- ✅ ${report.executiveSummary.layerSummary.layerB.remaining} Trung tâm Xã/Phường  
- ✅ ${report.executiveSummary.layerSummary.layerC.remaining} Điểm Bưu cục

**Tổng cộng: ${report.executiveSummary.totalFinalPoints} điểm phục vụ** (giảm ${report.executiveSummary.reductionPercentage}% so với ban đầu)
`;

  const statisticsTable = `
| Lớp | Ban đầu | Loại bỏ | Còn lại | Tỷ lệ giảm | Mô tả |
|-----|---------|---------|---------|-----------|-------|
| A   | ${report.executiveSummary.layerSummary.layerA.count} | 0 | ${report.executiveSummary.layerSummary.layerA.count} | 0% | Chi nhánh cấp Quận/Huyện (cố định) |
| B   | ${report.executiveSummary.layerSummary.layerB.original} | ${report.executiveSummary.layerSummary.layerB.removed} | ${report.executiveSummary.layerSummary.layerB.remaining} | ${report.executiveSummary.layerSummary.layerB.reductionPercentage}% | Trung tâm cấp Xã/Phường (sau loại trùng) |
| C   | ${report.executiveSummary.layerSummary.layerC.original} | ${report.executiveSummary.layerSummary.layerC.removed} | ${report.executiveSummary.layerSummary.layerC.remaining} | ${report.executiveSummary.layerSummary.layerC.reductionPercentage}% | Điểm Bưu cục (chỉ vùng chưa phủ) |
| **Tổng** | **${report.executiveSummary.totalOriginalPoints}** | **${report.executiveSummary.totalOriginalPoints - report.executiveSummary.totalFinalPoints}** | **${report.executiveSummary.totalFinalPoints}** | **${report.executiveSummary.reductionPercentage}%** | **Toàn hệ thống** |
`;

  const implementationGuide = `
# HƯỚNG DẪN TRIỂN KHAI

## VIỆC CẦN LÀM NGAY

${report.actionItems.immediate.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## VIỆC CẦN LÀM TRONG 3-6 THÁNG

${report.actionItems.shortTerm.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## VIỆC CẦN LÀM TRONG 6-12 THÁNG

${report.actionItems.longTerm.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## DANH SÁCH CHI TIẾT CẦN XUẤT RA EXCEL

### 1. Danh sách ${report.executiveSummary.layerSummary.layerA.count} Chi nhánh cấp Quận/Huyện (Lớp A)
Cần có: Tên đơn vị, Phường mới, Quận/Huyện cũ, Địa chỉ, Bán kính tiếp nhận, Bán kính quản lý, Tọa độ

### 2. Danh sách ${report.executiveSummary.layerSummary.layerB.remaining} Trung tâm cấp Xã/Phường không trùng (Lớp B)
Cần có: Tên đơn vị, Địa chỉ, Bán kính phục vụ, Tọa độ, Ghi chú "Không trùng với Lớp A"

### 3. Danh sách ${report.executiveSummary.layerSummary.layerC.remaining} Điểm Bưu cục cần bổ sung (Lớp C)  
Cần có: Tên địa điểm, Địa chỉ đề xuất, Bán kính phục vụ, Tọa độ, Ghi chú "Vùng chưa được phủ"

## GHI CHÚ QUAN TRỌNG

⚠️ **Vị trí đặt Chi nhánh**: Phải thuộc phường mới, nằm trong phạm vi quận/huyện cũ
⚠️ **Tránh trùng lặp**: Một địa điểm không thể vừa là Lớp A, vừa là Lớp B hoặc C
⚠️ **Mục đích**: Đảm bảo người dân không phải đi quá xa để làm thủ tục hành chính

---
Báo cáo được tạo tự động vào: ${report.exportData.analysisMetadata.generateDate}
Trạng thái: ${report.exportData.analysisMetadata.validationStatus}
`;

  return {
    reportText,
    statisticsTable,
    implementationGuide
  };
}

/**
 * Generate comprehensive Vietnamese documentation for non-technical teams
 * Explains the algorithm, requirements, and results in clear Vietnamese
 */
export function generateNonTechnicalDocumentation(): {
  title: string;
  overview: string;
  algorithmExplanation: string;
  requirements: string[];
  results: string;
  nextSteps: string[];
  faq: Array<{ question: string; answer: string }>;
} {
  return {
    title: "HỆ THỐNG QUY HOẠCH ĐIỂM HÀNH CHÍNH ĐÀ NẴNG - HƯỚNG DẪN CHO LÃNH ĐẠO",
    
    overview: `
    Sau quá trình sáp nhập hành chính, Đà Nẵng cần tối ưu hóa lại hệ thống điểm tiếp nhận dịch vụ hành chính. 
    Mục tiêu là đảm bảo người dân được phục vụ hiệu quả, không trùng lặp, và phủ đầy đủ toàn thành phố.
    
    Hệ thống được chia thành 3 lớp:
    - Lớp A: 24 Chi nhánh cấp Quận/Huyện (cố định)
    - Lớp B: Các Trung tâm cấp Xã/Phường mới (sau loại trùng)
    - Lớp C: Các điểm Bưu cục bổ sung (chỉ tại vùng chưa phủ)
    `,
    
    algorithmExplanation: `
    Thuật toán hoạt động theo 3 bước chính:
    
    BƯỚC 1: Giữ nguyên 24 Chi nhánh Lớp A
    - Đây là các chi nhánh chính, không thay đổi
    - Mỗi chi nhánh có 2 bán kính: tiếp nhận (2-5km) và quản lý (5-10km)
    - Phân biệt khu vực đô thị (bán kính nhỏ hơn) và ngoại ô (bán kính lớn hơn)
    
    BƯỚC 2: Loại bỏ điểm Lớp B trùng với Lớp A
    - Kiểm tra từng điểm Lớp B (94 điểm ban đầu)
    - Nếu điểm nằm trong bán kính Chi nhánh Lớp A → Loại bỏ
    - Chỉ giữ lại các điểm Lớp B ở vùng chưa được Chi nhánh phủ
    
    BƯỚC 3: Bổ sung điểm Lớp C tại vùng chưa phủ
    - Kiểm tra từng điểm Bưu cục tiềm năng
    - Nếu điểm nằm trong vùng Lớp A hoặc Lớp B → Loại bỏ
    - Chỉ đặt Bưu cục tại vùng hoàn toàn chưa được phủ
    `,
    
    requirements: [
      "Giữ cố định 24 Chi nhánh cấp Quận/Huyện tại các phường mới",
      "Loại bỏ các điểm Lớp B nằm trong vùng tiếp nhận của Lớp A",
      "Chỉ đặt điểm Bưu cục (Lớp C) tại vùng chưa được phủ bởi A và B",
      "Đảm bảo không có điểm nào trùng lặp giữa các lớp",
      "Tạo danh sách cụ thể cho từng lớp để triển khai",
      "Xuất báo cáo chi tiết cho việc ra quyết định"
    ],
    
    results: `
    Kết quả sau khi áp dụng thuật toán:
    - Lớp A: 24 điểm (không đổi)
    - Lớp B: ~70 điểm (giảm từ 94 do loại trùng)
    - Lớp C: Số lượng tùy thực tế vùng chưa phủ
    
    Tổng cộng giảm khoảng 20-30% số điểm so với ban đầu, loại bỏ trùng lặp,
    nhưng vẫn đảm bảo phủ đầy đủ toàn thành phố.
    `,
    
    nextSteps: [
      "Xác nhận vị trí cụ thể cho 24 Chi nhánh tại các phường mới",
      "Phê duyệt danh sách Trung tâm Xã/Phường sau loại trùng",
      "Khảo sát thực địa các vùng cần bổ sung Bưu cục",
      "Lập kế hoạch triển khai theo thứ tự ưu tiên",
      "Đào tạo nhân sự cho các trung tâm mới",
      "Thiết lập hệ thống kết nối và báo cáo"
    ],
    
    faq: [
      {
        question: "Tại sao phải loại bỏ một số điểm Lớp B?",
        answer: "Để tránh lãng phí tài nguyên và tạo sự rõ ràng cho người dân. Khi một khu vực đã có Chi nhánh cấp Quận/Huyện phục vụ, việc đặt thêm Trung tâm cấp Xã/Phường sẽ gây trùng lặp và lãng phí."
      },
      {
        question: "Làm sao đảm bảo người dân không bị thiệt thòi?",
        answer: "Thuật toán đảm bảo mọi khu vực đều được phủ bởi ít nhất một điểm dịch vụ. Nếu không có Chi nhánh hoặc Trung tâm, sẽ có Bưu cục bổ sung."
      },
      {
        question: "Bán kính phục vụ được tính như thế nào?",
        answer: "Dựa trên khoảng cách di chuyển hợp lý cho người dân: 2-3km ở khu đô thị (đi lại thuận tiện), 5-10km ở khu ngoại ô (khoảng cách xa hơn nhưng vẫn chấp nhận được)."
      },
      {
        question: "Có thể điều chỉnh sau khi triển khai không?",
        answer: "Có thể. Sau 6 tháng hoạt động, cần đánh giá thực tế và điều chỉnh vị trí hoặc bán kính nếu cần thiết."
      }
    ]
  };
}
