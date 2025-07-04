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
  type AdministrativeOffice 
} from "../data/administrative-offices";

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
  const [layerARadius, setLayerARadius] = useState(7); // Default 7km
  const [layerBRadius, setLayerBRadius] = useState(5); // Default 5km
  const [layerCRadius, setLayerCRadius] = useState(5); // Default 5km

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

  // New state for zoom level and city boundary
  const [zoomLevel, setZoomLevel] = useState<number>(11); // Start with a zoom level to show all administrative boundaries
  const [wholeDanangPolygon] = useState<PolygonData>(getWholeDanangPolygon());
  const [danangBounds] = useState(getWholeDanangBounds());

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

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    if (event.detail.latLng) {
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
  }, [zoomLevel]);

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
      const layerAOffices = getOfficesByLayer('A').map(office => ({
        ...office,
        radius: layerARadius
      }));
      visibleOffices.push(...layerAOffices);
    }
    if (showLayerB) {
      const layerBOffices = getOfficesByLayer('B').map(office => ({
        ...office,
        radius: layerBRadius
      }));
      visibleOffices.push(...layerBOffices);
    }
    if (showLayerC) {
      const layerCOffices = getOfficesByLayer('C').map(office => ({
        ...office,
        radius: layerCRadius
      }));
      visibleOffices.push(...layerCOffices);
    }
    
    return visibleOffices;
  }, [showLayerA, showLayerB, showLayerC, layerARadius, layerBRadius, layerCRadius]);

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
                    onUnselectWard={clearSelectedWard}
                    interactive={false} // Make the whole city polygon non-interactive
                    zoomThreshold={ZOOM_THRESHOLD}
                    neutralMode={neutralPolygonMode}
                    directionMode={directionMode}
                  />
                )}

                {/* Detailed ward polygons (shown when zoom >= ZOOM_THRESHOLD) */}
                {zoomLevel >= ZOOM_THRESHOLD && (
                  <PolygonOverlay
                    polygons={danangPolygons as PolygonData[]}
                    visible={showPolygons}
                    selectedPolygon={selectedWard}
                    onPolygonClick={handlePolygonClick}
                    onUnselectWard={clearSelectedWard}
                    zoomThreshold={ZOOM_THRESHOLD}
                    neutralMode={neutralPolygonMode}
                    directionMode={directionMode}
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
                layerARadius={layerARadius}
                layerBRadius={layerBRadius}
                layerCRadius={layerCRadius}
                onLayerARadiusChange={setLayerARadius}
                onLayerBRadiusChange={setLayerBRadius}
                onLayerCRadiusChange={setLayerCRadius}
                neutralPolygonMode={neutralPolygonMode}
                onToggleNeutralPolygonMode={setNeutralPolygonMode}
                mapType={mapType}
                onMapTypeChange={setMapType}
                directionMode={directionMode}
                onToggleDirectionMode={setDirectionMode}
                directionModeType={directionModeType}
                onDirectionModeTypeChange={setDirectionModeType}
                distanceInfo={distanceInfo}
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
    </SidebarProvider>
  );
}
