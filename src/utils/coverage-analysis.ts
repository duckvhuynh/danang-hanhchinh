import type { AdministrativeOffice } from "../data/administrative-offices";
import type { PolygonData } from "../data/polygon-utils";

export interface CoverageOverlap {
  id: string;
  layers: ('A' | 'B' | 'C')[];
  offices: AdministrativeOffice[];
  overlapCenter: { lat: number; lng: number };
  coveredAreas: string[]; // Names of covered administrative boundaries
  overlapType: 'partial' | 'complete';
}

export interface CoverageAnalysis {
  overlaps: CoverageOverlap[];
  totalCoverage: {
    layerA: string[];
    layerB: string[];
    layerC: string[];
  };
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check if a point is within a circle
export function isPointInCircle(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

// Check if two circles overlap
export function doCirclesOverlap(
  center1: { lat: number; lng: number },
  radius1: number,
  center2: { lat: number; lng: number },
  radius2: number
): boolean {
  const distance = calculateDistance(center1, center2);
  return distance <= (radius1 + radius2);
}

// Calculate overlap area center (approximate)
export function calculateOverlapCenter(
  center1: { lat: number; lng: number },
  center2: { lat: number; lng: number }
): { lat: number; lng: number } {
  return {
    lat: (center1.lat + center2.lat) / 2,
    lng: (center1.lng + center2.lng) / 2
  };
}

// Check which administrative boundaries are covered by an office's service circle
export function getCoveredAreas(
  office: AdministrativeOffice,
  polygons: PolygonData[]
): string[] {
  const coveredAreas: string[] = [];
  
  for (const polygon of polygons) {
    // Check if the polygon center or any vertices are within the service circle
    let isCovered = false;
    
    // Simple approach: check if polygon centroid is within the circle
    if (polygon.polygon && polygon.polygon.length > 0) {
      // Calculate polygon centroid
      const centroid = calculatePolygonCentroid(polygon.polygon);
      if (isPointInCircle(centroid, office.location, office.radius)) {
        isCovered = true;
      }
    }
    
    // Also check if any polygon vertices are within the circle
    if (!isCovered && polygon.polygon) {
      for (const vertex of polygon.polygon) {
        if (isPointInCircle(vertex, office.location, office.radius)) {
          isCovered = true;
          break;
        }
      }
    }
    
    if (isCovered) {
      coveredAreas.push(polygon.ward);
    }
  }
  
  return coveredAreas;
}

// Calculate polygon centroid (simple average of vertices)
function calculatePolygonCentroid(polygon: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (polygon.length === 0) {
    return { lat: 0, lng: 0 };
  }
  
  const sum = polygon.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / polygon.length,
    lng: sum.lng / polygon.length
  };
}

// Analyze coverage and overlaps for all visible offices
export function analyzeCoverage(
  offices: AdministrativeOffice[],
  polygons: PolygonData[]
): CoverageAnalysis {
  const overlaps: CoverageOverlap[] = [];
  const totalCoverage = {
    layerA: [] as string[],
    layerB: [] as string[],
    layerC: [] as string[]
  };
  
  // Calculate coverage for each office
  const officesWithCoverage = offices.map(office => ({
    ...office,
    coveredAreas: getCoveredAreas(office, polygons)
  }));
  
  // Group coverage by layer
  for (const office of officesWithCoverage) {
    switch (office.layer) {
      case 'A':
        totalCoverage.layerA.push(...office.coveredAreas);
        break;
      case 'B':
        totalCoverage.layerB.push(...office.coveredAreas);
        break;
      case 'C':
        totalCoverage.layerC.push(...office.coveredAreas);
        break;
    }
  }
  
  // Remove duplicates
  totalCoverage.layerA = [...new Set(totalCoverage.layerA)];
  totalCoverage.layerB = [...new Set(totalCoverage.layerB)];
  totalCoverage.layerC = [...new Set(totalCoverage.layerC)];
  
  // Find overlaps between offices
  for (let i = 0; i < offices.length; i++) {
    for (let j = i + 1; j < offices.length; j++) {
      const office1 = offices[i];
      const office2 = offices[j];
      
      if (doCirclesOverlap(
        office1.location,
        office1.radius,
        office2.location,
        office2.radius
      )) {
        // Check if this overlap already exists in a group
        const existingOverlap = overlaps.find(overlap => 
          overlap.offices.some(o => o.id === office1.id) ||
          overlap.offices.some(o => o.id === office2.id)
        );
        
        if (existingOverlap) {
          // Add to existing overlap if not already included
          if (!existingOverlap.offices.some(o => o.id === office1.id)) {
            existingOverlap.offices.push(office1);
            if (!existingOverlap.layers.includes(office1.layer)) {
              existingOverlap.layers.push(office1.layer);
            }
          }
          if (!existingOverlap.offices.some(o => o.id === office2.id)) {
            existingOverlap.offices.push(office2);
            if (!existingOverlap.layers.includes(office2.layer)) {
              existingOverlap.layers.push(office2.layer);
            }
          }
          
          // Update covered areas
          const allCoveredAreas = new Set<string>();
          for (const office of existingOverlap.offices) {
            const covered = getCoveredAreas(office, polygons);
            covered.forEach(area => allCoveredAreas.add(area));
          }
          existingOverlap.coveredAreas = Array.from(allCoveredAreas);
          
          // Recalculate center
          const latSum = existingOverlap.offices.reduce((sum, o) => sum + o.location.lat, 0);
          const lngSum = existingOverlap.offices.reduce((sum, o) => sum + o.location.lng, 0);
          existingOverlap.overlapCenter = {
            lat: latSum / existingOverlap.offices.length,
            lng: lngSum / existingOverlap.offices.length
          };
        } else {
          // Create new overlap
          const coveredAreas1 = getCoveredAreas(office1, polygons);
          const coveredAreas2 = getCoveredAreas(office2, polygons);
          const allCoveredAreas = [...new Set([...coveredAreas1, ...coveredAreas2])];
          
          overlaps.push({
            id: `overlap-${office1.id}-${office2.id}`,
            layers: [...new Set([office1.layer, office2.layer])],
            offices: [office1, office2],
            overlapCenter: calculateOverlapCenter(office1.location, office2.location),
            coveredAreas: allCoveredAreas,
            overlapType: 'partial' // Could be enhanced to determine partial vs complete
          });
        }
      }
    }
  }
  
  return {
    overlaps,
    totalCoverage
  };
}
