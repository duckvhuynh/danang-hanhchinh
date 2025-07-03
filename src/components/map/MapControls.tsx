import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Layers, 
  Building2, 
  Loader2, 
  LocateIcon, 
  ChevronUp, 
  Palette, 
  Map,
  Circle as CircleIcon,
  Eye,
  EyeOff
} from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { layerConfigurations } from "../../data/administrative-offices";

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
  mapType: "roadmap" | "satellite" | "styled";
  onMapTypeChange: (type: "roadmap" | "satellite" | "styled") => void;
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

  const layerCount = [showLayerA, showLayerB, showLayerC].filter(Boolean).length;

  return (
    <div className="fixed md:absolute top-4 right-4 z-10 flex flex-col items-end">
      {/* Unified Control Panel with Responsive Scrolling */}
      <div
        className={`
          bg-white backdrop-blur-md rounded-xl shadow-lg transition-all duration-300 ease-in-out
          border border-gray-200 flex flex-col
          ${expanded
            ? 'opacity-100 shadow-md'
            : 'opacity-95 shadow-sm'
          }
        `}
        style={{
          maxHeight: expanded ? 'calc(100vh - 2rem)' : '3rem',
          minWidth: isMobile ? '280px' : '300px',
          width: isMobile ? '280px' : '300px',
        }}
      >
        {/* Header - Fixed at top */}
        <div
          className={`
            flex items-center justify-between cursor-pointer flex-shrink-0
            ${expanded ? 'p-3 pb-0' : 'p-2'}
          `}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
              <Layers className="w-3.5 h-3.5 text-blue-700" />
            </div>
            <div>
              <span className="text-sm font-medium">Điều khiển bản đồ</span>
              {!expanded && (
                <div className="text-xs text-gray-500">
                  {layerCount > 0 ? `${layerCount} lớp hiển thị` : 'Ẩn tất cả'}
                </div>
              )}
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

        {/* Scrollable Content Container */}
        {expanded && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-3 pt-3">
              {/* Controls (visible when expanded) */}
              <div className="space-y-4">
                {/* Location Button */}
                <div className="relative">
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
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LocateIcon className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-medium text-sm">
                        {isLocating ? "Đang xác định..." : "Xác định vị trí"}
                      </span>
                    </div>
                  </Button>
                  {isLocating && (
                    <div className="absolute -bottom-6 left-0 right-0 text-xs text-center bg-yellow-100 text-yellow-800 py-1 px-2 rounded-md font-medium">
                      Vui lòng chấp nhận quyền truy cập vị trí
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full"></div>

                {/* Map Type Selector */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Kiểu bản đồ</h3>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                          <Map className="w-3 h-3 text-blue-700" />
                        </div>
                        <span className="text-sm font-medium text-blue-900">Loại bản đồ</span>
                      </Label>
                      <Select value={mapType} onValueChange={onMapTypeChange}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="styled">Mặc định</SelectItem>
                          <SelectItem value="roadmap">Màu sắc</SelectItem>
                          <SelectItem value="satellite">Vệ tinh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full"></div>

                {/* Polygon Controls */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Ranh giới hành chính</h3>
                  <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-polygons"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-indigo-100 rounded-full">
                          <Layers className="w-3 h-3 text-indigo-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-900">Hiển thị ranh giới</p>
                          <p className="text-xs text-indigo-700">Phường, xã, đặc khu</p>
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

                  {/* Neutral Polygon Mode */}
                  {showPolygons && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="neutral-polygon-mode"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full">
                            <Palette className="w-3 h-3 text-gray-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Chế độ trung tính</p>
                            <p className="text-xs text-gray-700">Màu đồng nhất</p>
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
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full"></div>

                {/* Administrative Offices */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Trụ sở hành chính</h3>
                  
                  {/* Service Coverage Toggle */}
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-circles"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full">
                          <CircleIcon className="w-3 h-3 text-gray-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Vùng tiếp cận</p>
                          <p className="text-xs text-gray-600">Bán kính phục vụ</p>
                        </div>
                      </Label>
                      <Switch
                        id="show-circles"
                        checked={showCircles}
                        onCheckedChange={onToggleCircles}
                        className="data-[state=checked]:bg-gray-600"
                      />
                    </div>
                  </div>

                  {/* Layer A Controls */}
                  <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-layer-a"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-full">
                          <Building2 className="w-3 h-3 text-red-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-900">Lớp A - {layerARadius}km</p>
                          <p className="text-xs text-red-700">{layerConfigurations.A.count} Quận/Huyện cũ</p>
                        </div>
                      </Label>
                      <Switch
                        id="show-layer-a"
                        checked={showLayerA}
                        onCheckedChange={onToggleLayerA}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </div>
                    {showLayerA && (
                      <div className="mt-2 px-2">
                        <Label htmlFor="layer-a-radius" className="text-xs text-red-700">
                          Bán kính phục vụ (km):
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="layer-a-radius"
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={layerARadius}
                            onChange={(e) => onLayerARadiusChange(Number(e.target.value))}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-xs text-red-600">km</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layer B Controls */}
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-layer-b"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                          <Building2 className="w-3 h-3 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Lớp B - {layerBRadius}km</p>
                          <p className="text-xs text-blue-700">{layerConfigurations.B.count} Phường/Xã hiện tại</p>
                        </div>
                      </Label>
                      <Switch
                        id="show-layer-b"
                        checked={showLayerB}
                        onCheckedChange={onToggleLayerB}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                    {showLayerB && (
                      <div className="mt-2 px-2">
                        <Label htmlFor="layer-b-radius" className="text-xs text-blue-700">
                          Bán kính phục vụ (km):
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="layer-b-radius"
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={layerBRadius}
                            onChange={(e) => onLayerBRadiusChange(Number(e.target.value))}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-xs text-blue-600">km</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layer C Controls */}
                  <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-layer-c"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full">
                          <Building2 className="w-3 h-3 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">Lớp C - {layerCRadius}km</p>
                          <p className="text-xs text-green-700">{layerConfigurations.C.count} Phường/Xã cũ</p>
                        </div>
                      </Label>
                      <Switch
                        id="show-layer-c"
                        checked={showLayerC}
                        onCheckedChange={onToggleLayerC}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                    {showLayerC && (
                      <div className="mt-2 px-2">
                        <Label htmlFor="layer-c-radius" className="text-xs text-green-700">
                          Bán kính phục vụ (km):
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="layer-c-radius"
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={layerCRadius}
                            onChange={(e) => onLayerCRadiusChange(Number(e.target.value))}
                            className="w-16 h-7 text-xs"
                          />
                          <span className="text-xs text-green-600">km</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        onToggleLayerA(true);
                        onToggleLayerB(true);
                        onToggleLayerC(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Hiện tất cả
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        onToggleLayerA(false);
                        onToggleLayerB(false);
                        onToggleLayerC(false);
                      }}
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      Ẩn tất cả
                    </Button>
                  </div>
                </div>

                {/* <div className="h-px bg-gray-200 w-full"></div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Điểm phục vụ</h3>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-offices"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-emerald-100 rounded-full">
                          <Building2 className="w-3 h-3 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">Vị trí trụ sở</p>
                          <p className="text-xs text-emerald-700">Trung tâm PV hành chính công</p>
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
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}