import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState, useCallback } from "react";
import WardNameOverlay from "./WardNameOverlay";
import { getWardColor } from "../../lib/utils";
import { useIsMobile } from "../../hooks/use-mobile";

interface PolygonData {
  district: string;
  ward: string;
  polygon: Array<{ lat: number; lng: number }>;

  polygons?: Array<Array<{ lat: number; lng: number }>>;
}

interface PolygonOverlayProps {
  polygons: PolygonData[];
  visible: boolean;
  selectedPolygon?: PolygonData | null;
  onPolygonClick?: (polygon: PolygonData) => void;
  onPolygonClickInEditMode?: (event: google.maps.PolyMouseEvent) => void; // New prop for edit mode polygon clicks
  onUnselectWard?: () => void; // New prop to unselect the current ward
  interactive?: boolean; // New prop to control if the polygon is clickable and hoverable
  zoomThreshold?: number; // Threshold below which the ward is unselected
  neutralMode?: boolean; // New prop to control neutral color mode
  directionMode?: boolean; // New prop to dim polygons when direction mode is active
  editMode?: boolean; // New prop to enable edit mode behavior for polygon clicks
}

// Selected polygon colors (gold/yellow)
const SELECTED_COLORS = {
  stroke: "#FFD700",
  fill: "#FFD700",
};

// Neutral mode colors (gray)
const NEUTRAL_COLORS = {
  stroke: "#6B7280",
  fill: "#9CA3AF",
};

export function PolygonOverlay(
  { polygons, visible, selectedPolygon, onPolygonClick, onPolygonClickInEditMode, onUnselectWard, interactive = true, zoomThreshold = 9.5, neutralMode = false, directionMode = false, editMode = false }: PolygonOverlayProps
) {
  const map = useMap();
  const isMobile = useIsMobile();
  const polygonRefs = useRef<google.maps.Polygon[]>([]);
  const [hoveredWard, setHoveredWard] = useState<PolygonData | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<google.maps.LatLng | null>(null);
  // Add a ref to track if we've already fit bounds for the current selected polygon
  const fittedPolygonRef = useRef<string | null>(null);
  // Add a ref to track if we're currently handling a manual zoom operation
  const userZoomingRef = useRef<boolean>(false);

  // Function to calculate bounds for a polygon with error handling
  const calculatePolygonBounds = useCallback((polygonData: PolygonData): google.maps.LatLngBounds | null => {
    try {
      const bounds = new google.maps.LatLngBounds();
      let hasValidPoints = false;
      
      // Handle multipolygons (multiple paths)
      if (polygonData.polygons && polygonData.polygons.length > 0) {
        polygonData.polygons.forEach(path => {
          if (path && path.length > 0) {
            path.forEach(point => {
              if (point && typeof point.lat === 'number' && typeof point.lng === 'number' && 
                  !isNaN(point.lat) && !isNaN(point.lng)) {
                bounds.extend(new google.maps.LatLng(point.lat, point.lng));
                hasValidPoints = true;
              }
            });
          }
        });
      }
      // Handle single polygon
      else if (polygonData.polygon && polygonData.polygon.length > 0) {
        polygonData.polygon.forEach(point => {
          if (point && typeof point.lat === 'number' && typeof point.lng === 'number' && 
              !isNaN(point.lat) && !isNaN(point.lng)) {
            bounds.extend(new google.maps.LatLng(point.lat, point.lng));
            hasValidPoints = true;
          }
        });
      }
      
      return hasValidPoints ? bounds : null;
    } catch (error) {
      console.error('Error calculating polygon bounds:', error);
      return null;
    }
  }, []);

  // Setup zoom listeners to detect when user is manually zooming
  useEffect(() => {
    if (!map) return;

    const zoomStartListener = map.addListener('zoom_changed', () => {
      // Mark that user has manually zoomed
      userZoomingRef.current = true;
      
      // Check if zoom level is below threshold and there is a selected polygon
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined && currentZoom < zoomThreshold && selectedPolygon && onUnselectWard) {
        // Unselect ward when zoomed out enough
        onUnselectWard();
      }
    });
    
    return () => {
      // Clean up listener
      if (zoomStartListener) {
        google.maps.event.removeListener(zoomStartListener);
      }
    };
  }, [map, zoomThreshold, selectedPolygon, onUnselectWard]);

  // Effect to fit map bounds to selected polygon only when it INITIALLY changes
  useEffect(() => {
    if (map && selectedPolygon && visible) {
      // Only fit bounds if:
      // 1. The selected polygon has changed
      // 2. We haven't fitted this polygon already
      // 3. User isn't currently manually zooming
      const currentSelectedWard = selectedPolygon.ward;
      if (fittedPolygonRef.current !== currentSelectedWard && !userZoomingRef.current) {
        // Add a small delay to ensure polygons are rendered
        const timeoutId = setTimeout(() => {
          const bounds = calculatePolygonBounds(selectedPolygon);
          
          if (bounds) {
            // Add padding around the polygon for better visualization
            const paddingOptions = {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80
            };
            
            try {
              map.fitBounds(bounds, paddingOptions);
              // Mark this polygon as fitted so we don't zoom to it again
              fittedPolygonRef.current = currentSelectedWard;
            } catch (error) {
              console.error('Error fitting map bounds:', error);
            }
          }
        }, 100); // Small delay to ensure polygons are rendered

        return () => clearTimeout(timeoutId);
      }
    } else if (!selectedPolygon) {
      // Reset the fitted polygon ref when there's no selected polygon
      fittedPolygonRef.current = null;
      // Also reset the user zooming flag
      userZoomingRef.current = false;
    }
  }, [map, selectedPolygon, visible, calculatePolygonBounds]);

  useEffect(() => {
    if (!map || !visible) {
      // Clear existing polygons
      polygonRefs.current.forEach((polygon) => {
        polygon.setMap(null);
      });
      polygonRefs.current = [];
      // Clear hover state
      setHoveredWard(null);
      return;
    }

    // Clear existing polygons
    polygonRefs.current.forEach((polygon) => {
      polygon.setMap(null);
    });
    polygonRefs.current = [];

    // Group polygons by ward name for synchronized hover effects
    const wardPolygonMap = new Map<string, google.maps.Polygon[]>();

    // Create new polygons
    polygons.forEach((polygonData) => {
      // Array to store all polygon parts for this ward
      const wardPolygons: google.maps.Polygon[] = [];

      // Add to ward-polygon mapping
      wardPolygonMap.set(polygonData.ward, wardPolygons);

      // Check if this polygon is selected
      const isSelected = selectedPolygon?.ward === polygonData.ward;

      // Function to create and set up a polygon with event handlers
      const createPolygon = (path: Array<{ lat: number; lng: number }>) => {
        if (!path || path.length === 0) return null;

        // Determine colors based on selection state, neutral mode, and district
        let strokeColor: string;
        let fillColor: string;
        let fillOpacity: number;
        let strokeOpacity: number;
        
        if (isSelected) {
          strokeColor = SELECTED_COLORS.stroke;
          fillColor = SELECTED_COLORS.fill;
          fillOpacity = directionMode ? 0.2 : 0.4; // Dimmed when direction mode is on
          strokeOpacity = directionMode ? 0.4 : 0.8;
        } else if (neutralMode) {
          strokeColor = NEUTRAL_COLORS.stroke;
          fillColor = NEUTRAL_COLORS.fill;
          fillOpacity = directionMode ? 0.03 : 0.08; // Much dimmer for neutral mode when direction mode is on
          strokeOpacity = directionMode ? 0.2 : 0.5;
        } else {
          const districtColors = getWardColor(polygonData.ward);
          strokeColor = districtColors.stroke;
          fillColor = districtColors.fill;
          fillOpacity = directionMode ? 0.04 : 0.12; // Dimmed when direction mode is on
          strokeOpacity = directionMode ? 0.3 : 0.8;
        }
        
        const strokeWeight = isSelected ? 2.5 : 1.5;
        const zIndex = isSelected ? 3 : 1;

        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor,
          strokeOpacity,
          strokeWeight,
          fillColor,
          fillOpacity,
          clickable: interactive, // Use interactive prop to control clickability
          zIndex,
        });

        polygon.setMap(map);

        // Add polygon to the ward's polygon array for synchronized hover
        wardPolygons.push(polygon);

        // Only add event listeners if interactive
        if (interactive) {
          // Add click listener
          polygon.addListener("click", (event: google.maps.PolyMouseEvent) => {
            if (editMode && onPolygonClickInEditMode) {
              // In edit mode, forward the click event for marker addition
              onPolygonClickInEditMode(event);
            } else if (!editMode && onPolygonClick) {
              // In normal mode, handle polygon selection
              onPolygonClick(polygonData);
            }
          });

          // Add hover effects (disabled on mobile and in edit mode)
          if (!isMobile && !editMode) {
            polygon.addListener("mouseover", (event: google.maps.PolyMouseEvent) => {
              // Highlight all polygons for this ward
              const allWardPolygons = wardPolygonMap.get(polygonData.ward) || [];
              const isCurrentlySelected = selectedPolygon?.ward === polygonData.ward;

              allWardPolygons.forEach((poly) => {
                if (isCurrentlySelected) {
                  // If selected, just increase opacity slightly on hover
                  poly.setOptions({
                    fillOpacity: 0.6,
                    strokeWeight: 3,
                    strokeOpacity: 1,
                    zIndex: 4,
                  });
                } else {
                  // Normal hover effect for non-selected polygons
                  poly.setOptions({
                    fillOpacity: 0.8,
                    strokeWeight: 1.5,
                    strokeOpacity: 1,
                    zIndex: 2,
                  });
                }
              });

              // Calculate center of polygon or use the mouse position
              if (event.latLng) {
                setOverlayPosition(event.latLng);
              } else {
                // Calculate the center of the polygon
                const bounds = new google.maps.LatLngBounds();
                path.forEach((point) => {
                  bounds.extend(new google.maps.LatLng(point.lat, point.lng));
                });
                setOverlayPosition(bounds.getCenter());
              }
              
              setHoveredWard(polygonData);
            });
          }
          
          // Add mouseout listener (disabled on mobile)
          if (!isMobile) {
            polygon.addListener("mouseout", () => {
              // Reset all polygons for this ward
              const allWardPolygons = wardPolygonMap.get(polygonData.ward) || [];
              const isCurrentlySelected = selectedPolygon?.ward === polygonData.ward;

              allWardPolygons.forEach((poly) => {
                if (isCurrentlySelected) {
                  // Reset to selected state
                  poly.setOptions({
                    fillOpacity: 0.4,
                    strokeWeight: 2.5,
                    strokeOpacity: 0.8,
                    zIndex: 3,
                  });
                } else {
                  // Reset to normal state
                  poly.setOptions({
                    fillOpacity: 0.12,
                    strokeWeight: 1.5,
                    strokeOpacity: 0.8,
                    zIndex: 1,
                  });
                }
              });

              setHoveredWard(null);
            });
          }
        }

        return polygon;
      };

      // Handle multipolygons (multiple paths)
      if (polygonData.polygons && polygonData.polygons.length > 0) {
        // Create a polygon for each path in the multipolygon
        polygonData.polygons.forEach((path) => {
          const polygon = createPolygon(path);
          if (polygon) polygonRefs.current.push(polygon);
        });
      }
      // Fallback to single polygon for backward compatibility
      else if (polygonData.polygon && polygonData.polygon.length > 0) {
        const polygon = createPolygon(polygonData.polygon);
        if (polygon) polygonRefs.current.push(polygon);
      }
    });

    return () => {
      // Cleanup function
      polygonRefs.current.forEach((polygon) => {
        polygon.setMap(null);
      });
      polygonRefs.current = [];
      setHoveredWard(null);
      setOverlayPosition(null);
    };
  }, [map, polygons, visible, selectedPolygon, onPolygonClick, onPolygonClickInEditMode, interactive, isMobile, neutralMode, directionMode, editMode]);

  return (
    <>
      {!isMobile && hoveredWard && overlayPosition && (
        <WardNameOverlay
          map={map}
          position={overlayPosition}
          wardName={hoveredWard.ward}
          district={hoveredWard.district}
          color={
            selectedPolygon?.ward === hoveredWard.ward
              ? SELECTED_COLORS.fill
              : neutralMode
                ? NEUTRAL_COLORS.fill
                : getWardColor(hoveredWard.ward).fill
          }
          visible={true}
        />
      )}
    </>
  );
}
