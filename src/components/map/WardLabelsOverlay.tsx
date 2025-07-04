import { useEffect, useRef, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { PolygonData } from "../../data/polygon-utils";
import { calculateMultiPolygonCentroid } from "../../data/polygon-utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WardLabelsOverlayProps {
  polygons: PolygonData[];
  visible: boolean;
  zoomLevel: number;
  zoomThreshold: number;
  directionMode?: boolean;
}

interface PolygonCentroid {
  ward: string;
  district: string;
  center: google.maps.LatLng;
}

export default function WardLabelsOverlay({
  polygons,
  visible,
  zoomLevel,
  zoomThreshold,
  directionMode = false
}: WardLabelsOverlayProps) {
  const isMobile = useIsMobile();
  const map = useMap();
  const overlaysRef = useRef<Array<{ overlay: google.maps.OverlayView, wardName: string }>>([]);
  
  // Helper function to filter polygons based on zoom level to avoid overcrowding
  const getFilteredPolygons = useCallback((polygons: PolygonData[], zoomLevel: number): PolygonData[] => {
    // If zoom level is >= 11, show all labels consistently
    if (zoomLevel >= 9) {
      return polygons;
    }
    
    // At lower zoom levels, don't show any labels
    // This code path should not be reached due to the zoomThreshold check in useEffect,
    // but we keep it for safety and future flexibility
    return [];
  }, []);



  // Create centroids for all polygons
  const createCentroids = useRef((polygonData: PolygonData[]): PolygonCentroid[] => {
    return polygonData.map(polygon => {
      const centroid = calculateMultiPolygonCentroid(polygon);
      return {
        ward: polygon.ward,
        district: polygon.district,
        center: new google.maps.LatLng(centroid.lat, centroid.lng)
      };
    });
  }).current;

  useEffect(() => {
    // Clear existing overlays when conditions aren't met
    if (!map || !visible || zoomLevel < zoomThreshold) {
      overlaysRef.current.forEach(({ overlay }) => {
        overlay.setMap(null);
      });
      overlaysRef.current = [];
      return;
    }

    // Filter polygons based on zoom level
    const filteredPolygons = getFilteredPolygons(polygons, zoomLevel);
    
    // Calculate centroids for filtered polygons
    const centroids = createCentroids(filteredPolygons);
    
    // Add a small jitter to overlapping centroids to prevent perfect overlap
    // Group centroids by their rounded coordinates (to 4 decimal places)
    const positionGroups = new Map<string, PolygonCentroid[]>();
    
    centroids.forEach(centroid => {
      const key = `${centroid.center.lat().toFixed(4)},${centroid.center.lng().toFixed(4)}`;
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)?.push(centroid);
    });
    
    // Add a small offset to overlapping labels
    positionGroups.forEach(group => {
      if (group.length > 1) {
        // Only adjust if there are multiple labels at the same position
        const offsetStep = 0.0005; // Small offset, approximately 50-100 meters
        
        group.forEach((centroid, index) => {
          if (index > 0) {
            // Apply a spiral pattern for multiple overlapping labels
            const angle = (index - 1) * Math.PI / 3; // 60 degree increments
            const distance = offsetStep * Math.ceil((index - 1) / 6); // Increase distance every full circle
            
            const offsetLat = distance * Math.sin(angle);
            const offsetLng = distance * Math.cos(angle);
            
            centroid.center = new google.maps.LatLng(
              centroid.center.lat() + offsetLat,
              centroid.center.lng() + offsetLng
            );
          }
        });
      }
    });

    // Clear existing overlays
    overlaysRef.current.forEach(({ overlay }) => {
      overlay.setMap(null);
    });
    overlaysRef.current = [];

    // Log the number of labels being created at this zoom level
    console.log(`Creating ${centroids.length} ward labels at zoom level ${zoomLevel}`);

    // Create new overlays for each ward
    centroids.forEach((centroid) => {
      class WardLabelOverlay extends google.maps.OverlayView {
        private container: HTMLDivElement;
        private position: google.maps.LatLng;
        private wardName: string;
        private district: string;
        private root: ShadowRoot;
        private currentZoom: number;

        constructor(
          position: google.maps.LatLng,
          wardName: string,
          district: string
        ) {
          super();
          this.position = position;
          this.wardName = wardName;
          this.district = district;
          this.currentZoom = zoomLevel; // Store the current zoom level
          
          // Create container with shadow DOM for better style isolation
          this.container = document.createElement('div');
          this.container.style.position = 'absolute';
          this.container.style.pointerEvents = 'auto'; // Enable mouse events
          this.container.className = 'ward-label-overlay';
          this.container.style.zIndex = '500'; // Below the hover overlay
          
          // Create shadow DOM
          this.root = this.container.attachShadow({ mode: 'open' });
          
          // Add hover effects
          this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
          this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
          
          // Create the content
          this.updateContent();
        }

        onAdd() {
          const panes = this.getPanes()!;
          panes.overlayLayer.appendChild(this.container);
        }

        draw() {
          const overlayProjection = this.getProjection();
          const sw = overlayProjection.fromLatLngToDivPixel(this.position)!;
          
          // Position the overlay
          const div = this.container;
          div.style.left = `${sw.x}px`;
          div.style.top = `${sw.y}px`;
          
          // Adjust scale based on zoom level
          let finalScale = 0.8; // Default scale factor
          
          // Consistent scaling at zoom levels >= 11
          if (this.currentZoom >= 13) {
            finalScale = 1.3; // Larger at high zoom (13+)
          } else if (this.currentZoom >= 11) {
            finalScale = 0.9; // Medium size at regular zoom (11-12)
          }
          
          div.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
          
          // Check if the map zoom level has changed
          if (this.currentZoom !== zoomLevel) {
            this.currentZoom = zoomLevel;
            this.updateContent(); // Update content when zoom changes
          }
        }
        
        onRemove() {
          // Remove event listeners before removing the element
          this.container.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
          this.container.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
          
          if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
          }
        }

        updateContent() {
          // Clear previous content
          while (this.root.firstChild) {
            this.root.removeChild(this.root.firstChild);
          }
          
          // Add styles
          const style = document.createElement('style');
          style.textContent = `
            .label-container {
              position: relative;
              /* transform is now set in JS code */
              font-family: "Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,;
              text-align: center;
              user-select: none;
              display: flex;
              flex-direction: column;
              max-width: 160px;
              min-width: 40px;
              opacity: ${directionMode ? '0.3' : '0.9'};
              transform-origin: center center;
              text-shadow: 0 0 2px white, 0 0 2px white, 0 0 2px white;
            }
            
            .label-container::before {
              content: '';
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
            }
            
            .ward-name {
              font-weight: 600;
              font-size: 11px;
              color: #333;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              letter-spacing: 0.01em;
            }
            
            .district-name {
              font-size: 9px;
              color: #666;
              margin-top: 1px;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            
            /* Fade in animation */
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 0.9; }
            }
            
            @media (min-width: 768px) {
              .ward-name {
                font-size: 12px;
              }
              
              .district-name {
                font-size: 10px;
              }
              
              .label-container {
                padding: 6px 10px;
              }
            }
            
            @media (min-width: 1280px) {
              .ward-name {
                font-size: 13px;
              }
              
              .district-name {
                font-size: 11px;
              }
            }
            
            /* Color theme based on direct position calculation to create variety */
            .color-theme-1 {
              background-color: rgba(255, 255, 255, 0.92);
            }
            .color-theme-1::before {
              border-top-color: rgba(255, 255, 255, 0.92);
            }
            
            .color-theme-2 {
              background-color: rgba(240, 249, 255, 0.92);
            }
            .color-theme-2::before {
              border-top-color: rgba(240, 249, 255, 0.92);
            }
            
            .color-theme-3 {
              background-color: rgba(240, 255, 244, 0.92);
            }
            .color-theme-3::before {
              border-top-color: rgba(240, 255, 244, 0.92);
            }
            
            .color-theme-4 {
              background-color: rgba(255, 250, 240, 0.92);
            }
            .color-theme-4::before {
              border-top-color: rgba(255, 250, 240, 0.92);
            }
          `;
          
          this.root.appendChild(style);
          
          // Create label container with a color theme based on position
          const container = document.createElement('div');
          
          container.className = `label-container`;
          
          // Add ward name
          const nameElement = document.createElement('div');
          nameElement.className = 'ward-name';
          nameElement.textContent = this.wardName.replace(/Phường /, 'P. ');
          container.appendChild(nameElement);
          
          // Add district name if different from "Đà Nẵng"
          if (this.district && this.district !== "Đà Nẵng") {
            const districtElement = document.createElement('div');
            districtElement.className = 'district-name';
            districtElement.textContent = this.district;
            container.appendChild(districtElement);
          }
          
          // Add to shadow DOM
          this.root.appendChild(container);
        }

        handleMouseEnter() {
          if (this.container) {
            const labelContainer = this.root.querySelector('.label-container') as HTMLElement;
            if (labelContainer) {
              labelContainer.style.transform = `translate(-50%, -50%) scale(${1.1})`;
              labelContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(0, 0, 0, 0.05)';
              labelContainer.style.zIndex = '1';
              labelContainer.style.opacity = '1';
            }
          }
        }

        handleMouseLeave() {
          if (this.container) {
            const labelContainer = this.root.querySelector('.label-container') as HTMLElement;
            if (labelContainer) {
              // Restore original transform based on zoom level
              let finalScale = 0.8; // Default scale factor
              
              // Match the scaling logic from draw()
              if (this.currentZoom >= 13) {
                finalScale = isMobile ? 1.3 : 1.1; // Larger at high zoom (13+)
              } else if (this.currentZoom >= 11) {
                finalScale = isMobile ? 1.1 : 0.9; // Medium size at regular zoom (11-12)
              }
              
              labelContainer.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
              labelContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)';
              labelContainer.style.zIndex = '0';
              labelContainer.style.opacity = '0.9';
            }
          }
        }
      }

      // Create and add the overlay
      const overlay = new WardLabelOverlay(
        centroid.center,
        centroid.ward,
        centroid.district
      );
      overlay.setMap(map);
      
      // Store reference for cleanup
      overlaysRef.current.push({
        overlay,
        wardName: centroid.ward
      });
    });

    return () => {
      // Clean up overlays
      overlaysRef.current.forEach(({ overlay }) => {
        overlay.setMap(null);
      });
      overlaysRef.current = [];
    };
  }, [map, polygons, visible, zoomLevel, zoomThreshold, createCentroids, getFilteredPolygons, isMobile, directionMode]);

  // Add an early warning if somehow rendered below the proper threshold
  useEffect(() => {
    if (zoomLevel < 11) {
      console.warn(`WardLabelsOverlay rendered at zoom level ${zoomLevel}, which is below the expected threshold of 11`);
    }
  }, [zoomLevel]);

  return null;
}
