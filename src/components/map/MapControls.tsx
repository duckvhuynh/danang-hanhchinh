import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Layers, Building2, Loader2, LocateIcon, ChevronUp, Palette, Map } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { AdministrativeControls } from "./AdministrativeControls";

interface MapControlsProps {
  showPolygons: boolean;
  onTogglePolygons: (show: boolean) => void;
  showOffices: boolean;
  onToggleOffices: (show: boolean) => void;
  onGetUserLocation: () => void;
  isLocating: boolean;
  // Administrative controls
  showLayerA: boolean;
  showLayerB: boolean;
  showLayerC: boolean;
  showCircles: boolean;
  onToggleLayerA: (show: boolean) => void;
  onToggleLayerB: (show: boolean) => void;
  onToggleLayerC: (show: boolean) => void;
  onToggleCircles: (show: boolean) => void;
  // Radius controls
  layerARadius: number;
  layerBRadius: number;
  layerCRadius: number;
  onLayerARadiusChange: (radius: number) => void;
  onLayerBRadiusChange: (radius: number) => void;
  onLayerCRadiusChange: (radius: number) => void;
  // Neutral polygon mode
  neutralPolygonMode: boolean;
  onToggleNeutralPolygonMode: (enabled: boolean) => void;
  // Map type
  mapType: "roadmap" | "satellite";
  onMapTypeChange: (type: "roadmap" | "satellite") => void;
}

export function MapControls({
  showPolygons,
  onTogglePolygons,
  showOffices,
  onToggleOffices,
  onGetUserLocation,
  isLocating,
  showLayerA,
  showLayerB,
  showLayerC,
  showCircles,
  onToggleLayerA,
  onToggleLayerB,
  onToggleLayerC,
  onToggleCircles,
  layerARadius,
  layerBRadius,
  layerCRadius,
  onLayerARadiusChange,
  onLayerBRadiusChange,
  onLayerCRadiusChange,
  neutralPolygonMode,
  onToggleNeutralPolygonMode,
  mapType,
  onMapTypeChange,
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();

  // Collapse controls on mobile by default
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  return (
    <div className="fixed md:absolute top-4 right-4 z-10 flex flex-col items-end gap-3">
      {/* Administrative Controls */}
      <AdministrativeControls
        showLayerA={showLayerA}
        showLayerB={showLayerB}
        showLayerC={showLayerC}
        showCircles={showCircles}
        onToggleLayerA={onToggleLayerA}
        onToggleLayerB={onToggleLayerB}
        onToggleLayerC={onToggleLayerC}
        onToggleCircles={onToggleCircles}
        layerARadius={layerARadius}
        layerBRadius={layerBRadius}
        layerCRadius={layerCRadius}
        onLayerARadiusChange={onLayerARadiusChange}
        onLayerBRadiusChange={onLayerBRadiusChange}
        onLayerCRadiusChange={onLayerCRadiusChange}
      />
      
      {/* Control panel - Enhanced with better visual design */}
      <div
        className={`
          bg-white backdrop-blur-md rounded-xl shadow-lg transition-all duration-300 ease-in-out
          border border-gray-200 overflow-hidden
          ${expanded
            ? 'max-h-[400px] md:max-h-[400px] opacity-100 shadow-md'
            : 'max-h-12 opacity-95 shadow-sm'
          }
        `}
      >
        <div className={`
          flex flex-col gap-3 
          ${expanded
            ? 'p-2 md:p-3 min-w-[190px] md:min-w-[250px]'
            : 'p-2 min-w-[130px] md:min-w-[180px]'
          }
        `}>
          {/* Header with toggle button - Enhanced styling */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div>
                <span className="text-sm font-medium">
                  Tùy chỉnh
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
            >
              <ChevronUp
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : 'rotate-0'}`}
              />
            </Button>
          </div>

          {/* Controls (visible when expanded) */}
          {expanded && (
            <div className="space-y-3 md:space-y-4">
              {/* Location Button - Enhanced with consistent styling from AppSidebar */}
              <div className="relative">

                {/* Location button with gradient matching AppSidebar */}
                <Button
                  onClick={onGetUserLocation}
                  className={`
                    w-full transition-all duration-300 shadow-md py-2 md:py-3 
                    ${isLocating
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } hover:shadow-lg
                  `}
                  disabled={isLocating}
                  title="Cần cấp quyền truy cập vị trí trên trình duyệt"
                >
                  <div className="flex items-center justify-center">
                    {isLocating ? (
                      <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                    ) : (
                      <LocateIcon className="w-4 h-4 mr-1 md:mr-2" />
                    )}
                    <span className="font-medium text-xs md:text-sm">
                      {isLocating
                        ? (isMobile ? "Đang xác định..." : "Đang xác định...")
                        : (isMobile ? "Vị trí hiện tại" : "Xác định vị trí")
                      }
                    </span>
                  </div>
                </Button>

                {/* Permission notification */}
                {isLocating && (
                  <div className="absolute -bottom-6 left-0 right-0 text-xs text-center bg-yellow-100 text-yellow-800 py-1 px-2 rounded-md font-medium">
                    {isMobile ? "Vui lòng chấp nhận quyền" : "Vui lòng chấp nhận quyền truy cập vị trí"}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-200/70 w-full"></div>

              {/* Toggle Controls - Simplified for mobile */}
              <div className="space-y-2 md:space-y-3">
                {/* Map Type Selector */}
                <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg border border-blue-100 transition-all hover:bg-blue-100/70">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 flex-1">
                      <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-blue-100 rounded-full">
                        <Map className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs md:text-sm font-medium text-blue-900">Loại bản đồ</p>
                        {(!isMobile || (isMobile && expanded)) && (
                          <p className="text-xs text-blue-700 md:text-xs text-[10px]">Mặc định hoặc vệ tinh</p>
                        )}
                      </div>
                    </Label>
                    <Select value={mapType} onValueChange={onMapTypeChange}>
                      <SelectTrigger className="w-[110px] md:w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roadmap">Mặc định</SelectItem>
                        <SelectItem value="satellite">Vệ tinh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-1.5 md:p-2 bg-indigo-50 rounded-lg border border-indigo-100 transition-all hover:bg-indigo-100/70">
                  <div className="flex items-center justify-between group">
                    <Label
                      htmlFor="show-polygons"
                      className="flex-1 flex items-center gap-2 cursor-pointer"
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-indigo-100 rounded-full">
                        <Layers className="w-4 h-4 text-indigo-700" />
                      </div>
                      <div>
                        <p className={`text-xs md:text-sm font-medium text-indigo-900 ${isMobile ? "mr-2" : ""}`}>Ranh giới hành chính</p>
                        {(!isMobile || (isMobile && expanded)) && (
                          <p className="text-xs text-indigo-700 md:text-xs text-[10px]">Phường, xã, đặc khu</p>
                        )}
                      </div>
                    </Label>
                    <Switch
                      id="show-polygons"
                      checked={showPolygons}
                      onCheckedChange={onTogglePolygons}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                </div>

                {/* Neutral Polygon Mode Control */}
                {showPolygons && (
                  <div className="p-1.5 md:p-2 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-gray-100/70">
                    <div className="flex items-center justify-between group">
                      <Label
                        htmlFor="neutral-polygon-mode"
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          <Palette className="w-4 h-4 text-gray-700" />
                        </div>
                        <div>
                          <p className={`text-xs md:text-sm font-medium text-gray-900 ${isMobile ? "mr-2" : ""}`}>Chế độ trung tính</p>
                          {(!isMobile || (isMobile && expanded)) && (
                            <p className="text-xs text-gray-700 md:text-xs text-[10px]">Màu ranh giới đồng nhất</p>
                          )}
                        </div>
                      </Label>
                      <Switch
                        id="neutral-polygon-mode"
                        checked={neutralPolygonMode}
                        onCheckedChange={onToggleNeutralPolygonMode}
                        className="data-[state=checked]:bg-gray-600"
                      />
                    </div>
                  </div>
                )}

                <div className="p-1.5 md:p-2 bg-emerald-50 rounded-lg border border-emerald-100 transition-all hover:bg-emerald-100/70">
                  <div className="flex items-center justify-between group">
                    <Label
                      htmlFor="show-offices"
                      className="flex-1 flex items-center gap-2 cursor-pointer mr-2"
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-emerald-100 rounded-full">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-emerald-900">Vị trí trụ sở</p>
                        {(!isMobile || (isMobile && expanded)) && (
                          <p className="text-xs text-emerald-700 md:text-xs text-[10px]">Trung tâm PV hành chính công</p>
                        )}
                      </div>
                    </Label>
                    <Switch
                      id="show-offices"
                      checked={showOffices}
                      onCheckedChange={onToggleOffices}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}