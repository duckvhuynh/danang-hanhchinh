import { useState, useCallback, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import { ZoomAwareMap } from "./map/ZoomAwareMap";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MapControls } from "./map/MapControls";
import { PolygonOverlay } from "./map/PolygonOverlay";
import { UserLocationMarker } from "./map/UserLocationMarker";
import { OfficeMarkers } from "./map/OfficeMarkers";
import { AdministrativeOffices } from "./map/AdministrativeOffices";
import { SelectedWardInfo } from "./map/SelectedWardInfo";
import { MapHeader, MapFooter } from "./map/MapInfo";
import WardLabelsOverlay from "./map/WardLabelsOverlay";
import { LoadingScreen } from "./LoadingScreen";
import { Polyline } from "./geometry/polyline";
import { toast } from "sonner";
import { danangPolygons, isPointInPolygon as isPointInPolygonUtil } from "../data/polygon-utils";
import type { PolygonData } from "../data/polygon-utils";
import { offices } from "../data/office-utils";
import { getWholeDanangPolygon, getWholeDanangBounds } from "../data/whole-danang-utils";
import { 
  getOfficesByLayer, 
  categorizeLayerBOffices,
  categorizeLayerCOffices,
  generateAdministrativePlanningReport,
  generateExecutiveReport,
  type AdministrativeOffice 
} from "../data/administrative-offices";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "./ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  downloadAsJSON,
  downloadAsExcel,
  downloadAllLayersAsExcel,
  generateFilename
} from "../utils/download-utils";

// Da Nang coordinates
const DA_NANG_CENTER = { lat: 15.733009, lng: 108.060244 };
// Zoom threshold for showing detailed polygons vs whole city polygon
const ZOOM_THRESHOLD = 10;

interface MainInterfaceProps {
  apiKey: string;
}

export function MainInterface({ apiKey }: MainInterfaceProps) {
  // Initialize polygon and bounds
  const wholeDanangPolygon = getWholeDanangPolygon();
  const danangBounds = getWholeDanangBounds();

  // Keep selectedWard state for map interactions (polygon highlighting, click handling)
  // even though it's no longer passed to AppSidebar after removing the "Thông tin" tab
  const [selectedWard, setSelectedWard] = useState<PolygonData | null>(null);
  const [showPolygons, setShowPolygons] = useState(true);

  // Administrative offices state
  const [showLayerA, setShowLayerA] = useState(false);
  const [showLayerB, setShowLayerB] = useState(false);
  const [showLayerC, setShowLayerC] = useState(false);
  const [showCircles, setShowCircles] = useState(true);

  // Radius state for each layer
  // Layer A type-based radius controls
  const [layerAUrbanReceptionRadius, setLayerAUrbanReceptionRadius] = useState(2.5); // Layer A urban reception radius (2-3km, using 2.5km)
  const [layerASuburbanReceptionRadius, setLayerASuburbanReceptionRadius] = useState(5); // Layer A suburban reception radius (5km)
  const [layerAUrbanManagementRadius, setLayerAUrbanManagementRadius] = useState(5); // Layer A urban management radius (5km)
  const [layerASuburbanManagementRadius, setLayerASuburbanManagementRadius] = useState(10); // Layer A suburban management radius (10km)
  // Layer B and C have fixed default radius (no type-based logic)
  const [layerBRadius, setLayerBRadius] = useState(5); // Layer B fixed radius (5km)
  const [layerCRadius, setLayerCRadius] = useState(5); // Layer C default radius (5km)

  // Fill opacity state
  const [fillOpacity, setFillOpacity] = useState(0.3); // Default 30% opacity

  // Layer B within Layer A control state
  const [hideLayerBWithinA, setHideLayerBWithinA] = useState(false); // Option to hide/dim Layer B within Layer A
  const [useManagementRadiusForHiding, setUseManagementRadiusForHiding] = useState(true); // Use management vs reception radius

  // Layer C within Layer A/B control state
  const [hideLayerCWithinA, setHideLayerCWithinA] = useState(false); // Option to hide/dim Layer C within Layer A
  const [hideLayerCWithinB, setHideLayerCWithinB] = useState(false); // Option to hide/dim Layer C within Layer B
  const [useManagementRadiusForLayerC, setUseManagementRadiusForLayerC] = useState(true); // Use management vs reception radius for Layer C vs A check

  // Polygon color mode state
  const [neutralPolygonMode, setNeutralPolygonMode] = useState(false);

  // Map type state
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "styled">("styled");

  // Direction mode state
  const [directionMode, setDirectionMode] = useState(false);
  const [directionModeType, setDirectionModeType] = useState<'route' | 'straightline'>('route');
  const [selectedStartOffice, setSelectedStartOffice] = useState<AdministrativeOffice | null>(null);
  const [selectedEndOffice, setSelectedEndOffice] = useState<AdministrativeOffice | null>(null);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [straightLineCoords, setStraightLineCoords] = useState<Array<{lat: number, lng: number}> | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{distance: number, type: 'route' | 'straightline'} | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [selectedLayerForAdd, setSelectedLayerForAdd] = useState<'A' | 'B' | 'C'>('B');
  const [customOffices, setCustomOffices] = useState<AdministrativeOffice[]>([]);
  const [editedOffices, setEditedOffices] = useState<Map<string, AdministrativeOffice>>(new Map());
  const [deletedOfficeIds, setDeletedOfficeIds] = useState<Set<string>>(new Set());
  
  // Map state
  const [zoomLevel, setZoomLevel] = useState(8);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // About dialog state
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    office: AdministrativeOffice | null;
  }>({ isOpen: false, office: null });
  
  // Administrative Planning Report Dialog state
  const [showPlanningReportDialog, setShowPlanningReportDialog] = useState(false);
  const [planningReportData, setPlanningReportData] = useState<ReturnType<typeof generateAdministrativePlanningReport> | null>(null);

  // Executive Summary Dialog state
  const [showExecutiveSummaryDialog, setShowExecutiveSummaryDialog] = useState(false);
  const [executiveSummaryData, setExecutiveSummaryData] = useState<ReturnType<typeof generateExecutiveReport> | null>(null);

  // Detailed Planning Report Dialog state (for download handlers) 
  const [showDetailedPlanningDialog, setShowDetailedPlanningDialog] = useState(false);
  const [detailedPlanningData, setDetailedPlanningData] = useState<ReturnType<typeof generateAdministrativePlanningReport> | null>(null);

  // Helper functions to get radius based on office type for Layer A
  const getLayerAReceptionRadius = useCallback((office?: AdministrativeOffice) => {
    if (!office || office.layer !== 'A') return layerAUrbanReceptionRadius;
    return office.type === 'suburban' ? layerASuburbanReceptionRadius : layerAUrbanReceptionRadius;
  }, [layerAUrbanReceptionRadius, layerASuburbanReceptionRadius]);

  const getLayerAManagementRadius = useCallback((office?: AdministrativeOffice) => {
    if (!office || office.layer !== 'A') return layerAUrbanManagementRadius;
    return office.type === 'suburban' ? layerASuburbanManagementRadius : layerAUrbanManagementRadius;
  }, [layerAUrbanManagementRadius, layerASuburbanManagementRadius]);

  // This effect ensures the selectedWard variable is used
  useEffect(() => {
    console.log("Selected ward updated:", selectedWard?.ward || "None");
  }, [selectedWard]);

  // Handle map load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePolygonClick = useCallback((polygonData: PolygonData) => {
    setSelectedWard(polygonData);
  }, []);

  const handlePolygonClickInEditMode = useCallback((event: google.maps.PolyMouseEvent) => {
    if (event.latLng && editMode) {
      const newOffice: AdministrativeOffice = {
        id: `custom-${Date.now()}`,
        name: `Trụ sở mới ${selectedLayerForAdd}`,
        location: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
        address: "Địa chỉ cần cập nhật",
        region: "Đà Nẵng",
        layer: selectedLayerForAdd,
        radius: selectedLayerForAdd === 'A' ? 7 : 5,
      };
      
      setCustomOffices(prev => [...prev, newOffice]);
      toast.success(`Đã thêm trụ sở lớp ${selectedLayerForAdd}`, {
        description: "Có thể kéo thả để di chuyển hoặc xóa trong chế độ chỉnh sửa"
      });
    }
  }, [editMode, selectedLayerForAdd]);

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    if (event.detail.latLng) {
      // Edit mode: Add new marker
      if (editMode) {
        const newOffice: AdministrativeOffice = {
          id: `custom-${Date.now()}`,
          name: `Trụ sở mới ${selectedLayerForAdd}`,
          location: {
            lat: event.detail.latLng.lat,
            lng: event.detail.latLng.lng,
          },
          address: "Địa chỉ cần cập nhật",
          region: "Đà Nẵng",
          layer: selectedLayerForAdd,
          // Set radius based on layer type and current settings
          radius: selectedLayerForAdd === 'A' 
            ? layerAUrbanReceptionRadius // Default to urban reception radius for Layer A
            : selectedLayerForAdd === 'B'
            ? layerBRadius // Layer B uses fixed radius
            : layerCRadius, // Layer C uses single radius
          // Add Layer A specific radii if applicable (default to urban)
          ...(selectedLayerForAdd === 'A' && {
            receptionRadius: layerAUrbanReceptionRadius,
            managementRadius: layerAUrbanManagementRadius,
            type: 'urban' as const, // Default new Layer A offices to urban
          }),
        };
        
        setCustomOffices(prev => [...prev, newOffice]);
        toast.success(`Đã thêm trụ sở lớp ${selectedLayerForAdd}`, {
          description: "Có thể kéo thả để di chuyển hoặc xóa trong chế độ chỉnh sửa"
        });
        return;
      }

      // Only process polygon selection when zoom level is at or above threshold
      // This prevents selecting administrative divisions when viewing the whole city
      if (zoomLevel >= ZOOM_THRESHOLD) {
        const clickedPoint = event.detail.latLng;

        // Find which polygon contains the clicked point
        const foundWard = danangPolygons.find((ward) => {
          // Check both single polygon and multipolygon
          return isPointInPolygonUtil(clickedPoint, ward.polygon, ward.polygons);
        });

        if (foundWard) {
          setSelectedWard(foundWard as PolygonData);
        }
      }
    }
  }, [zoomLevel, editMode, selectedLayerForAdd, layerAUrbanReceptionRadius, layerAUrbanManagementRadius, layerBRadius, layerCRadius]);

  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị.", {
        description: "Vui lòng sử dụng trình duyệt hiện đại hơn hoặc cập nhật phiên bản."
      });
      return;
    }

    setIsLocating(true);

    let attempt = 0;
    const maxAttempts = 2;

    const tryGetLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy; // in meters
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // if accuracy > 100 meters and we haven't retried yet, try again
          if (accuracy > 100 && attempt < maxAttempts - 1) {
            attempt++;
            setTimeout(tryGetLocation, 1000); // wait a bit before retrying
            return;
          }

          setUserLocation(location);
          setIsLocating(false);

          // Show success message
          toast.success("Đã xác định vị trí của bạn thành công", {
            description: "Đang hiển thị vị trí của bạn trên bản đồ"
          });

          const userWard = danangPolygons.find((ward) =>
            isPointInPolygonUtil(location, ward.polygon, ward.polygons)
          );

          if (userWard) {
            setSelectedWard(userWard);
          }
        },
        (error) => {
          setIsLocating(false);

          // Handle specific geolocation errors with friendly Vietnamese messages
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Không có quyền truy cập vị trí", {
                description: "Vui lòng cấp quyền truy cập vị trí trong cài đặt trình duyệt của bạn"
              });
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Không thể xác định vị trí", {
                description: "Thông tin vị trí hiện không khả dụng. Vui lòng thử lại sau."
              });
              break;
            case error.TIMEOUT:
              toast.error("Hết thời gian xác định vị trí", {
                description: "Quá trình xác định vị trí đã hết thời gian. Vui lòng thử lại."
              });
              break;
            default:
              toast.error("Lỗi không xác định", {
                description: "Đã xảy ra lỗi khi xác định vị trí của bạn. Vui lòng thử lại sau."
              });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    tryGetLocation();
  };

  const clearSelectedWard = () => {
    setSelectedWard(null);
  };

  // Helper function to get visible administrative offices
  const getVisibleAdministrativeOffices = useCallback(() => {
    const visibleOffices: AdministrativeOffice[] = [];
    
    if (showLayerA) {
      const layerAOffices = getOfficesByLayer('A')
        .filter(office => !deletedOfficeIds.has(office.id)) // Filter out deleted offices
        .map(office => {
          // Check if this office has been edited
          const editedOffice = editedOffices.get(office.id);
          if (editedOffice) {
            return editedOffice;
          }
          
          // Apply radius based on office type for Layer A
          const receptionRadius = getLayerAReceptionRadius(office);
          const managementRadius = getLayerAManagementRadius(office);
          
          return {
            ...office,
            receptionRadius,
            managementRadius,
            radius: receptionRadius, // Primary radius for Layer A is reception radius
          };
        });
      visibleOffices.push(...layerAOffices);
    }
    if (showLayerB) {
      const layerBOffices = getOfficesByLayer('B')
        .filter(office => !deletedOfficeIds.has(office.id)) // Filter out deleted offices
        .map(office => {
          // Check if this office has been edited
          const editedOffice = editedOffices.get(office.id);
          if (editedOffice) {
            return editedOffice;
          }
          
          // Layer B now uses fixed radius (no type-based logic)
          return {
            ...office,
            radius: layerBRadius,
          };
        });
      visibleOffices.push(...layerBOffices);
    }
    if (showLayerC) {
      const layerCOffices = getOfficesByLayer('C')
        .filter(office => !deletedOfficeIds.has(office.id)) // Filter out deleted offices
        .map(office => {
          // Check if this office has been edited
          const editedOffice = editedOffices.get(office.id);
          return editedOffice || {
            ...office,
            radius: layerCRadius
          };
        });
      visibleOffices.push(...layerCOffices);
    }
    
    // Add custom offices based on visible layers
    const visibleCustomOffices = customOffices.filter(office => {
      if (office.layer === 'A' && showLayerA) return true;
      if (office.layer === 'B' && showLayerB) return true;
      if (office.layer === 'C' && showLayerC) return true;
      return false;
    });
    
    visibleOffices.push(...visibleCustomOffices);
    
    return visibleOffices;
  }, [showLayerA, showLayerB, showLayerC, layerBRadius, layerCRadius, customOffices, editedOffices, deletedOfficeIds, getLayerAReceptionRadius, getLayerAManagementRadius]);

  // Calculate Layer B offices within Layer A circles
  const getLayerBWithinAInfo = useCallback(() => {
    if (!showLayerA || !showLayerB) {
      return { count: 0, withinOffices: [], outsideOffices: [] };
    }

    const layerAOffices = getOfficesByLayer('A')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        if (editedOffice) {
          return editedOffice;
        }
        
        // Apply radius based on office type for Layer A
        const receptionRadius = getLayerAReceptionRadius(office);
        const managementRadius = getLayerAManagementRadius(office);
        
        return {
          ...office,
          receptionRadius,
          managementRadius,
          radius: receptionRadius,
        };
      });

    const layerBOffices = getOfficesByLayer('B')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        if (editedOffice) {
          return editedOffice;
        }
        
        // Layer B now uses fixed radius (no type-based logic)
        return {
          ...office,
          radius: layerBRadius,
        };
      });

    // Import the categorization function
    const result = categorizeLayerBOffices(layerBOffices, layerAOffices, useManagementRadiusForHiding);
    
    return {
      count: result.withinLayerA.length,
      withinOffices: result.withinLayerA,
      outsideOffices: result.outsideLayerA
    };
  }, [showLayerA, showLayerB, layerBRadius, deletedOfficeIds, editedOffices, useManagementRadiusForHiding, getLayerAReceptionRadius, getLayerAManagementRadius]);

  // Calculate Layer C offices within Layer A and B circles
  const getLayerCWithinABInfo = useCallback(() => {
    if (!showLayerC) {
      return { 
        countA: 0, 
        countB: 0, 
        withinAOffices: [], 
        withinBOffices: [], 
        outsideBothOffices: [] 
      };
    }

    const layerAOffices = showLayerA ? getOfficesByLayer('A')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        if (editedOffice) {
          return editedOffice;
        }
        
        // Apply radius based on office type for Layer A
        const receptionRadius = getLayerAReceptionRadius(office);
        const managementRadius = getLayerAManagementRadius(office);
        
        return {
          ...office,
          receptionRadius,
          managementRadius,
          radius: receptionRadius,
        };
      }) : [];

    const layerBOffices = showLayerB ? getOfficesByLayer('B')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        if (editedOffice) {
          return editedOffice;
        }
        
        // Layer B now uses fixed radius (no type-based logic)
        return {
          ...office,
          radius: layerBRadius,
        };
      }) : [];

    const layerCOffices = getOfficesByLayer('C')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        return editedOffice || {
          ...office,
          radius: layerCRadius
        };
      });

    // Import the categorization function
    const result = categorizeLayerCOffices(
      layerCOffices, 
      layerAOffices, 
      layerBOffices, 
      useManagementRadiusForLayerC
    );
    
    return {
      countA: result.withinLayerA.length,
      countB: result.withinLayerB.length,
      withinAOffices: result.withinLayerA,
      withinBOffices: result.withinLayerB,
      outsideBothOffices: result.outsideBoth
    };
  }, [showLayerA, showLayerB, showLayerC, layerBRadius, layerCRadius, deletedOfficeIds, editedOffices, useManagementRadiusForLayerC, getLayerAReceptionRadius, getLayerAManagementRadius]);

  // Direction mode functions
  
  // Calculate straight-line distance using Haversine formula
  const calculateStraightLineDistance = useCallback((start: AdministrativeOffice, end: AdministrativeOffice): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (start.location.lat * Math.PI) / 180;
    const lat2Rad = (end.location.lat * Math.PI) / 180;
    const deltaLatRad = ((end.location.lat - start.location.lat) * Math.PI) / 180;
    const deltaLngRad = ((end.location.lng - start.location.lng) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  }, []);

  const fetchRoute = useCallback(async (start: AdministrativeOffice, end: AdministrativeOffice) => {
    setIsLoadingRoute(true);
    try {
      // OSRM API call
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.location.lng},${start.location.lat};${end.location.lng},${end.location.lat}?overview=full&geometries=polyline`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRoutePolyline(route.geometry); // This is the encoded polyline
        setDistanceInfo({ distance: route.distance, type: 'route' });
        setStraightLineCoords(null); // Clear straight line when showing route
        toast.success(`Tìm đường thành công`, {
          description: `Khoảng cách: ${(route.distance / 1000).toFixed(1)}km, Thời gian: ${Math.round(route.duration / 60)} phút`
        });
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      toast.error("Không thể tìm đường", {
        description: "Vui lòng thử lại với hai địa điểm khác"
      });
    } finally {
      setIsLoadingRoute(false);
    }
  }, [setIsLoadingRoute, setRoutePolyline, setDistanceInfo, setStraightLineCoords]);

  const calculateStraightLine = useCallback((start: AdministrativeOffice, end: AdministrativeOffice) => {
    const distance = calculateStraightLineDistance(start, end);
    const coords = [
      { lat: start.location.lat, lng: start.location.lng },
      { lat: end.location.lat, lng: end.location.lng }
    ];
    
    setStraightLineCoords(coords);
    setDistanceInfo({ distance, type: 'straightline' });
    setRoutePolyline(null); // Clear route when showing straight line
    
    toast.success(`Khoảng cách đường chim bay`, {
      description: `Khoảng cách: ${(distance / 1000).toFixed(2)}km`
    });
  }, [calculateStraightLineDistance, setStraightLineCoords, setDistanceInfo, setRoutePolyline]);

  const handleOfficeClick = useCallback((office: AdministrativeOffice) => {
    if (!directionMode) return;

    if (!selectedStartOffice) {
      // Select as start point
      setSelectedStartOffice(office);
      toast.info(`Đã chọn điểm xuất phát: ${office.name}`);
    } else if (selectedStartOffice.id === office.id) {
      // Clicking the same office deselects it
      setSelectedStartOffice(null);
      setSelectedEndOffice(null);
      setRoutePolyline(null);
      setStraightLineCoords(null);
      setDistanceInfo(null);
      toast.info("Đã hủy chọn điểm xuất phát");
    } else if (!selectedEndOffice) {
      // Select as end point and calculate based on mode
      setSelectedEndOffice(office);
      toast.info(`Đã chọn điểm đến: ${office.name}`);
      
      if (directionModeType === 'route') {
        fetchRoute(selectedStartOffice, office);
      } else {
        calculateStraightLine(selectedStartOffice, office);
      }
    } else {
      // Reset and select as new start point
      setSelectedStartOffice(office);
      setSelectedEndOffice(null);
      setRoutePolyline(null);
      setStraightLineCoords(null);
      setDistanceInfo(null);
      toast.info(`Đã chọn điểm xuất phát mới: ${office.name}`);
    }
  }, [directionMode, selectedStartOffice, selectedEndOffice, directionModeType, fetchRoute, calculateStraightLine]);

  // Edit mode functions
  const handleMarkerDrag = useCallback((office: AdministrativeOffice, newPosition: {lat: number, lng: number}) => {
    if (!editMode) return;

    const updatedOffice = {
      ...office,
      location: newPosition,
    };

    // Check if it's a custom office or original office
    if (office.id.startsWith('custom-')) {
      setCustomOffices(prev => prev.map(o => o.id === office.id ? updatedOffice : o));
    } else {
      setEditedOffices(prev => new Map(prev).set(office.id, updatedOffice));
    }

    toast.success("Đã di chuyển trụ sở", {
      description: `${office.name} đã được di chuyển đến vị trí mới`
    });
  }, [editMode]);

  const handleMarkerDelete = useCallback((office: AdministrativeOffice) => {
    if (!editMode) return;

    // Check if it's a custom office or original office
    if (office.id.startsWith('custom-')) {
      // Custom offices can be deleted immediately
      setCustomOffices(prev => prev.filter(o => o.id !== office.id));
      toast.success("Đã xóa trụ sở tùy chỉnh", {
        description: `${office.name} đã được xóa`
      });
    } else {
      // Original offices require confirmation
      setDeleteConfirmDialog({
        isOpen: true,
        office: office
      });
    }
  }, [editMode]);

  // Handle confirmed deletion of original office
  const handleConfirmDeleteOriginalOffice = useCallback((office: AdministrativeOffice) => {
    setDeletedOfficeIds(prev => new Set(prev).add(office.id));
    setDeleteConfirmDialog({ isOpen: false, office: null });
    
    toast.success("Đã ẩn trụ sở gốc", {
      description: `${office.name} đã được ẩn khỏi bản đồ`
    });
  }, []);

  // Handle cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmDialog({ isOpen: false, office: null });
  }, []);

  const handleOfficeEdit = useCallback((office: AdministrativeOffice, updates: Partial<AdministrativeOffice>) => {
    if (!editMode) return;

    const updatedOffice = { ...office, ...updates };

    // Check if it's a custom office or original office
    if (office.id.startsWith('custom-')) {
      setCustomOffices(prev => prev.map(o => o.id === office.id ? updatedOffice : o));
    } else {
      setEditedOffices(prev => new Map(prev).set(office.id, updatedOffice));
    }

    toast.success("Đã cập nhật thông tin trụ sở", {
      description: `Thông tin ${office.name} đã được cập nhật`
    });
  }, [editMode]);

  // Clear edit mode selections when edit mode is disabled
  useEffect(() => {
    if (!editMode) {
      // Restore deleted offices when exiting edit mode
      setDeletedOfficeIds(new Set());
      // Optionally clear custom offices or keep them
      // setCustomOffices([]);
      // setEditedOffices(new Map());
    }
  }, [editMode]);

  // Recalculate when direction mode type changes (if both offices are selected)
  useEffect(() => {
    if (directionMode && selectedStartOffice && selectedEndOffice) {
      if (directionModeType === 'route') {
        fetchRoute(selectedStartOffice, selectedEndOffice);
      } else {
        calculateStraightLine(selectedStartOffice, selectedEndOffice);
      }
    }
  }, [directionModeType, directionMode, selectedStartOffice, selectedEndOffice, fetchRoute, calculateStraightLine]);

  // Clear direction selections when direction mode is disabled
  useEffect(() => {
    if (!directionMode) {
      setSelectedStartOffice(null);
      setSelectedEndOffice(null);
      setRoutePolyline(null);
      setStraightLineCoords(null);
      setDistanceInfo(null);
    }
  }, [directionMode]);

  // Function to show administrative planning report in dialog
  const handleShowPlanningReport = useCallback(() => {
    try {
      const options = {
        useManagementRadiusForA: useManagementRadiusForHiding,
        layerAUrbanReceptionRadius,
        layerASuburbanReceptionRadius,
        layerAUrbanManagementRadius,
        layerASuburbanManagementRadius,
        layerBRadius,
        layerCRadius
      };

      const planningReport = generateAdministrativePlanningReport(options);
      setPlanningReportData(planningReport);
      setShowPlanningReportDialog(true);
    } catch (error) {
      console.error('Error generating planning report:', error);
      toast.error('Lỗi khi tạo báo cáo quy hoạch');
    }
  }, [
    useManagementRadiusForHiding,
    layerAUrbanReceptionRadius,
    layerASuburbanReceptionRadius,
    layerAUrbanManagementRadius,
    layerASuburbanManagementRadius,
    layerBRadius,
    layerCRadius
  ]);

  // Function to download planning report as Excel from dialog
  const handleDownloadPlanningReportExcel = useCallback(() => {
    if (!planningReportData) return;

    try {
      // Use the exportData from the planning report which contains the actual office arrays
      const layerAData = planningReportData.exportData.finalLayerA;
      const layerBData = planningReportData.exportData.finalLayerB;
      const layerCData = planningReportData.exportData.finalLayerC;

      downloadAllLayersAsExcel(
        layerAData,
        layerBData, 
        layerCData,
        customOffices,
        editedOffices,
        deletedOfficeIds,
        generateFilename('danang-administrative-planning-report')
      );
      
      toast.success('Tải xuống báo cáo Excel thành công');
    } catch (error) {
      console.error('Error downloading planning report as Excel:', error);
      toast.error('Lỗi khi tải xuống báo cáo Excel');
    }
  }, [
    planningReportData,
    customOffices,
    editedOffices,
    deletedOfficeIds
  ]);

  // Download handlers for planning and executive reports
  const handleDownloadAdministrativePlanningReport = useCallback(() => {
    try {
      const options = {
        useManagementRadiusForA: useManagementRadiusForHiding,
        layerAUrbanReceptionRadius,
        layerASuburbanReceptionRadius,
        layerAUrbanManagementRadius,
        layerASuburbanManagementRadius,
        layerBRadius,
        layerCRadius
      };

      const planningReport = generateAdministrativePlanningReport(options);
      setDetailedPlanningData(planningReport);
      setShowDetailedPlanningDialog(true);
    } catch (error) {
      console.error('Error generating detailed planning report:', error);
      toast.error('Lỗi khi tạo báo cáo quy hoạch chi tiết');
    }
  }, [
    useManagementRadiusForHiding,
    layerAUrbanReceptionRadius,
    layerASuburbanReceptionRadius,
    layerAUrbanManagementRadius,
    layerASuburbanManagementRadius,
    layerBRadius,
    layerCRadius
  ]);

  const handleDownloadExecutiveSummary = useCallback(() => {
    try {
      const options = {
        useManagementRadiusForA: useManagementRadiusForHiding,
        layerAUrbanReceptionRadius,
        layerASuburbanReceptionRadius,
        layerAUrbanManagementRadius,
        layerASuburbanManagementRadius,
        layerBRadius,
        layerCRadius
      };

      const executiveReport = generateExecutiveReport(options);
      setExecutiveSummaryData(executiveReport);
      setShowExecutiveSummaryDialog(true);
    } catch (error) {
      console.error('Error generating executive summary:', error);
      toast.error('Lỗi khi tạo báo cáo tóm tắt');
    }
  }, [
    useManagementRadiusForHiding,
    layerAUrbanReceptionRadius,
    layerASuburbanReceptionRadius,
    layerAUrbanManagementRadius,
    layerASuburbanManagementRadius,
    layerBRadius,
    layerCRadius
  ]);

  // Download handlers for layer data
  const handleDownloadLayerAsJSON = useCallback((layer: 'A' | 'B' | 'C') => {
    try {
      const layerData = getVisibleAdministrativeOffices()
        .filter((office: AdministrativeOffice) => office.layer === layer);
      
      downloadAsJSON(layerData, generateFilename(`danang-layer-${layer.toLowerCase()}`));
      toast.success(`Tải xuống dữ liệu Lớp ${layer} thành công`);
    } catch (error) {
      console.error(`Error downloading Layer ${layer} as JSON:`, error);
      toast.error(`Lỗi khi tải xuống dữ liệu Lớp ${layer}`);
    }
  }, [getVisibleAdministrativeOffices]);

  const handleDownloadLayerAsExcel = useCallback((layer: 'A' | 'B' | 'C') => {
    try {
      const layerData = getVisibleAdministrativeOffices()
        .filter((office: AdministrativeOffice) => office.layer === layer);
      
      downloadAsExcel(layerData, generateFilename(`danang-layer-${layer.toLowerCase()}`), `Lớp ${layer}`);
      toast.success(`Tải xuống Excel Lớp ${layer} thành công`);
    } catch (error) {
      console.error(`Error downloading Layer ${layer} as Excel:`, error);
      toast.error(`Lỗi khi tải xuống Excel Lớp ${layer}`);
    }
  }, [getVisibleAdministrativeOffices]);

  const handleDownloadAllLayersAsJSON = useCallback(() => {
    try {
      const allData = {
        layerA: getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'A'),
        layerB: getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'B'),
        layerC: getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'C'),
        customOffices: customOffices,
        metadata: {
          exportDate: new Date().toISOString(),
          totalOffices: getVisibleAdministrativeOffices().length,
          editedOffices: editedOffices.size,
          deletedOffices: deletedOfficeIds.size
        }
      };
      
      downloadAsJSON(allData, generateFilename('danang-all-administrative-layers'));
      toast.success('Tải xuống tất cả dữ liệu thành công');
    } catch (error) {
      console.error('Error downloading all layers as JSON:', error);
      toast.error('Lỗi khi tải xuống tất cả dữ liệu');
    }
  }, [getVisibleAdministrativeOffices, customOffices, editedOffices, deletedOfficeIds]);

  const handleDownloadAllLayersAsExcel = useCallback(() => {
    try {
      const layerAData = getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'A');
      const layerBData = getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'B');
      const layerCData = getVisibleAdministrativeOffices().filter((office: AdministrativeOffice) => office.layer === 'C');
      
      downloadAllLayersAsExcel(
        layerAData,
        layerBData,
        layerCData,
        customOffices,
        editedOffices,
        deletedOfficeIds,
        generateFilename('danang-all-administrative-layers')
      );
      
      toast.success('Tải xuống Excel tất cả lớp thành công');
    } catch (error) {
      console.error('Error downloading all layers as Excel:', error);
      toast.error('Lỗi khi tải xuống Excel tất cả lớp');
    }
  }, [getVisibleAdministrativeOffices, customOffices, editedOffices, deletedOfficeIds]);

  // ================================
  // END DOWNLOAD HANDLERS
  // ================================
  if (isMapLoading) {
    return <LoadingScreen message="Đang tải dữ liệu bản đồ..." />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <AppSidebar
          onGetUserLocation={handleGetUserLocation}
          isLocating={isLocating}
          selectedWard={selectedWard}
          onWardSelect={handlePolygonClick}
          danangPolygons={danangPolygons as PolygonData[]}
        />

        <SidebarInset className="flex-1 h-full m-0 rounded-none shadow-none">
          <div className="flex h-full w-full relative">
            {/* Header with sidebar trigger */}
            <div className="fixed md:absolute top-4 left-4 z-50">
              <SidebarTrigger
                className={`
                  cursor-pointer bg-white/95 backdrop-blur-md shadow-lg hover:bg-white border border-gray-200/50
                  transition-all duration-200 ease-in-out hover:shadow-xl
                  h-10 rounded-xl
                  hover:scale-105 active:scale-95 group
                `}
                label="Tra cứu"
                showLabel={true}
                animatePulse={true}
              />
            </div>

            {/* Main Map */}
            <APIProvider apiKey={apiKey} language="vi" region="VN">
              <ZoomAwareMap
                id="danang-map"
                defaultCenter={DA_NANG_CENTER}
                defaultZoom={10}
                mapId="8edea94d65887b5c9697477e"
                onClick={handleMapClick}
                className="w-full h-full"
                disableDefaultUI={true}
                onZoomChange={setZoomLevel}
                initialBounds={danangBounds}
                useDefaultZoom={true} // Use default zoom level to ensure boundaries are shown
                mapTypeId={mapType}
              >
                {/* Whole city polygon (shown when zoom < ZOOM_THRESHOLD) - non-interactive */}
                {zoomLevel < ZOOM_THRESHOLD && (
                  <PolygonOverlay
                    polygons={[wholeDanangPolygon]}
                    visible={showPolygons}
                    selectedPolygon={selectedWard}
                    onPolygonClick={handlePolygonClick}
                    onPolygonClickInEditMode={handlePolygonClickInEditMode}
                    onUnselectWard={clearSelectedWard}
                    interactive={false} // Make the whole city polygon non-interactive
                    zoomThreshold={ZOOM_THRESHOLD}
                    neutralMode={neutralPolygonMode}
                    directionMode={directionMode}
                    editMode={editMode}
                  />
                )}

                {/* Detailed ward polygons (shown when zoom >= ZOOM_THRESHOLD) */}
                {zoomLevel >= ZOOM_THRESHOLD && (
                  <PolygonOverlay
                    polygons={danangPolygons as PolygonData[]}
                    visible={showPolygons}
                    selectedPolygon={selectedWard}
                    onPolygonClick={handlePolygonClick}
                    onPolygonClickInEditMode={handlePolygonClickInEditMode}
                    onUnselectWard={clearSelectedWard}
                    zoomThreshold={ZOOM_THRESHOLD}
                    neutralMode={neutralPolygonMode}
                    directionMode={directionMode}
                    editMode={editMode}
                  />
                )}

                {/* Ward name labels (shown consistently when zoom >= 11) */}
                <WardLabelsOverlay
                  polygons={danangPolygons as PolygonData[]}
                  visible={showPolygons}
                  zoomLevel={zoomLevel}
                  zoomThreshold={10} // Fixed value of 11 to ensure consistent behavior
                  directionMode={directionMode}
                />

                {/* Office markers (only visible at higher zoom levels) */}
                <OfficeMarkers
                  offices={offices}
                  visible={false}
                  selectedWard={selectedWard}
                  userLocation={userLocation}
                />

                {/* Administrative offices with service coverage circles */}
                <AdministrativeOffices
                  offices={getVisibleAdministrativeOffices()}
                  visible={true}
                  showCircles={showCircles}
                  userLocation={userLocation}
                  directionMode={directionMode}
                  selectedStartOffice={selectedStartOffice}
                  selectedEndOffice={selectedEndOffice}
                  isLoadingRoute={isLoadingRoute}
                  onOfficeClick={handleOfficeClick}
                  editMode={editMode}
                  onMarkerDrag={handleMarkerDrag}
                  onMarkerDelete={handleMarkerDelete}
                  onOfficeEdit={handleOfficeEdit}
                  hideLayerBWithinA={hideLayerBWithinA}
                  useManagementRadiusForHiding={useManagementRadiusForHiding}
                  hideLayerCWithinA={hideLayerCWithinA}
                  hideLayerCWithinB={hideLayerCWithinB}
                  useManagementRadiusForLayerC={useManagementRadiusForLayerC}
                  fillOpacity={fillOpacity}
                />

                {/* User location marker */}
                {userLocation && (
                  <UserLocationMarker position={userLocation} />
                )}

                {/* Map Header */}
                <MapHeader />

                {/* Map Footer */}
                <MapFooter />

                {/* Direction route polyline - Rendered last for highest z-index */}
                {directionMode && (
                  <>
                    {/* Route polyline (from OSRM API) */}
                    {routePolyline && (
                      <>
                        {/* Shadow/glow effect for the route */}
                        <Polyline
                          encodedPath={routePolyline}
                          strokeColor="#1D4ED8"
                          strokeOpacity={0.3}
                          strokeWeight={12}
                          zIndex={9998}
                        />
                        {/* Main route line */}
                        <Polyline
                          encodedPath={routePolyline}
                          strokeColor="#1D4ED8"
                          strokeOpacity={1.0}
                          strokeWeight={6}
                          zIndex={9999}
                        />
                      </>
                    )}
                    
                    {/* Straight line polyline (calculated coordinates) */}
                    {straightLineCoords && (
                      <>
                        {/* Shadow/glow effect for straight line */}
                        <Polyline
                          path={straightLineCoords}
                          strokeColor="#DC2626"
                          strokeOpacity={0.3}
                          strokeWeight={6}
                          zIndex={9998}
                        />
                        {/* Main straight line */}
                        <Polyline
                          path={straightLineCoords}
                          strokeColor="#DC2626"
                          strokeOpacity={1.0}
                          strokeWeight={3}
                          zIndex={9999}
                        />
                      </>
                    )}
                  </>
                )}
              </ZoomAwareMap>

              {/* Map Controls */}
              <MapControls
                showPolygons={showPolygons}
                onTogglePolygons={setShowPolygons}
                onGetUserLocation={handleGetUserLocation}
                isLocating={isLocating}
                showLayerA={showLayerA}
                showLayerB={showLayerB}
                showLayerC={showLayerC}
                showCircles={showCircles}
                onToggleLayerA={setShowLayerA}
                onToggleLayerB={setShowLayerB}
                onToggleLayerC={setShowLayerC}
                onToggleCircles={setShowCircles}
                layerAUrbanReceptionRadius={layerAUrbanReceptionRadius}
                layerASuburbanReceptionRadius={layerASuburbanReceptionRadius}
                layerAUrbanManagementRadius={layerAUrbanManagementRadius}
                layerASuburbanManagementRadius={layerASuburbanManagementRadius}
                layerBRadius={layerBRadius}
                layerCRadius={layerCRadius}
                onLayerAUrbanReceptionRadiusChange={setLayerAUrbanReceptionRadius}
                onLayerASuburbanReceptionRadiusChange={setLayerASuburbanReceptionRadius}
                onLayerAUrbanManagementRadiusChange={setLayerAUrbanManagementRadius}
                onLayerASuburbanManagementRadiusChange={setLayerASuburbanManagementRadius}
                onLayerBRadiusChange={setLayerBRadius}
                onLayerCRadiusChange={setLayerCRadius}
                hideLayerBWithinA={hideLayerBWithinA}
                onToggleHideLayerBWithinA={setHideLayerBWithinA}
                useManagementRadiusForHiding={useManagementRadiusForHiding}
                onToggleUseManagementRadiusForHiding={setUseManagementRadiusForHiding}
                layerBWithinACount={getLayerBWithinAInfo().count}
                hideLayerCWithinA={hideLayerCWithinA}
                onToggleHideLayerCWithinA={setHideLayerCWithinA}
                hideLayerCWithinB={hideLayerCWithinB}
                onToggleHideLayerCWithinB={setHideLayerCWithinB}
                useManagementRadiusForLayerC={useManagementRadiusForLayerC}
                onToggleUseManagementRadiusForLayerC={setUseManagementRadiusForLayerC}
                layerCWithinACount={getLayerCWithinABInfo().countA}
                layerCWithinBCount={getLayerCWithinABInfo().countB}
                neutralPolygonMode={neutralPolygonMode}
                onToggleNeutralPolygonMode={setNeutralPolygonMode}
                mapType={mapType}
                onMapTypeChange={setMapType}
                directionMode={directionMode}
                onToggleDirectionMode={setDirectionMode}
                directionModeType={directionModeType}
                onDirectionModeTypeChange={setDirectionModeType}
                distanceInfo={distanceInfo}
                editMode={editMode}
                onToggleEditMode={setEditMode}
                selectedLayerForAdd={selectedLayerForAdd}
                onSelectedLayerForAddChange={setSelectedLayerForAdd}
                onDownloadLayerAsJSON={handleDownloadLayerAsJSON}
                onDownloadLayerAsExcel={handleDownloadLayerAsExcel}
                onDownloadAllLayersAsJSON={handleDownloadAllLayersAsJSON}
                onDownloadAllLayersAsExcel={handleDownloadAllLayersAsExcel}
                onDownloadAdministrativePlanningReport={handleDownloadAdministrativePlanningReport}
                onDownloadExecutiveSummary={handleDownloadExecutiveSummary}
                onShowPlanningReport={handleShowPlanningReport}
                fillOpacity={fillOpacity}
                onFillOpacityChange={setFillOpacity}
                showAboutDialog={showAboutDialog}
                onToggleAboutDialog={setShowAboutDialog}
              />

              {/* Selected Ward Info Card/Drawer */}
              <SelectedWardInfo
                selectedWard={selectedWard}
                onClose={clearSelectedWard}
                userLocation={userLocation}
              />
            </APIProvider>
          </div>
        </SidebarInset>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa trụ sở</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn ẩn trụ sở "{deleteConfirmDialog.office?.name}" khỏi bản đồ không?
              <br /><br />
              <strong>Lưu ý:</strong> Hành động này sẽ ẩn trụ sở gốc khỏi bản đồ. Bạn có thể khôi phục lại bằng cách tắt và bật lại chế độ chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmDialog.office && handleConfirmDeleteOriginalOffice(deleteConfirmDialog.office)}
            >
              Ẩn trụ sở
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Administrative Planning Report Dialog */}
      <Dialog open={showPlanningReportDialog} onOpenChange={setShowPlanningReportDialog}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto w-full min-w-[1200px]">
          <DialogHeader>
            <DialogTitle>Báo cáo Quy hoạch Hành chính Đà Nẵng</DialogTitle>
            <DialogDescription>
              Báo cáo chi tiết về việc tối ưu hóa mạng lưới điểm phục vụ hành chính trên địa bàn thành phố Đà Nẵng
            </DialogDescription>
          </DialogHeader>
          
          {planningReportData && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tóm tắt điều hành</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Điểm ban đầu</h4>
                    <p className="text-2xl font-bold text-blue-700">{planningReportData.executiveSummary.totalOriginalPoints}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">Điểm cuối cùng</h4>
                    <p className="text-2xl font-bold text-green-700">{planningReportData.executiveSummary.totalFinalPoints}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900">Tỷ lệ giảm</h4>
                    <p className="text-2xl font-bold text-orange-700">{planningReportData.executiveSummary.reductionPercentage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Layer Summary Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tóm tắt theo lớp</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lớp</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Mô tả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Lớp A</TableCell>
                      <TableCell>{planningReportData.executiveSummary.layerSummary.layerA.count}</TableCell>
                      <TableCell>{planningReportData.executiveSummary.layerSummary.layerA.status}</TableCell>
                      <TableCell>{planningReportData.executiveSummary.layerSummary.layerA.description}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lớp B</TableCell>
                      <TableCell>
                        {planningReportData.executiveSummary.layerSummary.layerB.remaining} 
                        (từ {planningReportData.executiveSummary.layerSummary.layerB.original})
                      </TableCell>
                      <TableCell>
                        Giảm {planningReportData.executiveSummary.layerSummary.layerB.reductionPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>{planningReportData.executiveSummary.layerSummary.layerB.description}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lớp C</TableCell>
                      <TableCell>
                        {planningReportData.executiveSummary.layerSummary.layerC.remaining} 
                        (từ {planningReportData.executiveSummary.layerSummary.layerC.original})
                      </TableCell>
                      <TableCell>
                        Giảm {planningReportData.executiveSummary.layerSummary.layerC.reductionPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>{planningReportData.executiveSummary.layerSummary.layerC.description}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Action Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Kế hoạch hành động</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Ngay lập tức</h4>
                    <ul className="text-sm space-y-1">
                      {planningReportData.actionItems.immediate.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-700">Ngắn hạn</h4>
                    <ul className="text-sm space-y-1">
                      {planningReportData.actionItems.shortTerm.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700">Dài hạn</h4>
                    <ul className="text-sm space-y-1">
                      {planningReportData.actionItems.longTerm.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPlanningReportDialog(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={handleDownloadPlanningReportExcel}
              disabled={!planningReportData}
            >
              Tải xuống Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Executive Summary Dialog */}
      <Dialog open={showExecutiveSummaryDialog} onOpenChange={setShowExecutiveSummaryDialog}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto w-full min-w-[1200px]">
          <DialogHeader>
            <DialogTitle>Tóm tắt Điều hành - Quy hoạch Hành chính Đà Nẵng</DialogTitle>
            <DialogDescription>
              Báo cáo tóm tắt cho lãnh đạo về việc tối ưu hóa mạng lưới điểm phục vụ hành chính
            </DialogDescription>
          </DialogHeader>
          
          {executiveSummaryData && (
            <div className="space-y-8">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 text-lg">Tổng điểm ban đầu</h4>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {executiveSummaryData.reportText.match(/Tổng điểm ban đầu: (\d+)/)?.[1] || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">Trước khi tối ưu hóa</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 text-lg">Tổng điểm sau tối ưu</h4>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {executiveSummaryData.reportText.match(/Tổng điểm sau tối ưu: (\d+)/)?.[1] || 'N/A'}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Sau loại bỏ trùng lặp</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 text-lg">Tỷ lệ giảm</h4>
                  <p className="text-3xl font-bold text-orange-700 mt-2">
                    {executiveSummaryData.reportText.match(/Giảm thiểu: ([\d.]+)%/)?.[1] || 'N/A'}%
                  </p>
                  <p className="text-sm text-orange-600 mt-1">Loại bỏ trùng lặp</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 text-lg">Điểm tiết kiệm</h4>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {(() => {
                      const initial = parseInt(executiveSummaryData.reportText.match(/Tổng điểm ban đầu: (\d+)/)?.[1] || '0');
                      const final = parseInt(executiveSummaryData.reportText.match(/Tổng điểm sau tối ưu: (\d+)/)?.[1] || '0');
                      return initial - final;
                    })()}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">Số điểm loại bỏ</p>
                </div>
              </div>

              {/* Layer Summary Table */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Thống kê chi tiết theo lớp dịch vụ</h3>
                <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="min-w-[140px] font-semibold text-gray-900">Lớp dịch vụ</TableHead>
                        <TableHead className="min-w-[120px] text-center font-semibold text-gray-900">Ban đầu</TableHead>
                        <TableHead className="min-w-[120px] text-center font-semibold text-gray-900">Loại bỏ</TableHead>
                        <TableHead className="min-w-[120px] text-center font-semibold text-gray-900">Còn lại</TableHead>
                        <TableHead className="min-w-[140px] text-center font-semibold text-gray-900">Tỷ lệ giảm</TableHead>
                        <TableHead className="min-w-[350px] font-semibold text-gray-900">Mô tả chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {/* Parse the statistics table and create rows */}
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium bg-red-50 border-l-4 border-red-500">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="font-semibold text-red-800">Lớp A</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{executiveSummaryData.reportText.match(/Lớp A - Chi Nhánh Cấp Quận\/Huyện \((\d+) điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium">0</TableCell>
                      <TableCell className="text-center font-semibold text-green-600">{executiveSummaryData.reportText.match(/Lớp A - Chi Nhánh Cấp Quận\/Huyện \((\d+) điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium text-green-600">0%</TableCell>
                      <TableCell className="text-gray-700">Chi nhánh cấp Quận/Huyện (cố định - không thay đổi)</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium bg-blue-50 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="font-semibold text-blue-800">Lớp B</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{executiveSummaryData.reportText.match(/Lớp B - Trung Tâm Cấp Xã\/Phường \(\d+\/(\d+) điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium text-red-600">{executiveSummaryData.reportText.match(/Loại bỏ: (\d+) điểm/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-semibold text-green-600">{executiveSummaryData.reportText.match(/Lớp B - Trung Tâm Cấp Xã\/Phường \((\d+)\/\d+ điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium text-orange-600">{executiveSummaryData.reportText.match(/\((\d+\.?\d*)%\)/)?.[1] || 'N/A'}%</TableCell>
                      <TableCell className="text-gray-700">Trung tâm cấp Xã/Phường (sau loại trừ trùng lặp với Lớp A)</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="font-medium bg-yellow-50 border-l-4 border-yellow-500">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                          <span className="font-semibold text-yellow-800">Lớp C</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{executiveSummaryData.reportText.match(/Lớp C - Điểm Bưu Cục \(\d+\/(\d+) điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium text-red-600">{(() => {
                        const removedA = executiveSummaryData.reportText.match(/Loại bỏ do trùng Lớp A: (\d+) điểm/)?.[1] || '0';
                        const removedB = executiveSummaryData.reportText.match(/Loại bỏ do trùng Lớp B: (\d+) điểm/)?.[1] || '0';
                        return parseInt(removedA) + parseInt(removedB);
                      })()}</TableCell>
                      <TableCell className="text-center font-semibold text-green-600">{executiveSummaryData.reportText.match(/Lớp C - Điểm Bưu Cục \((\d+)\/\d+ điểm\)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-medium text-orange-600">{executiveSummaryData.reportText.match(/Lớp C.*?\((\d+\.?\d*)%\)/)?.[1] || 'N/A'}%</TableCell>
                      <TableCell className="text-gray-700">Điểm Bưu cục (chỉ vùng chưa được phủ bởi Lớp A và B)</TableCell>
                    </TableRow>
                    {/* Total Row */}
                    <TableRow className="bg-gray-100 font-semibold border-t-2">
                      <TableCell className="font-bold text-gray-900 border-l-4 border-gray-500">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                          <span>Tổng cộng</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-gray-900">{executiveSummaryData.reportText.match(/Tổng điểm ban đầu: (\d+)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-bold text-red-700">{(() => {
                        const initial = parseInt(executiveSummaryData.reportText.match(/Tổng điểm ban đầu: (\d+)/)?.[1] || '0');
                        const final = parseInt(executiveSummaryData.reportText.match(/Tổng điểm sau tối ưu: (\d+)/)?.[1] || '0');
                        return initial - final;
                      })()}</TableCell>
                      <TableCell className="text-center font-bold text-green-700">{executiveSummaryData.reportText.match(/Tổng điểm sau tối ưu: (\d+)/)?.[1] || 'N/A'}</TableCell>
                      <TableCell className="text-center font-bold text-orange-700">{executiveSummaryData.reportText.match(/Giảm thiểu: ([\d.]+)%/)?.[1] || 'N/A'}%</TableCell>
                      <TableCell className="font-bold text-gray-900">Toàn hệ thống sau tối ưu hóa</TableCell>
                    </TableRow>
                  </TableBody>
                  </Table>
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Kế hoạch triển khai chi tiết</h3>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Immediate Actions */}
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm">
                    <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      Việc cần làm ngay lập tức
                    </h4>
                    <div className="space-y-3">
                      {executiveSummaryData.implementationGuide.match(/## VIỆC CẦN LÀM NGAY\n\n(.*?)\n\n## VIỆC CẦN LÀM TRONG 3-6 THÁNG/s)?.[1]?.split('\n').filter(item => item.trim()).map((item, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm text-red-700 bg-white p-3 rounded border-l-4 border-red-400">
                          <span className="text-red-500 mt-1 font-bold text-lg">•</span>
                          <span className="font-medium leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      )) || []}
                    </div>
                  </div>

                  {/* Short-term Actions */}
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      Việc cần làm trong 3-6 tháng
                    </h4>
                    <div className="space-y-3">
                      {executiveSummaryData.implementationGuide.match(/## VIỆC CẦN LÀM TRONG 3-6 THÁNG\n\n(.*?)\n\n## VIỆC CẦN LÀM TRONG 6-12 THÁNG/s)?.[1]?.split('\n').filter(item => item.trim()).map((item, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm text-orange-700 bg-white p-3 rounded border-l-4 border-orange-400">
                          <span className="text-orange-500 mt-1 font-bold text-lg">•</span>
                          <span className="font-medium leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      )) || []}
                    </div>
                  </div>

                  {/* Long-term Actions */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      Việc cần làm trong 6-12 tháng
                    </h4>
                    <div className="space-y-3">
                      {executiveSummaryData.implementationGuide.match(/## VIỆC CẦN LÀM TRONG 6-12 THÁNG\n\n(.*?)\n\n## DANH SÁCH CHI TIẾT CẦN XUẤT RA EXCEL/s)?.[1]?.split('\n').filter(item => item.trim()).map((item, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm text-green-700 bg-white p-3 rounded border-l-4 border-green-400">
                          <span className="text-green-500 mt-1 font-bold text-lg">•</span>
                          <span className="font-medium leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      )) || []}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Notes */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                <h4 className="font-semibold text-blue-800 mb-4 text-xl flex items-center gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  Ghi chú quan trọng
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">📍</span>
                      <div>
                        <span className="font-semibold text-blue-800 block mb-1">Vị trí đặt Chi nhánh:</span>
                        <span className="text-blue-700 text-sm">Phải thuộc phường mới, nằm trong phạm vi quận/huyện cũ</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">🚫</span>
                      <div>
                        <span className="font-semibold text-blue-800 block mb-1">Tránh trùng lặp:</span>
                        <span className="text-blue-700 text-sm">Một địa điểm không thể vừa là Lớp A, vừa là Lớp B hoặc C</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">🎯</span>
                      <div>
                        <span className="font-semibold text-blue-800 block mb-1">Mục đích:</span>
                        <span className="text-blue-700 text-sm">Đảm bảo người dân không phải đi quá xa để làm thủ tục hành chính</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowExecutiveSummaryDialog(false)}
              className="min-w-[100px]"
            >
              Đóng
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (executiveSummaryData) {
                  const reportData = {
                    metadata: {
                      reportType: "Báo cáo Tóm tắt Điều hành - Hành chính Đà Nẵng",
                      generatedAt: new Date().toISOString(),
                    },
                    executiveSummary: executiveSummaryData
                  };

                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
                    type: 'application/json;charset=utf-8' 
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${generateFilename('danang-executive-summary')}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success('Tải xuống JSON thành công');
                }
              }}
              disabled={!executiveSummaryData}
              className="min-w-[140px]"
            >
              📊 Tải xuống JSON
            </Button>
            <Button
              onClick={() => {
                if (executiveSummaryData) {
                  const reportContent = `BÁNH CÁO TÓM TẮT - QUY HOẠCH HÀNH CHÍNH ĐÀ NẴNG
Generated: ${new Date().toLocaleString('vi-VN')}

${executiveSummaryData.reportText}

---

${executiveSummaryData.statisticsTable}

---

${executiveSummaryData.implementationGuide}
`;
                  const blob = new Blob([reportContent], { 
                    type: 'text/plain;charset=utf-8' 
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${generateFilename('danang-executive-summary')}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success('Tải xuống TXT thành công');
                }
              }}
              disabled={!executiveSummaryData}
              className="min-w-[140px]"
            >
              📄 Tải xuống TXT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Planning Report Dialog (for the Báo cáo quy hoạch chi tiết button) */}
      <Dialog open={showDetailedPlanningDialog} onOpenChange={setShowDetailedPlanningDialog}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-y-auto w-full min-w-[87vw]">
          <DialogHeader>
            <DialogTitle>Báo cáo Quy hoạch Chi tiết - Hành chính Đà Nẵng</DialogTitle>
            <DialogDescription>
              Báo cáo kỹ thuật chi tiết cho đội ngũ quy hoạch và phân tích, bao gồm dữ liệu thống kê và phân tích sâu
            </DialogDescription>
          </DialogHeader>
          
          {detailedPlanningData && (
            <div className="space-y-8">
              {/* Executive Summary Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Tóm tắt điều hành</h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                    <h4 className="font-semibold text-blue-900 text-lg">Điểm ban đầu</h4>
                    <p className="text-3xl font-bold text-blue-700 mt-2">{detailedPlanningData.executiveSummary.totalOriginalPoints}</p>
                    <p className="text-sm text-blue-600 mt-1">Tổng điểm trước tối ưu</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
                    <h4 className="font-semibold text-green-900 text-lg">Điểm cuối cùng</h4>
                    <p className="text-3xl font-bold text-green-700 mt-2">{detailedPlanningData.executiveSummary.totalFinalPoints}</p>
                    <p className="text-sm text-green-600 mt-1">Sau loại bỏ trùng lặp</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm">
                    <h4 className="font-semibold text-orange-900 text-lg">Tỷ lệ giảm</h4>
                    <p className="text-3xl font-bold text-orange-700 mt-2">{detailedPlanningData.executiveSummary.reductionPercentage.toFixed(1)}%</p>
                    <p className="text-sm text-orange-600 mt-1">Tỷ lệ tối ưu hóa</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 shadow-sm">
                    <h4 className="font-semibold text-purple-900 text-lg">Điểm tiết kiệm</h4>
                    <p className="text-3xl font-bold text-purple-700 mt-2">
                      {detailedPlanningData.executiveSummary.totalOriginalPoints - detailedPlanningData.executiveSummary.totalFinalPoints}
                    </p>
                    <p className="text-sm text-purple-600 mt-1">Số điểm loại bỏ</p>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Phân tích chi tiết theo từng lớp</h3>
                
                {/* Layer A Details */}
                <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm">
                  <h4 className="font-semibold text-red-900 mb-4 text-lg flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    Chi tiết Lớp A - Chi nhánh cấp Quận/Huyện
                  </h4>
                  <p className="text-sm text-red-700 mb-4 bg-white p-3 rounded border-l-4 border-red-400">
                    <strong>Tổng số:</strong> {detailedPlanningData.detailedAnalysis.layerADetails.totalBranches} chi nhánh
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {detailedPlanningData.detailedAnalysis.layerADetails.districtBreakdown.map((district, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                        <h5 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          {district.region} ({district.count} chi nhánh)
                        </h5>
                        <div className="space-y-2">
                          {district.branches.map((branch, branchIndex) => (
                            <div key={branchIndex} className="text-sm text-red-600 bg-red-25 p-2 rounded border-l-2 border-red-300">
                              <div className="font-medium">{branch.name}</div>
                              <div className="text-xs text-red-500 mt-1">
                                {branch.type} • {branch.address}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layer B Deduplication */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-4 text-lg flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    Loại trừ Lớp B - Trung tâm cấp Xã/Phường
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-semibold text-blue-800">Ban đầu</h5>
                      <p className="text-2xl font-bold text-blue-700">{detailedPlanningData.detailedAnalysis.layerBDeduplication.originalCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-semibold text-blue-800">Loại bỏ</h5>
                      <p className="text-2xl font-bold text-red-600">{detailedPlanningData.detailedAnalysis.layerBDeduplication.removedPoints.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                      <h5 className="font-semibold text-blue-800">Còn lại</h5>
                      <p className="text-2xl font-bold text-green-600">{detailedPlanningData.detailedAnalysis.layerBDeduplication.remainingPoints.length}</p>
                    </div>
                  </div>
                  
                  {detailedPlanningData.detailedAnalysis.layerBDeduplication.removedPoints.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-blue-800 mb-3 text-lg">Điểm bị loại bỏ:</h5>
                      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-900">Tên trung tâm</TableHead>
                              <TableHead className="font-semibold text-gray-900">Lý do loại bỏ</TableHead>
                              <TableHead className="font-semibold text-gray-900">Chi nhánh chứa</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center">Khoảng cách (km)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailedPlanningData.detailedAnalysis.layerBDeduplication.removedPoints.map((point, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{point.name}</TableCell>
                                <TableCell className="text-orange-600">{point.reason}</TableCell>
                                <TableCell className="text-blue-600">{point.containingBranch}</TableCell>
                                <TableCell className="text-center font-mono text-red-600">{point.distance.toFixed(1)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="font-semibold text-blue-800 mb-3 text-lg">Điểm được giữ lại:</h5>
                    <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-900">Tên trung tâm</TableHead>
                            <TableHead className="font-semibold text-gray-900">Địa chỉ</TableHead>
                            <TableHead className="font-semibold text-gray-900">Khu vực</TableHead>
                            <TableHead className="font-semibold text-gray-900">Phạm vi phủ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailedPlanningData.detailedAnalysis.layerBDeduplication.remainingPoints.map((point, index) => (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-green-700">{point.name}</TableCell>
                              <TableCell className="text-gray-600">{point.address}</TableCell>
                              <TableCell className="text-gray-600">{point.region}</TableCell>
                              <TableCell className="text-blue-600 font-medium">{point.coverage}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Layer C Optimization */}
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm">
                  <h4 className="font-semibold text-yellow-900 mb-4 text-lg flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    Tối ưu Lớp C - Điểm Bưu cục
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-yellow-100">
                      <h5 className="font-semibold text-yellow-800">Ban đầu</h5>
                      <p className="text-2xl font-bold text-yellow-700">{detailedPlanningData.detailedAnalysis.layerCOptimization.originalCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-100">
                      <h5 className="font-semibold text-yellow-800">Loại do Lớp A</h5>
                      <p className="text-2xl font-bold text-red-600">{detailedPlanningData.detailedAnalysis.layerCOptimization.removedDueToLayerA.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-100">
                      <h5 className="font-semibold text-yellow-800">Loại do Lớp B</h5>
                      <p className="text-2xl font-bold text-orange-600">{detailedPlanningData.detailedAnalysis.layerCOptimization.removedDueToLayerB.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-100">
                      <h5 className="font-semibold text-yellow-800">Khuyến nghị</h5>
                      <p className="text-2xl font-bold text-green-600">{detailedPlanningData.detailedAnalysis.layerCOptimization.recommendedPoints.length}</p>
                    </div>
                  </div>
                  
                  {detailedPlanningData.detailedAnalysis.layerCOptimization.recommendedPoints.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-yellow-800 mb-3 text-lg">Điểm được khuyến nghị giữ lại:</h5>
                      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-900">Tên điểm Bưu cục</TableHead>
                              <TableHead className="font-semibold text-gray-900">Địa chỉ</TableHead>
                              <TableHead className="font-semibold text-gray-900">Lý do khuyến nghị</TableHead>
                              <TableHead className="font-semibold text-gray-900">Phạm vi phủ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailedPlanningData.detailedAnalysis.layerCOptimization.recommendedPoints.map((point, index) => (
                              <TableRow key={index} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-green-700">{point.name}</TableCell>
                                <TableCell className="text-gray-600">{point.address}</TableCell>
                                <TableCell className="text-yellow-700 font-medium">{point.justification}</TableCell>
                                <TableCell className="text-blue-600 font-medium">{point.coverage}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-500 rounded-full"></div>
                  Kế hoạch hành động
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm">
                    <h4 className="font-semibold text-red-800 mb-4 text-lg flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      Ngay lập tức
                    </h4>
                    <ul className="space-y-3">
                      {detailedPlanningData.actionItems.immediate.map((item, index) => (
                        <li key={index} className="bg-white p-3 rounded-md border border-red-100 shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="text-red-500 font-bold text-lg leading-none">•</span>
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm">
                    <h4 className="font-semibold text-orange-800 mb-4 text-lg flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                      Ngắn hạn
                    </h4>
                    <ul className="space-y-3">
                      {detailedPlanningData.actionItems.shortTerm.map((item, index) => (
                        <li key={index} className="bg-white p-3 rounded-md border border-orange-100 shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="text-orange-500 font-bold text-lg leading-none">•</span>
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
                    <h4 className="font-semibold text-green-800 mb-4 text-lg flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Dài hạn
                    </h4>
                    <ul className="space-y-3">
                      {detailedPlanningData.actionItems.longTerm.map((item, index) => (
                        <li key={index} className="bg-white p-3 rounded-md border border-green-100 shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-lg leading-none">•</span>
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDetailedPlanningDialog(false)}
            >
              Đóng
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (detailedPlanningData) {
                  const txtContent = `BÁOCÁO QUY HOẠCH CHI TIẾT - HÀNH CHÍNH ĐÀ NẴNG
Thời gian tạo: ${new Date().toLocaleString('vi-VN')}

=== TÓM TẮT ĐIỀU HÀNH ===
- Tổng điểm ban đầu: ${detailedPlanningData.executiveSummary.totalOriginalPoints}
- Tổng điểm cuối cùng: ${detailedPlanningData.executiveSummary.totalFinalPoints}
- Tỷ lệ giảm: ${detailedPlanningData.executiveSummary.reductionPercentage.toFixed(1)}%
- Điểm tiết kiệm: ${detailedPlanningData.executiveSummary.totalOriginalPoints - detailedPlanningData.executiveSummary.totalFinalPoints}

=== PHÂN TÍCH CHI TIẾT ===

LỚP A - CHI NHÁNH CẤP QUẬN/HUYỆN:
Tổng số: ${detailedPlanningData.detailedAnalysis.layerADetails.totalBranches} chi nhánh

${detailedPlanningData.detailedAnalysis.layerADetails.districtBreakdown.map(district => 
  `${district.region} (${district.count} chi nhánh):
${district.branches.map(branch => `  - ${branch.name} (${branch.type}) - ${branch.address}`).join('\n')}`
).join('\n\n')}

LỚP B - TRUNG TÂM CẤP XÃ/PHƯỜNG:
- Ban đầu: ${detailedPlanningData.detailedAnalysis.layerBDeduplication.originalCount}
- Loại bỏ: ${detailedPlanningData.detailedAnalysis.layerBDeduplication.removedPoints.length}
- Còn lại: ${detailedPlanningData.detailedAnalysis.layerBDeduplication.remainingPoints.length}

Điểm bị loại bỏ:
${detailedPlanningData.detailedAnalysis.layerBDeduplication.removedPoints.map(point => 
  `- ${point.name}: ${point.reason} (${point.distance.toFixed(1)}km từ ${point.containingBranch})`
).join('\n')}

Điểm được giữ lại:
${detailedPlanningData.detailedAnalysis.layerBDeduplication.remainingPoints.map(point => 
  `- ${point.name} - ${point.address} (${point.region})`
).join('\n')}

LỚP C - ĐIỂM BƯU CỤC:
- Ban đầu: ${detailedPlanningData.detailedAnalysis.layerCOptimization.originalCount}
- Loại do Lớp A: ${detailedPlanningData.detailedAnalysis.layerCOptimization.removedDueToLayerA.length}
- Loại do Lớp B: ${detailedPlanningData.detailedAnalysis.layerCOptimization.removedDueToLayerB.length}
- Khuyến nghị: ${detailedPlanningData.detailedAnalysis.layerCOptimization.recommendedPoints.length}

Điểm được khuyến nghị:
${detailedPlanningData.detailedAnalysis.layerCOptimization.recommendedPoints.map(point => 
  `- ${point.name} - ${point.address}: ${point.justification}`
).join('\n')}

=== KẾ HOẠCH HÀNH ĐỘNG ===

NGAY LẬP TỨC:
${detailedPlanningData.actionItems.immediate.map(item => `- ${item}`).join('\n')}

NGẮN HẠN:
${detailedPlanningData.actionItems.shortTerm.map(item => `- ${item}`).join('\n')}

DÀI HẠN:
${detailedPlanningData.actionItems.longTerm.map(item => `- ${item}`).join('\n')}
`;

                  const blob = new Blob([txtContent], { 
                    type: 'text/plain;charset=utf-8' 
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${generateFilename('danang-detailed-planning-report')}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success('Tải xuống báo cáo TXT thành công');
                }
              }}
              disabled={!detailedPlanningData}
            >
              Tải xuống TXT
            </Button>
            <Button
              onClick={() => {
                if (detailedPlanningData) {
                  const reportData = {
                    metadata: {
                      reportType: "Báo cáo Quy hoạch Chi tiết Hành chính Đà Nẵng",
                      generatedAt: new Date().toISOString(),
                    },
                    ...detailedPlanningData
                  };

                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
                    type: 'application/json;charset=utf-8' 
                  });
                  
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${generateFilename('danang-detailed-planning-report')}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success('Tải xuống báo cáo chi tiết thành công');
                }
              }}
              disabled={!detailedPlanningData}
            >
              Tải xuống JSON
            </Button>
            <Button
              onClick={() => {
                if (detailedPlanningData) {
                  const layerAData = detailedPlanningData.exportData.finalLayerA;
                  const layerBData = detailedPlanningData.exportData.finalLayerB;
                  const layerCData = detailedPlanningData.exportData.finalLayerC;

                  downloadAllLayersAsExcel(
                    layerAData,
                    layerBData, 
                    layerCData,
                    customOffices,
                    editedOffices,
                    deletedOfficeIds,
                    generateFilename('danang-detailed-planning-report')
                  );
                  
                  toast.success('Tải xuống báo cáo Excel thành công');
                }
              }}
              disabled={!detailedPlanningData}
            >
              Tải xuống Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
