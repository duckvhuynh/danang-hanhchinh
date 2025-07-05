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
  const [layerAReceptionRadius, setLayerAReceptionRadius] = useState(5); // Layer A reception radius (default 5km)
  const [layerAManagementRadius, setLayerAManagementRadius] = useState(15); // Layer A management radius (default 15km)
  const [layerBUrbanRadius, setLayerBUrbanRadius] = useState(3); // Layer B urban radius (default 3km)
  const [layerBSuburbanRadius, setLayerBSuburbanRadius] = useState(8); // Layer B suburban radius (default 8km)
  const [layerCRadius, setLayerCRadius] = useState(5); // Default 5km

  // Fill opacity state
  const [fillOpacity, setFillOpacity] = useState(0.3); // Default 30% opacity

  // Layer B within Layer A control state
  const [hideLayerBWithinA, setHideLayerBWithinA] = useState(false); // Option to hide/dim Layer B within Layer A
  const [useManagementRadiusForHiding, setUseManagementRadiusForHiding] = useState(true); // Use management vs reception radius

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
  
  // Confirmation dialog state
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    office: AdministrativeOffice | null;
  }>({ isOpen: false, office: null });

  // New state for zoom level and city boundary
  const [zoomLevel, setZoomLevel] = useState<number>(11); // Start with a zoom level to show all administrative boundaries
  const [wholeDanangPolygon] = useState<PolygonData>(getWholeDanangPolygon());
  const [danangBounds] = useState(getWholeDanangBounds());
  
  // About dialog state
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // This effect ensures the selectedWard variable is used
  useEffect(() => {
    console.log("Selected ward updated:", selectedWard?.ward || "None");
  }, [selectedWard]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

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
            ? layerAReceptionRadius // Default to reception radius for Layer A
            : selectedLayerForAdd === 'B'
            ? layerBUrbanRadius // Default to urban radius for Layer B
            : layerCRadius, // Layer C uses single radius
          // Add Layer A specific radii if applicable
          ...(selectedLayerForAdd === 'A' && {
            receptionRadius: layerAReceptionRadius,
            managementRadius: layerAManagementRadius,
          }),
          // Add Layer B type if applicable (default to urban)
          ...(selectedLayerForAdd === 'B' && {
            type: 'urban' as const,
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
  }, [zoomLevel, editMode, selectedLayerForAdd, layerAReceptionRadius, layerAManagementRadius, layerBUrbanRadius, layerCRadius]);

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
          return editedOffice || {
            ...office,
            receptionRadius: layerAReceptionRadius,
            managementRadius: layerAManagementRadius,
            radius: layerAReceptionRadius, // Primary radius for Layer A is reception radius
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
          
          // Apply radius based on office type
          const radius = office.type === 'urban' ? layerBUrbanRadius : 
                        office.type === 'suburban' ? layerBSuburbanRadius : 5;
          
          return {
            ...office,
            radius: radius
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
  }, [showLayerA, showLayerB, showLayerC, layerAReceptionRadius, layerAManagementRadius, layerBUrbanRadius, layerBSuburbanRadius, layerCRadius, customOffices, editedOffices, deletedOfficeIds]);

  // Calculate Layer B offices within Layer A circles
  const getLayerBWithinAInfo = useCallback(() => {
    if (!showLayerA || !showLayerB) {
      return { count: 0, withinOffices: [], outsideOffices: [] };
    }

    const layerAOffices = getOfficesByLayer('A')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        return editedOffice || {
          ...office,
          receptionRadius: layerAReceptionRadius,
          managementRadius: layerAManagementRadius,
          radius: layerAReceptionRadius,
        };
      });

    const layerBOffices = getOfficesByLayer('B')
      .filter(office => !deletedOfficeIds.has(office.id))
      .map(office => {
        const editedOffice = editedOffices.get(office.id);
        if (editedOffice) {
          return editedOffice;
        }
        
        // Apply radius based on office type
        const radius = office.type === 'urban' ? layerBUrbanRadius : 
                      office.type === 'suburban' ? layerBSuburbanRadius : 5;
        
        return {
          ...office,
          radius: radius
        };
      });

    // Import the categorization function
    const result = categorizeLayerBOffices(layerBOffices, layerAOffices, useManagementRadiusForHiding);
    
    return {
      count: result.withinLayerA.length,
      withinOffices: result.withinLayerA,
      outsideOffices: result.outsideLayerA
    };
  }, [showLayerA, showLayerB, layerAReceptionRadius, layerAManagementRadius, layerBUrbanRadius, layerBSuburbanRadius, deletedOfficeIds, editedOffices, useManagementRadiusForHiding]);

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

  // Download handlers for edit mode
  const handleDownloadLayerAsJSON = useCallback((layer: 'A' | 'B' | 'C') => {
    const layerData = getVisibleAdministrativeOffices().filter(office => office.layer === layer);
    const filename = generateFilename(`danang_tru_so_lop_${layer}`);
    downloadAsJSON(layerData, filename);
    
    toast.success(`Đã xuất dữ liệu lớp ${layer}`, {
      description: `Đã tải xuống ${layerData.length} trụ sở định dạng JSON`
    });
  }, [getVisibleAdministrativeOffices]);

  const handleDownloadLayerAsExcel = useCallback((layer: 'A' | 'B' | 'C') => {
    const layerData = getVisibleAdministrativeOffices().filter(office => office.layer === layer);
    const filename = generateFilename(`danang_tru_so_lop_${layer}`);
    const sheetName = `Lớp ${layer}`;
    downloadAsExcel(layerData, filename, sheetName);
    
    toast.success(`Đã xuất dữ liệu lớp ${layer}`, {
      description: `Đã tải xuống ${layerData.length} trụ sở định dạng Excel`
    });
  }, [getVisibleAdministrativeOffices]);

  const handleDownloadAllLayersAsExcel = useCallback(() => {
    const allVisibleOffices = getVisibleAdministrativeOffices();
    const layerAData = allVisibleOffices.filter(office => office.layer === 'A');
    const layerBData = allVisibleOffices.filter(office => office.layer === 'B');
    const layerCData = allVisibleOffices.filter(office => office.layer === 'C');
    
    const filename = generateFilename('danang_tat_ca_tru_so');
    downloadAllLayersAsExcel(
      layerAData,
      layerBData,
      layerCData,
      customOffices,
      editedOffices,
      deletedOfficeIds,
      filename
    );
    
    const totalCount = layerAData.length + layerBData.length + layerCData.length + customOffices.length;
    toast.success('Đã xuất tất cả dữ liệu', {
      description: `Đã tải xuống ${totalCount} trụ sở từ tất cả các lớp`
    });
  }, [getVisibleAdministrativeOffices, customOffices, editedOffices, deletedOfficeIds]);

  const handleDownloadAllLayersAsJSON = useCallback(() => {
    const allVisibleOffices = getVisibleAdministrativeOffices();
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalOffices: allVisibleOffices.length,
        layers: {
          A: allVisibleOffices.filter(office => office.layer === 'A').length,
          B: allVisibleOffices.filter(office => office.layer === 'B').length,
          C: allVisibleOffices.filter(office => office.layer === 'C').length,
        },
        customOffices: customOffices.length,
        editedOffices: editedOffices.size,
        deletedOffices: deletedOfficeIds.size,
      },
      data: {
        layerA: allVisibleOffices.filter(office => office.layer === 'A'),
        layerB: allVisibleOffices.filter(office => office.layer === 'B'),
        layerC: allVisibleOffices.filter(office => office.layer === 'C'),
        customOffices: customOffices,
        editedOfficeIds: Array.from(editedOffices.keys()),
        deletedOfficeIds: Array.from(deletedOfficeIds),
      },
    };
    
    const filename = generateFilename('danang_tat_ca_tru_so');
    downloadAsJSON(exportData, filename);
    
    toast.success('Đã xuất tất cả dữ liệu', {
      description: `Đã tải xuống ${allVisibleOffices.length} trụ sở định dạng JSON`
    });
  }, [getVisibleAdministrativeOffices, customOffices, editedOffices, deletedOfficeIds]);

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
                layerAReceptionRadius={layerAReceptionRadius}
                layerAManagementRadius={layerAManagementRadius}
                layerBUrbanRadius={layerBUrbanRadius}
                layerBSuburbanRadius={layerBSuburbanRadius}
                layerCRadius={layerCRadius}
                onLayerAReceptionRadiusChange={setLayerAReceptionRadius}
                onLayerAManagementRadiusChange={setLayerAManagementRadius}
                onLayerBUrbanRadiusChange={setLayerBUrbanRadius}
                onLayerBSuburbanRadiusChange={setLayerBSuburbanRadius}
                onLayerCRadiusChange={setLayerCRadius}
                hideLayerBWithinA={hideLayerBWithinA}
                onToggleHideLayerBWithinA={setHideLayerBWithinA}
                useManagementRadiusForHiding={useManagementRadiusForHiding}
                onToggleUseManagementRadiusForHiding={setUseManagementRadiusForHiding}
                layerBWithinACount={getLayerBWithinAInfo().count}
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
    </SidebarProvider>
  );
}
