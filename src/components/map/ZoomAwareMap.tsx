import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import type { MapMouseEvent } from "@vis.gl/react-google-maps";

interface ZoomAwareMapProps {
    id: string;
    defaultCenter: google.maps.LatLngLiteral;
    defaultZoom: number;
    mapId: string;
    onClick?: (event: MapMouseEvent) => void;
    className?: string;
    disableDefaultUI?: boolean;
    children?: ReactNode;
    onZoomChange?: (zoom: number) => void;
    initialBounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    useDefaultZoom?: boolean; // Optional prop to control initial zoom behavior
    mapTypeId?: "roadmap" | "satellite"; // Map type prop
}

export function ZoomAwareMap({
    id,
    defaultCenter,
    defaultZoom,
    mapId,
    onClick,
    className,
    disableDefaultUI,
    children,
    onZoomChange,
    initialBounds,
    useDefaultZoom = false, // Default to false if not provided
    mapTypeId = "roadmap", // Default to roadmap if not provided
}: ZoomAwareMapProps) {
    return (
        <Map
            id={id}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            mapId={mapId}
            onClick={onClick}
            className={className}
            gestureHandling={'greedy'}
            disableDefaultUI={disableDefaultUI}
            mapTypeId={mapTypeId}
            restriction={{
                latLngBounds: {
                    north: 23.5,   // Top of Northern Vietnam
                    south: 8.2,    // Southern tip of Vietnam (Cà Mau)
                    west: 102.1,   // Westernmost point (Lai Châu, Điện Biên)
                    east: 115.0,   // Far out into the East Sea to cover Trường Sa/Hoàng Sa
                },
                strictBounds: false // optional, allows slight scroll beyond
            }}

        >
            <ZoomHandler onZoomChange={onZoomChange} initialBounds={initialBounds} useDefaultZoom={useDefaultZoom} zoom={defaultZoom} />
            {children}
        </Map>
    );
}

interface ZoomHandlerProps {
    onZoomChange?: (zoom: number) => void;
    initialBounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    useDefaultZoom?: boolean;
    zoom?: number; // Optional prop to control initial zoom level
}

function ZoomHandler({ onZoomChange, initialBounds, useDefaultZoom, zoom = 11 }: ZoomHandlerProps) {
    const map = useMap();
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!map) return;

        // Set initial zoom to 11 and center instead of fitting bounds
        if (!initializedRef.current) {
            if (useDefaultZoom) {
                map.setZoom(zoom); // Set fixed initial zoom level to 11 for showing all administrative boundaries
            } else if (initialBounds) {
                map.fitBounds(initialBounds);
            }
            
            initializedRef.current = true;
        }

        // Listen for zoom changes
        const listener = map.addListener("zoom_changed", () => {
            const zoom = map.getZoom();
            if (zoom !== undefined && onZoomChange) {
                onZoomChange(zoom);
            }
        });

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map, onZoomChange, initialBounds, useDefaultZoom, zoom]);

    return null;
}
