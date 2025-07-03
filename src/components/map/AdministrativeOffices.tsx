import { AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Button } from "../ui/button";
import { MapPin, Phone, Navigation, Building2, Users, Activity } from "lucide-react";
import { Circle } from "../geometry/circle";
import type { AdministrativeOffice } from "../../data/administrative-offices";

interface AdministrativeOfficesProps {
  offices: AdministrativeOffice[];
  visible: boolean;
  showCircles: boolean;
  userLocation?: { lat: number; lng: number } | null;
  onOfficeClick?: (office: AdministrativeOffice) => void;
}

export function AdministrativeOffices({ 
  offices, 
  visible, 
  showCircles, 
  userLocation, 
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
          fillColor: '#FEE2E2',
          strokeColor: '#DC2626',
        };
      case 'B':
        return {
          fillColor: '#DBEAFE',
          strokeColor: '#2563EB',
        };
      case 'C':
        return {
          fillColor: '#D1FAE5',
          strokeColor: '#059669',
        };
      default:
        return {
          fillColor: '#F3F4F6',
          strokeColor: '#6B7280',
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
            fillOpacity={0.1}
            strokeColor={colors.strokeColor}
            strokeOpacity={0.4}
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
                    Lớp {selectedOffice.layer} - Bán kính {selectedOffice.radius}km
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
                  <div className="text-xs text-gray-500 mb-2">Thống kê thủ tục</div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOffice.procedures_2024 && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Activity className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">2024</span>
                        </div>
                        <div className="text-sm font-semibold text-blue-900">
                          {selectedOffice.procedures_2024.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">thủ tục</div>
                      </div>
                    )}
                    {selectedOffice.procedures_6months_2025 && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">6T đầu 2025</span>
                        </div>
                        <div className="text-sm font-semibold text-green-900">
                          {selectedOffice.procedures_6months_2025.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">thủ tục</div>
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
