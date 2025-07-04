import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { 
  Building2, 
  Circle as CircleIcon, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { useState } from "react";
import { layerConfigurations } from "../../data/administrative-offices";

interface AdministrativeControlsProps {
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
  layerBRadius: number;
  layerCRadius: number;
  onLayerAReceptionRadiusChange: (radius: number) => void;
  onLayerAManagementRadiusChange: (radius: number) => void;
  onLayerBRadiusChange: (radius: number) => void;
  onLayerCRadiusChange: (radius: number) => void;
  // Layer B within Layer A controls
  hideLayerBWithinA: boolean;
  onToggleHideLayerBWithinA: (hide: boolean) => void;
  useManagementRadiusForHiding: boolean;
  onToggleUseManagementRadiusForHiding: (use: boolean) => void;
  layerBWithinACount?: number;
}

export function AdministrativeControls({
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
  layerBRadius,
  layerCRadius,
  onLayerAReceptionRadiusChange,
  onLayerAManagementRadiusChange,
  onLayerBRadiusChange,
  onLayerCRadiusChange,
  hideLayerBWithinA,
  onToggleHideLayerBWithinA,
  useManagementRadiusForHiding,
  onToggleUseManagementRadiusForHiding,
  layerBWithinACount = 0,
}: AdministrativeControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const layerCount = [showLayerA, showLayerB, showLayerC].filter(Boolean).length;

  return (
    <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-3">
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
            </div>
            <div>
              <span className="text-sm font-medium">Trụ sở hành chính</span>
              {!expanded && (
                <div className="text-xs text-gray-500">
                  {layerCount > 0 ? `${layerCount} lớp hiển thị` : 'Tất cả ẩn'}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded Controls */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Service Coverage Toggle */}
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="show-circles"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full">
                    <CircleIcon className="w-4 h-4 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Vùng phủ sóng
                    </p>
                    <p className="text-xs text-gray-600">
                      Bán kính phục vụ
                    </p>
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
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center bg-red-100 rounded-full">
                    <Building2 className="w-4 h-4 text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Lớp A - Tiếp nhận: {layerAReceptionRadius}km, Quản lý: {layerAManagementRadius}km
                    </p>
                    <p className="text-xs text-red-700">
                      {layerConfigurations.A.count} Chi nhánh (2 vòng)
                    </p>
                  </div>
                </Label>
                <Switch
                  id="show-layer-a"
                  checked={showLayerA}
                  onCheckedChange={onToggleLayerA}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              
              {/* Layer A Dual Radius Controls */}
              {showLayerA && (
                <div className="mt-2 px-2 space-y-2">
                  {/* Reception Radius */}
                  <div>
                    <Label htmlFor="layer-a-reception-radius" className="text-xs text-red-700">
                      Bán kính tiếp nhận (km):
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
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
                      <span className="text-xs text-red-600">km</span>
                    </div>
                  </div>
                  
                  {/* Management Radius */}
                  <div>
                    <Label htmlFor="layer-a-management-radius" className="text-xs text-red-700">
                      Bán kính quản lý (km):
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
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
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center bg-blue-100 rounded-full">
                    <Building2 className="w-4 h-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Lớp B - {layerBRadius}km
                    </p>
                    <p className="text-xs text-blue-700">
                      {layerConfigurations.B.count} Phường/Xã hiện tại
                    </p>
                  </div>
                </Label>
                <Switch
                  id="show-layer-b"
                  checked={showLayerB}
                  onCheckedChange={onToggleLayerB}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              
              {/* Layer B Radius Control */}
              {showLayerB && (
                <div className="mt-2 px-2 space-y-3">
                  {/* Radius Control */}
                  <div>
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

                  {/* Layer B within Layer A Controls */}
                  {showLayerA && (
                    <div className="border-t border-blue-200 pt-2">
                      <Label className="text-xs text-blue-700 font-medium">
                        Lớp B trong vùng Lớp A:
                      </Label>
                      
                      {/* Hide Layer B within A toggle */}
                      <div className="flex items-center justify-between mt-1">
                        <Label htmlFor="hide-layer-b-within-a" className="text-xs text-blue-600">
                          Ẩn Lớp B trong vùng A ({layerBWithinACount})
                        </Label>
                        <Switch
                          id="hide-layer-b-within-a"
                          checked={hideLayerBWithinA}
                          onCheckedChange={onToggleHideLayerBWithinA}
                          className="data-[state=checked]:bg-blue-500 scale-75"
                        />
                      </div>

                      {/* Radius selection for hiding */}
                      <div className="flex items-center justify-between mt-1">
                        <Label htmlFor="use-management-radius" className="text-xs text-blue-600">
                          Dùng bán kính quản lý
                        </Label>
                        <Switch
                          id="use-management-radius"
                          checked={useManagementRadiusForHiding}
                          onCheckedChange={onToggleUseManagementRadiusForHiding}
                          className="data-[state=checked]:bg-blue-500 scale-75"
                        />
                      </div>
                      
                      <div className="text-xs text-blue-500 mt-1">
                        {useManagementRadiusForHiding 
                          ? `Sử dụng bán kính quản lý (${layerAManagementRadius}km)` 
                          : `Sử dụng bán kính tiếp nhận (${layerAReceptionRadius}km)`
                        }
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
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-7 h-7 flex items-center justify-center bg-green-100 rounded-full">
                    <Building2 className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Lớp C - {layerCRadius}km
                    </p>
                    <p className="text-xs text-green-700">
                      {layerConfigurations.C.count} Phường/Xã cũ
                    </p>
                  </div>
                </Label>
                <Switch
                  id="show-layer-c"
                  checked={showLayerC}
                  onCheckedChange={onToggleLayerC}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              
              {/* Layer C Radius Control */}
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
            <div className="flex gap-2 pt-1">
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
        )}
      </div>
    </div>
  );
}
