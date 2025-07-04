import { AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Button } from "../ui/button";
import { MapPin, Phone, Navigation, Building2, FileText, Trash2, Edit } from "lucide-react";
import { Circle } from "../geometry/circle";
import type { AdministrativeOffice } from "../../data/administrative-offices";
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
    onOfficeEdit
}: AdministrativeOfficesProps) {
    const [selectedOffice, setSelectedOffice] = useState<AdministrativeOffice | null>(null);
    const [editingOffice, setEditingOffice] = useState<AdministrativeOffice | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        const baseColors = {
            'A': {
                fillColor: '#EF4444',   // strong red
                strokeColor: '#B91C1C', // dark red
            },
            'B': {
                fillColor: '#3B82F6',   // vibrant blue
                strokeColor: '#1D4ED8', // deep blue
            },
            'C': {
                fillColor: '#10B981',   // bright green
                strokeColor: '#047857', // dark green
            },
        };

        const colors = baseColors[layer] || {
            fillColor: '#9CA3AF',   // neutral gray (still visible)
            strokeColor: '#4B5563', // darker gray
        };

        // Dim colors when direction mode is active
        if (directionMode) {
            return {
                fillColor: colors.fillColor,
                strokeColor: colors.strokeColor,
                fillOpacity: 0.15, // Much more transparent
                strokeOpacity: 0.1,
            };
        }

        return {
            ...colors,
            fillOpacity: 0.4,
            strokeOpacity: 0.2,
        };
    };


    // Get marker appearance based on direction mode selection
    const getMarkerAppearance = (office: AdministrativeOffice) => {
        if (directionMode) {
            if (selectedStartOffice?.id === office.id) {
                return {
                    background: "#10B981", // Green for start
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
                    background: getLayerColor(office.layer),
                    borderColor: "#FFFFFF",
                    glyphColor: "#FFFFFF",
                    scale: office.layer === 'A' ? 0.9 : 0.7, // Smaller for less prominence
                    zIndex: 10,
                };
            }
        } else {
            return {
                background: getLayerColor(office.layer),
                borderColor: "#FFFFFF",
                glyphColor: "#FFFFFF",
                scale: office.layer === 'A' ? 1.1 : 0.9,
                zIndex: 100,
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
            {showCircles && offices.map((office) => {
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
            })}

            {/* Office markers */}
            {offices.map((office) => {
                const appearance = getMarkerAppearance(office);
                return (
                    <AdvancedMarker
                        key={office.id}
                        position={office.location}
                        onClick={() => handleMarkerClick(office)}
                        zIndex={appearance.zIndex}
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
