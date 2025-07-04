import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Layers, 
  ChevronUp, 
  Target,
  AlertCircle,
  Info
} from "lucide-react";
import type { AdministrativeOffice } from "../../data/administrative-offices";
import type { PolygonData } from "../../data/polygon-utils";
import { 
  analyzeCoverage, 
  type CoverageAnalysis, 
  type CoverageOverlap 
} from "../../utils/coverage-analysis";
import { useIsMobile } from "../../hooks/use-mobile";

interface CoverageOverlapPanelProps {
  offices: AdministrativeOffice[];
  polygons: PolygonData[];
  visible: boolean;
  onOverlapClick?: (overlap: CoverageOverlap) => void;
}

export function CoverageOverlapPanel({
  offices,
  polygons,
  visible,
  onOverlapClick
}: CoverageOverlapPanelProps) {
  const [analysis, setAnalysis] = useState<CoverageAnalysis | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overlaps' | 'coverage'>('overlaps');
  const isMobile = useIsMobile();

  // Collapse panel on mobile by default
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  // Recalculate analysis when offices or polygons change
  useEffect(() => {
    if (offices.length > 0 && polygons.length > 0) {
      const newAnalysis = analyzeCoverage(offices, polygons);
      setAnalysis(newAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [offices, polygons]);

  if (!visible || !analysis) return null;

  const hasOverlaps = analysis.overlaps.length > 0;
  const layerColors = {
    A: '#DC2626', // Red
    B: '#2563EB', // Blue  
    C: '#059669'  // Green
  };

  return (
    <div className="fixed md:absolute bottom-4 left-4 z-10 flex flex-col items-start">
      <Card
        className={`
          bg-white/95 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out
          border border-gray-200 flex flex-col
          ${expanded
            ? 'opacity-100 shadow-md'
            : 'opacity-95 shadow-sm'
          }
        `}
        style={{
          maxHeight: expanded ? 'calc(100vh - 8rem)' : '3rem',
          minWidth: isMobile ? '300px' : '350px',
          width: isMobile ? '300px' : '350px',
        }}
      >
        {/* Header */}
        <div
          className={`
            flex items-center justify-between cursor-pointer flex-shrink-0
            ${expanded ? 'p-3 pb-0' : 'p-2'}
          `}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
              <Target className="w-3.5 h-3.5 text-orange-700" />
            </div>
            <div>
              <span className="text-sm font-medium">Phân tích vùng phủ</span>
              {!expanded && (
                <div className="text-xs text-gray-500">
                  {hasOverlaps ? `${analysis.overlaps.length} vùng chồng lấp` : 'Không có chồng lấp'}
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

        {/* Content */}
        {expanded && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex-shrink-0 px-3 pt-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={selectedTab === 'overlaps' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSelectedTab('overlaps')}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Chồng lấp ({analysis.overlaps.length})
                </Button>
                <Button
                  variant={selectedTab === 'coverage' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSelectedTab('coverage')}
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Vùng phủ
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {selectedTab === 'overlaps' && (
                <div className="space-y-2">
                  {hasOverlaps ? (
                    analysis.overlaps.map((overlap, index) => (
                      <Card
                        key={overlap.id}
                        className="p-3 border border-orange-200 bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-colors"
                        onClick={() => onOverlapClick?.(overlap)}
                      >
                        <div className="space-y-2">
                          {/* Overlap header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">
                                Vùng chồng lấp #{index + 1}
                              </div>
                              <div className="flex gap-1">
                                {overlap.layers.map(layer => (
                                  <Badge
                                    key={layer}
                                    variant="outline"
                                    className="text-xs h-5"
                                    style={{
                                      borderColor: layerColors[layer],
                                      color: layerColors[layer]
                                    }}
                                  >
                                    Lớp {layer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Offices involved */}
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 font-medium">
                              Trụ sở liên quan ({overlap.offices.length}):
                            </div>
                            {overlap.offices.map(office => (
                              <div 
                                key={office.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: layerColors[office.layer] }}
                                />
                                <span className="truncate">{office.name}</span>
                              </div>
                            ))}
                          </div>

                          {/* Covered areas */}
                          {overlap.coveredAreas.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 font-medium">
                                Khu vực được phủ ({overlap.coveredAreas.length}):
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {overlap.coveredAreas.slice(0, 4).map(area => (
                                  <Badge
                                    key={area}
                                    variant="secondary"
                                    className="text-xs h-5"
                                  >
                                    {area}
                                  </Badge>
                                ))}
                                {overlap.coveredAreas.length > 4 && (
                                  <Badge variant="secondary" className="text-xs h-5">
                                    +{overlap.coveredAreas.length - 4} khác
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">
                        Không có vùng chồng lấp
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Các lớp dịch vụ không chồng lấp lên nhau
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'coverage' && (
                <div className="space-y-3">
                  {(['A', 'B', 'C'] as const).map(layer => {
                    const coverage = analysis.totalCoverage[`layer${layer}`];
                    const layerOffices = offices.filter(o => o.layer === layer);
                    
                    return (
                      <Card key={layer} className="p-3 border border-gray-200">
                        <div className="space-y-2">
                          {/* Layer header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: layerColors[layer] }}
                              />
                              <div className="text-sm font-medium">
                                Lớp {layer}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {layerOffices.length} trụ sở
                            </Badge>
                          </div>

                          {/* Coverage stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 rounded p-2">
                              <div className="text-gray-600">Khu vực phủ</div>
                              <div className="font-semibold">{coverage.length}</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <div className="text-gray-600">Số trụ sở</div>
                              <div className="font-semibold">{layerOffices.length}</div>
                            </div>
                          </div>

                          {/* Covered areas */}
                          {coverage.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 font-medium">
                                Danh sách khu vực:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {coverage.slice(0, 6).map(area => (
                                  <Badge
                                    key={area}
                                    variant="secondary"
                                    className="text-xs h-5"
                                  >
                                    {area}
                                  </Badge>
                                ))}
                                {coverage.length > 6 && (
                                  <Badge variant="secondary" className="text-xs h-5">
                                    +{coverage.length - 6} khác
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
