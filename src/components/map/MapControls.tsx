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
  FileSpreadsheet,
  Info
} from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { layerConfigurations } from "../../data/administrative-offices";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";

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
  // Layer A type-based radius controls
  layerAUrbanReceptionRadius: number;
  layerASuburbanReceptionRadius: number;
  layerAUrbanManagementRadius: number;
  layerASuburbanManagementRadius: number;
  // Layer B and C have fixed radius (no type-based logic)
  layerBRadius: number;
  layerCRadius: number;
  onLayerAUrbanReceptionRadiusChange: (radius: number) => void;
  onLayerASuburbanReceptionRadiusChange: (radius: number) => void;
  onLayerAUrbanManagementRadiusChange: (radius: number) => void;
  onLayerASuburbanManagementRadiusChange: (radius: number) => void;
  onLayerBRadiusChange: (radius: number) => void;
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
  // About dialog
  showAboutDialog?: boolean;
  onToggleAboutDialog?: (show: boolean) => void;
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
  layerAUrbanReceptionRadius,
  layerASuburbanReceptionRadius,
  layerAUrbanManagementRadius,
  layerASuburbanManagementRadius,
  layerBRadius,
  layerCRadius,
  onLayerAUrbanReceptionRadiusChange,
  onLayerASuburbanReceptionRadiusChange,
  onLayerAUrbanManagementRadiusChange,
  onLayerASuburbanManagementRadiusChange,
  onLayerBRadiusChange,
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
  onToggleAboutDialog,
  showAboutDialog = false,
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
            <div className="flex items-center">
              <span className="text-sm font-medium">Điều khiển bản đồ</span>
              <Button
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 ml-2 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleAboutDialog) onToggleAboutDialog(true);
                }}
              >
                <Info className="w-3 h-3 text-gray-600" />
              </Button>
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
                          <p className="text-sm font-medium text-red-900">Lớp A - Đô thị: TN {layerAUrbanReceptionRadius}km/QL {layerAUrbanManagementRadius}km, Ngoại ô: TN {layerASuburbanReceptionRadius}km/QL {layerASuburbanManagementRadius}km</p>
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
                      <div className="mt-2 px-2 space-y-3">
                        {/* Urban Radii */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-red-800">Khu vực Đô thị</h4>
                          {/* Urban Reception Radius */}
                          <div className="flex items-center justify-between">
                            <Label htmlFor="layer-a-urban-reception-radius" className="text-xs text-orange-700">
                              Bán kính tiếp nhận:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="layer-a-urban-reception-radius"
                                type="number"
                                min="1"
                                max="10"
                                step="0.5"
                                value={layerAUrbanReceptionRadius}
                                onChange={(e) => onLayerAUrbanReceptionRadiusChange(Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs text-orange-600">km</span>
                            </div>
                          </div>
                          
                          {/* Urban Management Radius */}
                          <div className="flex items-center justify-between">
                            <Label htmlFor="layer-a-urban-management-radius" className="text-xs text-red-700">
                              Bán kính quản lý:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="layer-a-urban-management-radius"
                                type="number"
                                min="1"
                                max="15"
                                step="0.5"
                                value={layerAUrbanManagementRadius}
                                onChange={(e) => onLayerAUrbanManagementRadiusChange(Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs text-red-600">km</span>
                            </div>
                          </div>
                        </div>

                        {/* Suburban Radii */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-red-800">Khu vực Ngoại ô</h4>
                          {/* Suburban Reception Radius */}
                          <div className="flex items-center justify-between">
                            <Label htmlFor="layer-a-suburban-reception-radius" className="text-xs text-orange-700">
                              Bán kính tiếp nhận:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="layer-a-suburban-reception-radius"
                                type="number"
                                min="1"
                                max="15"
                                step="0.5"
                                value={layerASuburbanReceptionRadius}
                                onChange={(e) => onLayerASuburbanReceptionRadiusChange(Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs text-orange-600">km</span>
                            </div>
                          </div>
                          
                          {/* Suburban Management Radius */}
                          <div className="flex items-center justify-between">
                            <Label htmlFor="layer-a-suburban-management-radius" className="text-xs text-red-700">
                              Bán kính quản lý:
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="layer-a-suburban-management-radius"
                                type="number"
                                min="1"
                                max="20"
                                step="0.5"
                                value={layerASuburbanManagementRadius}
                                onChange={(e) => onLayerASuburbanManagementRadiusChange(Number(e.target.value))}
                                className="w-16 h-7 text-xs"
                              />
                              <span className="text-xs text-red-600">km</span>
                            </div>
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
                          <p className="text-sm font-medium text-blue-900">Lớp B - Bán kính cố định: {layerBRadius}km</p>
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
                        {/* Fixed radius control */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-b-radius" className="text-xs text-blue-700">
                            Bán kính cố định:
                          </Label>
                          <div className="flex items-center gap-2">
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
                            <div className="mt-2">
                              <Label className="text-xs text-blue-700 mb-2 block">
                                Bán kính để kiểm tra
                              </Label>
                              <Select 
                                value={useManagementRadiusForHiding ? 'management' : 'reception'} 
                                onValueChange={(value) => onToggleUseManagementRadiusForHiding?.(value === 'management')}
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="reception">Tiếp nhận (Đô thị: {layerAUrbanReceptionRadius}km, Ngoại ô: {layerASuburbanReceptionRadius}km)</SelectItem>
                                  <SelectItem value="management">Quản lý (Đô thị: {layerAUrbanManagementRadius}km, Ngoại ô: {layerASuburbanManagementRadius}km)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Layer C Controls */}
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="show-layer-c"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded-full">
                          <Building2 className="w-3 h-3 text-yellow-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-900">Lớp C - {layerCRadius}km</p>
                          <p className="text-xs text-yellow-700">{layerConfigurations.C.count} {layerConfigurations.C.description}</p>
                        </div>
                      </Label>
                      <Switch
                        id="show-layer-c"
                        checked={showLayerC}
                        onCheckedChange={onToggleLayerC}
                        className="data-[state=checked]:bg-yellow-600"
                      />
                    </div>
                    {showLayerC && (
                      <div className="mt-2 px-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="layer-c-radius" className="text-xs text-yellow-700">
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
                            <span className="text-xs text-yellow-600">km</span>
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
                                <span>Lớp A - Chi nhánh (2 bán kính)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="B">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Lớp B - Điểm tiếp nhận (theo loại vùng)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="C">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Lớp C - Điểm tăng cường (bưu điện)</span>
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
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs font-medium text-blue-800 mb-1">Lưu ý về bán kính:</p>
                            <ul className="text-xs text-blue-600 space-y-0.5 pl-2">
                              <li>• <strong>Lớp A:</strong> Có 2 bán kính (tiếp nhận + quản lý)</li>
                              <li>• <strong>Lớp B:</strong> Bán kính theo loại vùng (đô thị/ngoại ô)</li>
                              <li>• <strong>Lớp C:</strong> Bán kính cố định (bưu điện)</li>
                            </ul>
                          </div>
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
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Lớp C:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 pl-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-yellow-50 border-yellow-200 text-yellow-700"
                                  onClick={() => onDownloadLayerAsJSON('C')}
                                >
                                  <FileText className="w-2.5 h-2.5 mr-1" />
                                  JSON
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs bg-white hover:bg-yellow-50 border-yellow-200 text-yellow-700"
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
      
      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={(open) => onToggleAboutDialog && onToggleAboutDialog(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Về Bản Đồ Hành Chính Đà Nẵng</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <h3 className="font-medium text-base">Mục tiêu của bản đồ hành chính</h3>
            <p>
              Bản đồ này được xây dựng để:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Hình dung rõ các điểm tiếp nhận và phục vụ hành chính công sau khi sáp nhập các đơn vị hành chính.</li>
              <li>Đảm bảo mỗi người dân đều có điểm tiếp nhận gần, phù hợp với khu vực mình sống (Đô thị hoặc Nông thôn).</li>
              <li>Hỗ trợ cho việc quy hoạch, điều phối và tối ưu vị trí các trung tâm hành chính trong thành phố Đà Nẵng.</li>
            </ul>
            
            <h3 className="font-medium text-base">Bản đồ được chia thành 3 lớp chính</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Lớp A - Các Chi Nhánh Hành Chính Cấp Quận/Huyện Cũ:</span>
                <p className="mt-1 text-gray-700">Hiển thị bằng màu đỏ. Mỗi Quận, Huyện, Thị xã, Thành phố trực thuộc tỉnh (trước khi sáp nhập) sẽ có 1 Chi nhánh Trung tâm Hành chính.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Tổng cộng:</strong> 23 Chi nhánh (17 từ Quảng Nam và 6 từ Đà Nẵng)</li>
                  <li><strong>Loại trừ:</strong> Quận Hải Châu (đã là Trung tâm chính) và Huyện Hoàng Sa (không có dân cư)</li>
                  <li><strong>Bán kính tiếp nhận hồ sơ:</strong> Đô thị (2-3km), Nông thôn (5km)</li>
                  <li><strong>Bán kính quản lý của chi nhánh:</strong> Đô thị (5km), Nông thôn (10km)</li>
                </ul>
              </div>
              
              <div>
                <span className="font-medium">Lớp B - Các Trung Tâm Hành Chính Cấp Xã/Phường Mới:</span>
                <p className="mt-1 text-gray-700">Hiển thị bằng màu xanh dương. Bao gồm toàn bộ 93 đơn vị hành chính cấp Xã/Phường sau sáp nhập.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Trong đó, 23 điểm trùng với Lớp A, nên chỉ còn 70 điểm Lớp B được hiển thị</li>
                  <li>Có bán kính cố định mặc định 5km</li>
                </ul>
              </div>
              
              <div>
                <span className="font-medium">Lớp C - Các Điểm Tiếp Nhận Do Bưu Điện Quản Lý:</span>
                <p className="mt-1 text-gray-700">Hiển thị bằng màu vàng/cam. Bổ sung tại các khu vực chưa được bao phủ hiệu quả bởi Lớp A và B.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Có thể đặt tại các trụ sở Xã cũ hoặc các bưu cục cấp Xã do Bưu điện vận hành</li>
                  <li>Số lượng có thể thay đổi tùy thực tế, nhưng không trùng lặp với Lớp A hoặc B</li>
                  <li>Có bán kính mặc định 5km</li>
                </ul>
              </div>
            </div>
            
            <h3 className="font-medium text-base">Hướng dẫn sử dụng</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Điều chỉnh hiển thị:</span> Bạn có thể bật/tắt hiển thị từng lớp và điều chỉnh 
                bán kính cho mỗi lớp trong phần điều khiển. Lớp A có thể điều chỉnh riêng biệt cho từng loại khu vực (đô thị/nông thôn) 
                và từng loại bán kính (tiếp nhận/quản lý).
              </p>
              
              <p>
                <span className="font-medium">Lớp B trong Lớp A:</span> Chức năng này cho phép ẩn hoặc làm mờ các điểm Lớp B 
                nằm trong bán kính của Lớp A, giúp giảm bớt sự chồng chéo trên bản đồ. Có thể chọn sử dụng bán kính tiếp nhận 
                hoặc bán kính quản lý để xác định vùng che phủ.
              </p>
              
              <p>
                <span className="font-medium">Độ trong suốt lớp phủ:</span> Điều chỉnh độ trong suốt của các vòng tròn bán kính 
                để quan sát tốt hơn các điểm và ranh giới hành chính bên dưới.
              </p>
              
              <p>
                <span className="font-medium">Chế độ đo đạc:</span> Bật chế độ đo đạc để đo khoảng cách giữa hai điểm trên bản đồ,
                có thể chọn đo theo đường thẳng hoặc theo tuyến đường thực tế.
              </p>
              
              <p>
                <span className="font-medium">Chế độ chỉnh sửa:</span> Khi bật chế độ chỉnh sửa, bạn có thể:
                <ul className="list-disc pl-5 mt-1">
                  <li>Thêm điểm mới: Chọn lớp và nhấp vào vị trí trên bản đồ</li>
                  <li>Chỉnh sửa điểm: Nhấp vào điểm hiện có để mở giao diện chỉnh sửa</li>
                  <li>Xóa điểm: Sử dụng nút xóa trong giao diện chỉnh sửa</li>
                  <li>Chỉnh sửa thông tin: Tên, địa chỉ, loại khu vực (cho Lớp A), bán kính tùy chỉnh</li>
                </ul>
              </p>
              
              <p>
                <span className="font-medium">Xuất dữ liệu:</span> Ứng dụng cho phép xuất dữ liệu dưới dạng JSON hoặc Excel,
                cho từng lớp riêng biệt hoặc tất cả các lớp, bao gồm cả dữ liệu đã chỉnh sửa.
              </p>
            </div>
            
            <h3 className="font-medium text-base">Ghi chú quan trọng</h3>
            <div className="space-y-2">
              <p>
                • <span className="font-medium">Trung tâm hành chính chính</span> của toàn thành phố được đặt tại Quận Hải Châu 
                (không xếp vào Lớp A, B, hay C).
              </p>
              <p>
                • <span className="font-medium">Tránh trùng lặp:</span> Các điểm được thiết kế để không trùng nhau giữa các lớp. 
                Một địa điểm không thể vừa là điểm Lớp A, vừa là điểm Lớp B hoặc C.
              </p>
              <p>
                • <span className="font-medium">Mục đích bán kính:</span> Việc phân chia bán kính tiếp nhận và quản lý nhằm đảm bảo 
                người dân không phải đi quá xa để làm thủ tục hành chính.
              </p>
            </div>
            
            <h3 className="font-medium text-base">Thông tin kỹ thuật</h3>
            <p>
              Bản đồ được phát triển sử dụng công nghệ React, TypeScript và Google Maps API. 
              Dữ liệu ranh giới hành chính được xây dựng dựa trên dữ liệu chính thức của thành phố Đà Nẵng 
              và Quảng Nam sau sáp nhập.
            </p>
            <p>
              Đây là công cụ hỗ trợ quản lý và phân tích không gian địa lý hành chính, giúp các cơ quan, tổ chức 
              có cái nhìn tổng thể về phân bố các điểm hành chính và tối ưu hóa việc phục vụ người dân trên địa bàn thành phố.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full sm:w-auto" 
              onClick={() => onToggleAboutDialog && onToggleAboutDialog(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}