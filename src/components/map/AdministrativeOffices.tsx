import { AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Phone, Navigation, Building2, FileText, Target } from "lucide-react";
import { Circle } from "../geometry/circle";
import type { AdministrativeOffice } from "../../data/administrative-offices";
import type { PolygonData } from "../../data/polygon-utils";
import { getCoveredAreas, doCirclesOverlap } from "../../utils/coverage-analysis";

interface AdministrativeOfficesProps {
    offices: AdministrativeOffice[];
    visible: boolean;
    showCircles: boolean;
    userLocation?: { lat: number; lng: number } | null;
    polygons?: PolygonData[]; // Added for coverage analysis
    onOfficeClick?: (office: AdministrativeOffice) => void;
}

export function AdministrativeOffices({
    offices,
    visible,
    showCircles,
    userLocation,
    polygons = [],
    onOfficeClick
}: AdministrativeOfficesProps) {
    const [selectedOffice, setSelectedOffice] = useState<AdministrativeOffice | null>(null);

    // Helper function to create Google Maps directions URL
    const getGoogleMapsDirectionsUrl = (lat: number, lng: number): string => {
        let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

        // Add origin parameter if user location is available
        if (userLocation) {
            url += `&origin=${userLocation.lat},${userLocation.lng}`;
        }

        return url;
    };

    // Get color based on layer
    const getLayerColor = (layer: 'A' | 'B' | 'C') => {
        switch (layer) {
            case 'A':
                return '#DC2626'; // Red
            case 'B':
                return '#2563EB'; // Blue
            case 'C':
                return '#059669'; // Green
            default:
                return '#6B7280'; // Gray
        }
    };

    // Get circle colors based on layer
    const getCircleColors = (layer: 'A' | 'B' | 'C') => {
        switch (layer) {
            case 'A':
                return {
                    fillColor: '#EF4444',   // strong red
                    strokeColor: '#B91C1C', // dark red
                };
            case 'B':
                return {
                    fillColor: '#3B82F6',   // vibrant blue
                    strokeColor: '#1D4ED8', // deep blue
                };
            case 'C':
                return {
                    fillColor: '#10B981',   // bright green
                    strokeColor: '#047857', // dark green
                };
            default:
                return {
                    fillColor: '#9CA3AF',   // neutral gray (still visible)
                    strokeColor: '#4B5563', // darker gray
                };
        }
    };


    const handleMarkerClick = (office: AdministrativeOffice) => {
        setSelectedOffice(office);
        onOfficeClick?.(office);
    };

    if (!visible) return null;

    return (
        <>
            {/* Service coverage circles */}
            {showCircles && offices.map((office) => {
                const colors = getCircleColors(office.layer);
                return (
                    <Circle
                        key={`circle-${office.id}`}
                        center={office.location}
                        radius={office.radius * 1000} // Convert km to meters
                        fillColor={colors.fillColor}
                        fillOpacity={0.4}
                        strokeColor={colors.strokeColor}
                        strokeOpacity={0.2}
                        strokeWeight={1.5}
                        clickable={false}
                    />
                );
            })}

            {/* Office markers */}
            {offices.map((office) => (
                <AdvancedMarker
                    key={office.id}
                    position={office.location}
                    onClick={() => handleMarkerClick(office)}
                >
                    <Pin
                        background={getLayerColor(office.layer)}
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                        scale={office.layer === 'A' ? 1.1 : 0.9}
                    />
                </AdvancedMarker>
            ))}

            {/* Info window for selected office */}
            {selectedOffice && (
                <InfoWindow
                    position={selectedOffice.location}
                    onCloseClick={() => setSelectedOffice(null)}
                >
                    <div className="w-80 max-w-full p-0 bg-white rounded-lg overflow-hidden">
                        <div className="relative">
                            <div className="px-4 pb-2 pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getLayerColor(selectedOffice.layer) }}
                                    />
                                    <span className="text-xs font-medium text-gray-500">
                                        Lớp {selectedOffice.layer} {selectedOffice.layer === 'A' ? '(Quận/Huyện cũ)' : selectedOffice.layer === 'B' ? '(Phường/Xã hiện tại)' : '(Phường/Xã cũ)'} - Bán kính {selectedOffice.radius}km
                                    </span>
                                </div>
                                <h2 className="font-semibold text-sm leading-tight">
                                    {selectedOffice.name}
                                </h2>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                            {/* Address */}
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-0.5">Địa chỉ</div>
                                    <div className="text-sm">{selectedOffice.address}</div>
                                </div>
                            </div>

                            {/* Phone */}
                            {selectedOffice.phone && (
                                <div className="flex items-start gap-3">
                                    <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                                        <Phone className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500 mb-0.5">Điện thoại</div>
                                        <div className="text-sm">{selectedOffice.phone}</div>
                                    </div>
                                </div>
                            )}

                            {/* Statistics */}
                            {(selectedOffice.procedures_2024 || selectedOffice.procedures_6months_2025) && (
                                <div className="pt-1">
                                    <div className="text-xs text-gray-500 mb-2">Thống kê hồ sơ TTHC:</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedOffice.procedures_2024 && (
                                            <div className="bg-blue-50 rounded-lg p-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <FileText className="w-3 h-3 text-blue-600" />
                                                    <span className="text-xs text-blue-600 font-medium">2024</span>
                                                </div>
                                                <div className="text-sm font-semibold text-blue-900">
                                                    {selectedOffice.procedures_2024.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-blue-600">hồ sơ</div>
                                            </div>
                                        )}
                                        {selectedOffice.procedures_6months_2025 && (
                                            <div className="bg-green-50 rounded-lg p-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <FileText className="w-3 h-3 text-green-600" />
                                                    <span className="text-xs text-green-600 font-medium">6 tháng đầu 2025</span>
                                                </div>
                                                <div className="text-sm font-semibold text-green-900">
                                                    {selectedOffice.procedures_6months_2025.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-green-600">hồ sơ</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Coverage Analysis */}
                            {polygons.length > 0 && (
                                <div className="pt-1">
                                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        Phân tích vùng phủ:
                                    </div>
                                    {(() => {
                                        const coveredAreas = getCoveredAreas(selectedOffice, polygons);
                                        const overlappingOffices = offices.filter(office => 
                                            office.id !== selectedOffice.id && 
                                            doCirclesOverlap(
                                                selectedOffice.location, 
                                                selectedOffice.radius,
                                                office.location,
                                                office.radius
                                            )
                                        );
                                        
                                        return (
                                            <div className="space-y-2">
                                                {/* Covered areas */}
                                                <div className="bg-blue-50 rounded-lg p-2">
                                                    <div className="text-xs text-blue-600 font-medium mb-1">
                                                        Khu vực được phủ ({coveredAreas.length})
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {coveredAreas.slice(0, 3).map(area => (
                                                            <Badge
                                                                key={area}
                                                                variant="secondary"
                                                                className="text-xs h-5"
                                                            >
                                                                {area}
                                                            </Badge>
                                                        ))}
                                                        {coveredAreas.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs h-5">
                                                                +{coveredAreas.length - 3}
                                                            </Badge>
                                                        )}
                                                        {coveredAreas.length === 0 && (
                                                            <span className="text-xs text-gray-500">
                                                                Không phủ khu vực nào
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Overlapping offices */}
                                                {overlappingOffices.length > 0 && (
                                                    <div className="bg-orange-50 rounded-lg p-2">
                                                        <div className="text-xs text-orange-600 font-medium mb-1">
                                                            Chồng lấp với ({overlappingOffices.length})
                                                        </div>
                                                        <div className="space-y-1">
                                                            {overlappingOffices.slice(0, 2).map(office => (
                                                                <div key={office.id} className="flex items-center gap-1">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ 
                                                                            backgroundColor: office.layer === 'A' ? '#DC2626' : 
                                                                                           office.layer === 'B' ? '#2563EB' : '#059669'
                                                                        }}
                                                                    />
                                                                    <span className="text-xs truncate">
                                                                        Lớp {office.layer} - {office.name.length > 20 ? 
                                                                            office.name.substring(0, 20) + '...' : office.name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {overlappingOffices.length > 2 && (
                                                                <div className="text-xs text-orange-600">
                                                                    +{overlappingOffices.length - 2} khác
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Region info */}
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-0.5">Khu vực</div>
                                    <div className="text-sm">{selectedOffice.region}</div>
                                    {selectedOffice.old_commune_ward && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Thuộc {selectedOffice.old_commune_ward} cũ
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="px-4 py-3 flex gap-3">
                            <Button
                                size="sm"
                                className="flex-1 bg-white"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(
                                        getGoogleMapsDirectionsUrl(
                                            selectedOffice.location.lat,
                                            selectedOffice.location.lng
                                        ),
                                        '_blank'
                                    );
                                }}
                            >
                                <Navigation className="w-4 h-4 mr-1.5" />
                                Chỉ đường
                            </Button>

                            {selectedOffice.phone && (
                                <Button
                                    size="sm"
                                    className="flex-1 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `tel:${selectedOffice.phone}`;
                                    }}
                                >
                                    <Phone className="w-4 h-4 mr-1.5" />
                                    Gọi điện
                                </Button>
                            )}
                        </div>
                    </div>
                </InfoWindow>
            )}
        </>
    );
}
