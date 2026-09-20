"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin } from "lucide-react";

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isPrimary?: boolean;
}

interface TravelMapProps {
  locations: MapLocation[];
  selectedId?: string | null;
  onSelectLocation?: (id: string) => void;
}

type LeafletModule = typeof import("leaflet");

export default function TravelMap({
  locations,
  selectedId,
  onSelectLocation,
}: TravelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const leafletRef = useRef<LeafletModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSelect = useCallback(
    (id: string) => onSelectLocation?.(id),
    [onSelectLocation]
  );

  // Initialize map
  useEffect(() => {
    if (locations.length === 0) return;

    let cancelled = false;

    const loadMap = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      const L = await import("leaflet");
      leafletRef.current = L;

      if (cancelled || !mapContainerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      const bounds = L.latLngBounds([]);
      const newMarkers = new Map<string, L.Marker>();

      locations.forEach((loc) => {
        const latLng = L.latLng(loc.lat, loc.lng);
        bounds.extend(latLng);

        const marker = L.marker(latLng, {
          icon: createIcon(L, loc.isPrimary ?? false, false),
        })
          .addTo(map)
          .bindTooltip(loc.name, {
            direction: "top",
            offset: [0, -8],
          });

        marker.on("click", () => handleSelect(loc.id));
        newMarkers.set(loc.id, marker);
      });

      markersRef.current = newMarkers;

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      mapRef.current = map;
      setIsLoaded(true);
    };

    loadMap();

    return () => {
      cancelled = true;
    };
  }, [locations, handleSelect]);

  // Update marker styles when selection changes
  useEffect(() => {
    const L = leafletRef.current;
    if (!isLoaded || !L) return;

    markersRef.current.forEach((marker, id) => {
      const loc = locations.find((l) => l.id === id);
      const isSelected = id === selectedId;
      const isPrimary = loc?.isPrimary ?? false;
      marker.setIcon(createIcon(L, isPrimary, isSelected));
    });
  }, [selectedId, isLoaded, locations]);

  if (locations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-metadata">MAP</h3>
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          border: "1px solid var(--color-border)",
          height: "400px",
        }}
      >
        <div ref={mapContainerRef} className="h-full w-full" />

        {!isLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Loading map…
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function createIcon(L: LeafletModule, isPrimary: boolean, isSelected: boolean) {
  const size = isSelected || isPrimary ? 14 : 10;
  const bg = isSelected ? "#111111" : isPrimary ? "#111111" : "#8A8A8A";
  const bw = isSelected ? 3 : 2;

  return L.divIcon({
    className: "travel-map-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border:${bw}px solid #fff;
      border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,${isSelected ? 0.35 : 0.2});
      cursor:pointer;transition:all 150ms ease-out;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
