import { useState } from "react";

// OSRM Route Service
export interface RouteWaypoint {
  hint: string;
  distance: number;
  name: string;
  location: [number, number]; // [lng, lat]
}

export interface Route {
  geometry: string; // encoded polyline
  legs: Array<{
    steps: Array<{
      geometry: string;
      maneuver: {
        bearing_after: number;
        bearing_before: number;
        location: [number, number];
        modifier?: string;
        type: string;
      };
      mode: string;
      driving_side: string;
      name: string;
      intersections: Array<{
        out?: number;
        in?: number;
        entry: boolean[];
        bearings: number[];
        location: [number, number];
      }>;
      weight: number;
      duration: number;
      distance: number;
    }>;
    summary: string;
    weight: number;
    duration: number;
    distance: number;
  }>;
  weight_name: string;
  weight: number;
  duration: number;
  distance: number;
}

export interface OSRMRouteResponse {
  code: string;
  routes: Route[];
  waypoints: RouteWaypoint[];
}

export interface RouteRequest {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

export interface RouteResult {
  success: boolean;
  route?: Route;
  error?: string;
  encodedPolyline?: string;
  distance?: number; // in meters
  duration?: number; // in seconds
}

// OSRM service class
export class OSRMService {
  private static readonly BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

  static async getRoute(request: RouteRequest): Promise<RouteResult> {
    try {
      const { start, end } = request;
      
      // Format coordinates as lng,lat;lng,lat (OSRM format)
      const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
      
      // Build URL with required parameters
      const url = `${this.BASE_URL}/${coordinates}?overview=full&geometries=polyline&steps=false`;
      
      console.log('OSRM API Call:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data: OSRMRouteResponse = await response.json();
      
      if (data.code !== 'Ok') {
        return {
          success: false,
          error: `OSRM API Error: ${data.code}`
        };
      }
      
      if (!data.routes || data.routes.length === 0) {
        return {
          success: false,
          error: 'No routes found'
        };
      }
      
      const route = data.routes[0];
      
      return {
        success: true,
        route,
        encodedPolyline: route.geometry,
        distance: route.distance,
        duration: route.duration
      };
      
    } catch (error) {
      console.error('OSRM Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Format duration for display
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Format distance for display
  static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${Math.round(meters)} m`;
    }
  }
}

// Hook for using OSRM routing
export function useOSRMRoute() {
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const calculateRoute = async (request: RouteRequest) => {
    setLoading(true);
    try {
      const result = await OSRMService.getRoute(request);
      setRoute(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
  };

  return {
    loading,
    route,
    calculateRoute,
    clearRoute
  };
}
