import { AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { MapPin, Phone, Navigation, Building2, FileText, Trash2, Edit } from "lucide-react";
import { Circle } from "../geometry/circle";
import type { AdministrativeOffice } from "../../data/administrative-offices";
import { isLayerBWithinLayerA } from "../../data/administrative-offices";
import { EditOfficeModal } from "./EditOfficeModal";

interface AdministrativeOfficesProps {
    offices: AdministrativeOffice[];
    visible: boolean;
    showCircles: boolean;
    userLocation?: { lat: number; lng: number } | null;
    directionMode?: boolean;
    selectedStartOffice?: AdministrativeOffice | null;
    selectedEndOffice?: AdministrativeOffice | null;
    isLoadingRoute?: boolean;
    onOfficeClick?: (office: AdministrativeOffice) => void;
    editMode?: boolean;
    onMarkerDrag?: (office: AdministrativeOffice, newPosition: {lat: number, lng: number}) => void;
    onMarkerDelete?: (office: AdministrativeOffice) => void;
    onOfficeEdit?: (office: AdministrativeOffice, updates: Partial<AdministrativeOffice>) => void;
    // Layer B within Layer A controls
    hideLayerBWithinA?: boolean;
    useManagementRadiusForHiding?: boolean;
    // Fill opacity control
    fillOpacity?: number;
}

export function AdministrativeOffices({
    offices,
    visible,
    showCircles,
    userLocation,
    directionMode = false,
    selectedStartOffice,
    selectedEndOffice,
    isLoadingRoute = false,
    onOfficeClick,
    editMode = false,
    onMarkerDrag,
    onMarkerDelete,
    onOfficeEdit,
    hideLayerBWithinA = false,
    useManagementRadiusForHiding = false,
    fillOpacity = 0.3,
}: AdministrativeOfficesProps) {
    const [selectedOffice, setSelectedOffice] = useState<AdministrativeOffice | null>(null);
    const [editingOffice, setEditingOffice] = useState<AdministrativeOffice | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Process offices to determine which Layer B offices are within Layer A circles
    const processedOffices = useMemo(() => {
        const layerAOffices = offices.filter(office => office.layer === 'A');
        const layerBOffices = offices.filter(office => office.layer === 'B');
        const layerCOffices = offices.filter(office => office.layer === 'C');
        
        // Check which Layer B offices are within Layer A circles
        const layerBWithinA: AdministrativeOffice[] = [];
        const layerBOutsideA: AdministrativeOffice[] = [];
        
        for (const layerBOffice of layerBOffices) {
            const result = isLayerBWithinLayerA(layerBOffice, layerAOffices, useManagementRadiusForHiding);
            if (result.isWithin) {
                layerBWithinA.push(layerBOffice);
            } else {
                layerBOutsideA.push(layerBOffice);
            }
        }
        
        // Determine which offices to show
        const visibleOffices = [...layerAOffices, ...layerCOffices];
        
        if (hideLayerBWithinA) {
            // Show only Layer B offices outside Layer A circles
            visibleOffices.push(...layerBOutsideA);
        } else {
            // Show all Layer B offices
            visibleOffices.push(...layerBOffices);
        }
        
        return {
            visibleOffices,
            layerBWithinA,
            layerBOutsideA,
        };
    }, [offices, hideLayerBWithinA, useManagementRadiusForHiding]);

    // Helper function to check if a Layer B office should be dimmed
    const isLayerBDimmed = (office: AdministrativeOffice): boolean => {
        if (office.layer !== 'B' || hideLayerBWithinA) return false;
        
        const layerAOffices = offices.filter(o => o.layer === 'A');
        const result = isLayerBWithinLayerA(office, layerAOffices, useManagementRadiusForHiding);
        return result.isWithin;
    };

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
                return '#EAB308'; // Yellow
            default:
                return '#6B7280'; // Gray
        }
    };

    // Get circle colors based on layer and circle type
    const getCircleColors = (layer: 'A' | 'B' | 'C', circleType?: 'management' | 'reception') => {
        const baseColors = {
            'A': {
                management: {
                    fillColor: '#EF4444',   // strong red for management circle
                    strokeColor: '#B91C1C', // dark red for management circle
                },
                reception: {
                    fillColor: '#F97316',   // orange for reception circle
                    strokeColor: '#EA580C', // dark orange for reception circle
                }
            },
            'B': {
                fillColor: '#3B82F6',   // vibrant blue
                strokeColor: '#1D4ED8', // deep blue
            },
            'C': {
                fillColor: '#FBBF24',   // bright yellow
                strokeColor: '#D97706', // dark yellow/amber
            },
        };

        let colors;
        if (layer === 'A' && circleType) {
            colors = baseColors[layer][circleType];
        } else if (layer !== 'A') {
            colors = baseColors[layer];
        } else {
            colors = {
                fillColor: '#9CA3AF',   // neutral gray (fallback)
                strokeColor: '#4B5563', // darker gray (fallback)
            };
        }

        // Dim colors when direction mode is active
        if (directionMode) {
            return {
                fillColor: colors.fillColor,
                strokeColor: colors.strokeColor,
                fillOpacity: fillOpacity * 0.5, // Half of the base opacity when dimmed
                strokeOpacity: 0.1,
            };
        }

        return {
            ...colors,
            fillOpacity: fillOpacity,
            strokeOpacity: 0.2,
        };
    };


    // Get marker appearance based on direction mode selection
    const getMarkerAppearance = (office: AdministrativeOffice) => {
        const isDimmed = isLayerBDimmed(office);
        
        if (directionMode) {
            if (selectedStartOffice?.id === office.id) {
                return {
                    background: "#FBBF24", // Yellow for start
                    borderColor: "#FFFFFF",
                    glyphColor: "#FFFFFF",
                    scale: 1.4, // Larger for better visibility
                    zIndex: 1000,
                };
            } else if (selectedEndOffice?.id === office.id) {
                return {
                    background: "#EF4444", // Red for end
                    borderColor: "#FFFFFF", 
                    glyphColor: "#FFFFFF",
                    scale: 1.4, // Larger for better visibility
                    zIndex: 1000,
                };
            } else if (isLoadingRoute && selectedStartOffice) {
                // Show muted appearance when loading route
                return {
                    background: "#D1D5DB", // Gray when loading
                    borderColor: "#FFFFFF",
                    glyphColor: "#9CA3AF",
                    scale: office.layer === 'A' ? 0.8 : 0.6, // Smaller when dimmed
                    zIndex: 10,
                };
            } else {
                // Non-selected markers in direction mode should be less prominent
                return {
                    background: isDimmed ? "#94A3B8" : getLayerColor(office.layer), // Dimmed color for Layer B within A
                    borderColor: "#FFFFFF",
                    glyphColor: "#FFFFFF",
                    scale: office.layer === 'A' ? 0.9 : 0.7, // Smaller for less prominence
                    zIndex: isDimmed ? 5 : 10, // Lower z-index for dimmed markers
                };
            }
        } else {
            return {
                background: isDimmed ? "#94A3B8" : getLayerColor(office.layer), // Dimmed color for Layer B within A
                borderColor: "#FFFFFF",
                glyphColor: "#FFFFFF",
                scale: isDimmed ? 0.7 : (office.layer === 'A' ? 1.1 : 0.9), // Smaller scale for dimmed markers
                zIndex: isDimmed ? 50 : 100, // Lower z-index for dimmed markers
            };
        }
    };

    const handleMarkerClick = (office: AdministrativeOffice) => {
        if (directionMode) {
            // In direction mode, delegate to the direction selection handler
            onOfficeClick?.(office);
        } else {
            // In normal mode, show info window
            setSelectedOffice(office);
            onOfficeClick?.(office);
        }
    };

    if (!visible) return null;

    return (
        <>
            {/* Service coverage circles */}
            {showCircles && processedOffices.visibleOffices.map((office) => {
                
                if (office.layer === 'A') {
                    // Layer A (Chi nhánh) has dual circles: management and reception
                    const managementColors = getCircleColors(office.layer, 'management');
                    const receptionColors = getCircleColors(office.layer, 'reception');
                    
                    return (
                        <div key={`circle-${office.id}`}>
                            {/* Management Circle (Outer, larger) */}
                            <Circle
                                key={`management-circle-${office.id}`}
                                center={office.location}
                                radius={(office.managementRadius || 15) * 1000} // Convert km to meters
                                fillColor={managementColors.fillColor}
                                fillOpacity={directionMode ? fillOpacity * 0.3 : fillOpacity * 0.7} // More transparent for outer circle
                                strokeColor={managementColors.strokeColor}
                                strokeOpacity={directionMode ? 0.1 : 0.3}
                                strokeWeight={directionMode ? 1 : 2}
                                clickable={false}
                                zIndex={directionMode ? 1 : 4}
                            />
                            {/* Reception Circle (Inner, smaller) */}
                            <Circle
                                key={`reception-circle-${office.id}`}
                                center={office.location}
                                radius={(office.receptionRadius || 5) * 1000} // Convert km to meters
                                fillColor={receptionColors.fillColor}
                                fillOpacity={receptionColors.fillOpacity} // Use dynamic opacity from getCircleColors
                                strokeColor={receptionColors.strokeColor}
                                strokeOpacity={receptionColors.strokeOpacity}
                                strokeWeight={directionMode ? 1 : 1.5}
                                clickable={false}
                                zIndex={directionMode ? 2 : 5}
                            />
                        </div>
                    );
                } else {
                    // Layer B and C have single circles
                    const colors = getCircleColors(office.layer);
                    return (
                        <Circle
                            key={`circle-${office.id}`}
                            center={office.location}
                            radius={office.radius * 1000} // Convert km to meters
                            fillColor={colors.fillColor}
                            fillOpacity={colors.fillOpacity}
                            strokeColor={colors.strokeColor}
                            strokeOpacity={colors.strokeOpacity}
                            strokeWeight={directionMode ? 1 : 1.5}
                            clickable={false}
                            zIndex={directionMode ? 1 : 5}
                        />
                    );
                }
            })}

            {/* Office markers */}
            {processedOffices.visibleOffices.map((office) => {
                const appearance = getMarkerAppearance(office);
                const isDimmed = isLayerBDimmed(office);
                
                return (
                    <AdvancedMarker
                        key={office.id}
                        position={office.location}
                        onClick={() => handleMarkerClick(office)}
                        zIndex={isDimmed ? appearance.zIndex - 10 : appearance.zIndex}
                        draggable={editMode}
                        onDragEnd={(event) => {
                            if (editMode && onMarkerDrag && event.latLng) {
                                onMarkerDrag(office, {
                                    lat: event.latLng.lat(),
                                    lng: event.latLng.lng()
                                });
                            }
                        }}
                    >
                        <Pin
                            background={appearance.background}
                            borderColor={appearance.borderColor}
                            glyphColor={appearance.glyphColor}
                            scale={appearance.scale}
                        />
                    </AdvancedMarker>
                );
            })}

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
                                            <div className="bg-yellow-50 rounded-lg p-2">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <FileText className="w-3 h-3 text-yellow-600" />
                                                    <span className="text-xs text-yellow-600 font-medium">6 tháng đầu 2025</span>
                                                </div>
                                                <div className="text-sm font-semibold text-yellow-900">
                                                    {selectedOffice.procedures_6months_2025.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-yellow-600">hồ sơ</div>
                                            </div>
                                        )}
                                    </div>
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
                        <div className="px-4 py-3 flex gap-2">
                            {/* Edit mode buttons */}
                            {editMode && (
                                <>
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingOffice(selectedOffice);
                                            setIsEditModalOpen(true);
                                        }}
                                    >
                                        <Edit className="w-4 h-4 mr-1.5" />
                                        Sửa
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-white hover:bg-red-50 border-red-200 hover:border-red-300 text-red-700"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMarkerDelete?.(selectedOffice);
                                            setSelectedOffice(null);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        {selectedOffice.id.startsWith('custom-') ? 'Xóa' : 'Ẩn'}
                                    </Button>
                                </>
                            )}
                            
                            {/* Regular action buttons (only show when not in edit mode) */}
                            {!editMode && (
                                <>
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
                                            className="flex-1 bg-white hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300 text-yellow-700"
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
                                </>
                            )}
                        </div>
                    </div>
                </InfoWindow>
            )}

            {/* Edit Office Modal */}
            <EditOfficeModal
                office={editingOffice}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingOffice(null);
                }}
                onSave={(office: AdministrativeOffice, updates: Partial<AdministrativeOffice>) => {
                    onOfficeEdit?.(office, updates);
                    setIsEditModalOpen(false);
                    setEditingOffice(null);
                    setSelectedOffice(null);
                }}
            />
        </>
    );
}
