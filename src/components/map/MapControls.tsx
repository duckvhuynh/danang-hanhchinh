import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
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
  EyeOff,
  Navigation,
  LineSquiggle,
  ChevronsLeftRightEllipsis,
  Edit3,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { layerConfigurations } from "../../data/administrative-offices";

interface MapControlsProps {
  showPolygons: boolean;
  onTogglePolygons: (show: boolean) => void;
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
  layerAReceptionRadius: number;
  layerAManagementRadius: number;
  layerBUrbanRadius: number;
  layerBSuburbanRadius: number;
  layerCRadius: number;
  onLayerAReceptionRadiusChange: (radius: number) => void;
  onLayerAManagementRadiusChange: (radius: number) => void;
  onLayerBUrbanRadiusChange: (radius: number) => void;
  onLayerBSuburbanRadiusChange: (radius: number) => void;
  onLayerCRadiusChange: (radius: number) => void;
  // Layer B within Layer A controls
  hideLayerBWithinA?: boolean;
  onToggleHideLayerBWithinA?: (enabled: boolean) => void;
  useManagementRadiusForHiding?: boolean;
  onToggleUseManagementRadiusForHiding?: (enabled: boolean) => void;
  layerBWithinACount?: number;
  // Neutral polygon mode
  neutralPolygonMode: boolean;
  onToggleNeutralPolygonMode: (enabled: boolean) => void;
  // Map type
  mapType: "roadmap" | "satellite" | "styled";
  onMapTypeChange: (type: "roadmap" | "satellite" | "styled") => void;
  // Direction mode
  directionMode: boolean;
  onToggleDirectionMode: (enabled: boolean) => void;
  directionModeType?: 'route' | 'straightline';
  onDirectionModeTypeChange?: (type: 'route' | 'straightline') => void;
  distanceInfo?: {distance: number, type: 'route' | 'straightline'} | null;
  // Edit mode
  editMode?: boolean;
  onToggleEditMode?: (enabled: boolean) => void;
  selectedLayerForAdd?: 'A' | 'B' | 'C';
  onSelectedLayerForAddChange?: (layer: 'A' | 'B' | 'C') => void;
  // Download handlers
  onDownloadLayerAsJSON?: (layer: 'A' | 'B' | 'C') => void;
  onDownloadLayerAsExcel?: (layer: 'A' | 'B' | 'C') => void;
  onDownloadAllLayersAsJSON?: () => void;
  onDownloadAllLayersAsExcel?: () => void;
  // Fill opacity control
  fillOpacity?: number;
  onFillOpacityChange?: (opacity: number) => void;
}

export function MapControls({
  showPolygons,
  onTogglePolygons,
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
  layerAReceptionRadius,
  layerAManagementRadius,
  layerBUrbanRadius,
  layerBSuburbanRadius,
  layerCRadius,
  onLayerAReceptionRadiusChange,
  onLayerAManagementRadiusChange,
  onLayerBUrbanRadiusChange,
  onLayerBSuburbanRadiusChange,
  onLayerCRadiusChange,
  hideLayerBWithinA,
  onToggleHideLayerBWithinA,
  useManagementRadiusForHiding,
  onToggleUseManagementRadiusForHiding,
  layerBWithinACount,
  neutralPolygonMode,
  onToggleNeutralPolygonMode,
  mapType,
  onMapTypeChange,
  directionMode,
  onToggleDirectionMode,
  directionModeType = 'route',
  onDirectionModeTypeChange,
  distanceInfo,
  editMode = false,
  onToggleEditMode,
  selectedLayerForAdd = 'B',
  onSelectedLayerForAddChange,
  onDownloadLayerAsJSON,
  onDownloadLayerAsExcel,
  onDownloadAllLayersAsJSON,
  onDownloadAllLayersAsExcel,
  fillOpacity = 0.3,
  onFillOpacityChange,
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();

  // Collapse controls on mobile by default
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  // const layerCount = [showLayerA, showLayerB, showLayerC].filter(Boolean).length;

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
          minWidth: isMobile ? '280px' : '330px',
          width: isMobile ? '280px' : '330px',
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
              {/* {!expanded && (
                <div className="text-xs text-gray-500">
                  {layerCount > 0 ? `${layerCount} lớp hiển thị` : 'Ẩn tất cả'}
                </div>
              )} */}
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

                  {/* Fill Opacity Control */}
                  {showCircles && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-700 font-medium">
                          Độ trong suốt: {Math.round(fillOpacity * 100)}%
                        </Label>
                        <Slider
                          value={[fillOpacity]}
                          onValueChange={(value) => onFillOpacityChange?.(value[0])}
                          min={0.1}
                          max={1}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>10%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}

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
                          <p className="text-sm font-medium text-red-900">Lớp A - TN: {layerAReceptionRadius}km, QL: {layerAManagementRadius}km</p>
                          <p className="text-xs text-red-700">{layerConfigurations.A.count} {layerConfigurations.A.description}</p>
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
                      <div className="mt-2 px-2 space-y-2">
                        {/* Reception Radius */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-a-reception-radius" className="text-xs text-orange-700">
                            Bán kính tiếp nhận:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="layer-a-reception-radius"
                              type="number"
                              min="1"
                              max="20"
                              step="0.5"
                              value={layerAReceptionRadius}
                              onChange={(e) => onLayerAReceptionRadiusChange(Number(e.target.value))}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-orange-600">km</span>
                          </div>
                        </div>
                        
                        {/* Management Radius */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-a-management-radius" className="text-xs text-red-700">
                            Bán kính quản lý:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="layer-a-management-radius"
                              type="number"
                              min="1"
                              max="30"
                              step="0.5"
                              value={layerAManagementRadius}
                              onChange={(e) => onLayerAManagementRadiusChange(Number(e.target.value))}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-red-600">km</span>
                          </div>
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
                          <p className="text-sm font-medium text-blue-900">Lớp B - Đô thị: {layerBUrbanRadius}km, Ngoại ô: {layerBSuburbanRadius}km</p>
                          <p className="text-xs text-blue-700">{layerConfigurations.B.count} {layerConfigurations.B.description}</p>
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
                      <div className="mt-2 px-2 space-y-2">
                        {/* Urban radius control */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-b-urban-radius" className="text-xs text-blue-700">
                            Bán kính đô thị:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="layer-b-urban-radius"
                              type="number"
                              min="1"
                              max="20"
                              step="0.5"
                              value={layerBUrbanRadius}
                              onChange={(e) => onLayerBUrbanRadiusChange(Number(e.target.value))}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-blue-600">km</span>
                          </div>
                        </div>
                        
                        {/* Suburban radius control */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-b-suburban-radius" className="text-xs text-blue-700">
                            Bán kính ngoại ô:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="layer-b-suburban-radius"
                              type="number"
                              min="1"
                              max="20"
                              step="0.5"
                              value={layerBSuburbanRadius}
                              onChange={(e) => onLayerBSuburbanRadiusChange(Number(e.target.value))}
                              className="w-16 h-7 text-xs"
                            />
                            <span className="text-xs text-blue-600">km</span>
                          </div>
                        </div>
                        
                        {/* Layer B within Layer A controls */}
                        {showLayerA && (
                          <div className="mt-3 pt-2 border-t border-blue-200">
                            <Label className="text-xs text-blue-700 font-medium">
                              Lớp B trong vùng Lớp A:
                            </Label>
                            
                            {/* Show count */}
                            {layerBWithinACount !== undefined && (
                              <div className="text-xs text-blue-600 mt-1">
                                {layerBWithinACount} điểm trong vùng Lớp A
                              </div>
                            )}
                            
                            {/* Hide/Dim toggle */}
                            <div className="flex items-center justify-between mt-2">
                              <Label htmlFor="hide-layer-b-within-a" className="text-xs text-blue-700">
                                Ẩn/Mờ điểm trong vùng Lớp A
                              </Label>
                              <Switch
                                id="hide-layer-b-within-a"
                                checked={hideLayerBWithinA || false}
                                onCheckedChange={onToggleHideLayerBWithinA}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </div>
                            
                            {/* Radius selection for hiding logic */}
                            <div className="flex items-center justify-between mt-2">
                              <Label htmlFor="use-management-radius" className="text-xs text-blue-700">
                                Dùng bán kính quản lý
                              </Label>
                              <Switch
                                id="use-management-radius"
                                checked={useManagementRadiusForHiding || false}
                                onCheckedChange={onToggleUseManagementRadiusForHiding}
                                className="data-[state=checked]:bg-blue-600"
                              />
                            </div>
                            
                            <div className="text-xs text-blue-500 mt-1">
                              {useManagementRadiusForHiding ? 'Quản lý' : 'Tiếp nhận'} radius được sử dụng
                            </div>
                          </div>
                        )}
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
                          <p className="text-xs text-green-700">{layerConfigurations.C.count} {layerConfigurations.C.description}</p>
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-c-radius" className="text-xs text-green-700">
                            Bán kính phục vụ:
                          </Label>
                          <div className="flex items-center gap-2">
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

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full"></div>

                {/* Direction Mode Control */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Chế độ chỉ đường</h3>
                  
                  {/* Direction Mode Toggle */}
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="direction-mode"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full">
                          <Navigation className="w-3 h-3 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Chế độ chỉ đường</p>
                          <p className="text-xs text-purple-700">Chọn 2 điểm để xem lộ trình</p>
                        </div>
                      </Label>
                      <Switch
                        id="direction-mode"
                        checked={directionMode}
                        onCheckedChange={onToggleDirectionMode}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>

                  {/* Direction Mode Type Selection */}
                  {directionMode && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">
                        Loại chỉ đường
                      </Label>
                      <Select value={directionModeType} onValueChange={onDirectionModeTypeChange}>
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="route"><LineSquiggle />Đường đi thực tế</SelectItem>
                          <SelectItem value="straightline"><ChevronsLeftRightEllipsis /> Đường chim bay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Distance Information Display */}
                  {directionMode && distanceInfo && (
                    <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                          <span className="text-xs">📏</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-800">
                            {distanceInfo.type === 'route' ? 'Khoảng cách đường đi' : 'Khoảng cách đường chim bay'}
                          </p>
                          <p className="text-sm font-semibold text-green-900">
                            {(distanceInfo.distance / 1000).toFixed(2)} km
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200 w-full"></div>

                {/* Edit Mode Control */}
                {onToggleEditMode && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-900">Chế độ chỉnh sửa</h3>
                    
                    {/* Edit Mode Toggle */}
                    <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="edit-mode"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full">
                            <Edit3 className="w-3 h-3 text-orange-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-900">Chế độ chỉnh sửa</p>
                            <p className="text-xs text-orange-700">Thêm, sửa, xóa trụ sở</p>
                          </div>
                        </Label>
                        <Switch
                          id="edit-mode"
                          checked={editMode}
                          onCheckedChange={onToggleEditMode}
                          className="data-[state=checked]:bg-orange-600"
                        />
                      </div>
                    </div>

                    {/* Layer Selection for Adding New Offices */}
                    {editMode && onSelectedLayerForAddChange && (
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          Lớp để thêm trụ sở mới
                        </Label>
                        <Select value={selectedLayerForAdd} onValueChange={onSelectedLayerForAddChange}>
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Lớp A - Quận/Huyện cũ</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="B">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Lớp B - Phường/Xã hiện tại</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="C">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Lớp C - Phường/Xã cũ</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Edit Mode Instructions */}
                    {editMode && (
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-blue-800">Hướng dẫn sử dụng:</p>
                          <ul className="text-xs text-blue-700 space-y-0.5 pl-2">
                            <li>• <strong>Thêm mới:</strong> Click vào bản đồ để thêm trụ sở</li>
                            <li>• <strong>Di chuyển:</strong> Kéo thả marker để di chuyển</li>
                            <li>• <strong>Xóa:</strong> Click vào marker và chọn nút xóa</li>
                            <li>• <strong>Chỉnh sửa:</strong> Click vào marker để sửa thông tin</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Download Section */}
                    {editMode && onDownloadLayerAsJSON && onDownloadLayerAsExcel && onDownloadAllLayersAsJSON && onDownloadAllLayersAsExcel && (
                      <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center bg-green-100 rounded-full">
                              <Download className="w-2.5 h-2.5 text-green-700" />
                            </div>
                            <p className="text-xs font-medium text-green-800">Xuất dữ liệu</p>
                          </div>

                          {/* Download All Layers */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-green-700">Tất cả lớp:</p>
                            <div className="grid grid-cols-2 gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                onClick={() => onDownloadAllLayersAsJSON()}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                JSON
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                onClick={() => onDownloadAllLayersAsExcel()}
                              >
                                <FileSpreadsheet className="w-3 h-3 mr-1" />
                                Excel
                              </Button>
                            </div>
                          </div>

                          {/* Individual Layer Downloads */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-green-700">Từng lớp:</p>
                            
                            {/* Layer A Downloads */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Lớp A:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 pl-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-red-50 border-red-200 text-red-700"
                                  onClick={() => onDownloadLayerAsJSON('A')}
                                >
                                  <FileText className="w-2.5 h-2.5 mr-1" />
                                  JSON
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-red-50 border-red-200 text-red-700"
                                  onClick={() => onDownloadLayerAsExcel('A')}
                                >
                                  <FileSpreadsheet className="w-2.5 h-2.5 mr-1" />
                                  Excel
                                </Button>
                              </div>
                            </div>

                            {/* Layer B Downloads */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Lớp B:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 pl-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                                  onClick={() => onDownloadLayerAsJSON('B')}
                                >
                                  <FileText className="w-2.5 h-2.5 mr-1" />
                                  JSON
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                                  onClick={() => onDownloadLayerAsExcel('B')}
                                >
                                  <FileSpreadsheet className="w-2.5 h-2.5 mr-1" />
                                  Excel
                                </Button>
                              </div>
                            </div>

                            {/* Layer C Downloads */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Lớp C:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 pl-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                  onClick={() => onDownloadLayerAsJSON('C')}
                                >
                                  <FileText className="w-2.5 h-2.5 mr-1" />
                                  JSON
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
                                  onClick={() => onDownloadLayerAsExcel('C')}
                                >
                                  <FileSpreadsheet className="w-2.5 h-2.5 mr-1" />
                                  Excel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}