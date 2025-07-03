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
  const [showOffices, setShowOffices] = useState(false);

  // Administrative offices state
  const [showLayerA, setShowLayerA] = useState(false);
  const [showLayerB, setShowLayerB] = useState(false);
  const [showLayerC, setShowLayerC] = useState(false);
  const [showCircles, setShowCircles] = useState(true);

  // Radius state for each layer
  const [layerARadius, setLayerARadius] = useState(7); // Default 7km
  const [layerBRadius, setLayerBRadius] = useState(5); // Default 5km
  const [layerCRadius, setLayerCRadius] = useState(5); // Default 5km

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
                  />
                )}

                {/* Ward name labels (shown consistently when zoom >= 11) */}
                <WardLabelsOverlay
                  polygons={danangPolygons as PolygonData[]}
                  visible={showPolygons}
                  zoomLevel={zoomLevel}
                  zoomThreshold={10} // Fixed value of 11 to ensure consistent behavior
                />

                {/* Office markers (only visible at higher zoom levels) */}
                <OfficeMarkers
                  offices={offices}
                  visible={showOffices && zoomLevel >= ZOOM_THRESHOLD}
                  selectedWard={selectedWard}
                  userLocation={userLocation}
                />

                {/* Administrative offices with service coverage circles */}
                <AdministrativeOffices
                  offices={getVisibleAdministrativeOffices()}
                  visible={true}
                  showCircles={showCircles}
                  userLocation={userLocation}
                />

                {/* User location marker */}
                {userLocation && (
                  <UserLocationMarker position={userLocation} />
                )}

                {/* Map Header */}
                <MapHeader />

                {/* Map Footer */}
                <MapFooter />
              </ZoomAwareMap>

              {/* Map Controls */}
              <MapControls
                showPolygons={showPolygons}
                onTogglePolygons={setShowPolygons}
                showOffices={showOffices}
                onToggleOffices={setShowOffices}
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
