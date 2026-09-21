"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Maximize2 } from "lucide-react";

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
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSelect = useCallback(
    (id: string) => onSelectLocation?.(id),
    [onSelectLocation]
  );

  const handleRecenter = () => {
    if (mapRef.current && boundsRef.current && boundsRef.current.isValid()) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [40, 40], maxZoom: 14 });
    }
  };

  // Initialize map
  useEffect(() => {
    if (locations.length === 0) return;

    let cancelled = false;

    const loadMap = async () => {
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
            className: "travel-map-tooltip",
          });

        marker.on("click", () => handleSelect(loc.id));
        newMarkers.set(loc.id, marker);
      });

      markersRef.current = newMarkers;
      boundsRef.current = bounds;

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

      if (isSelected && mapRef.current) {
        const latLng = marker.getLatLng();
        mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
      }
    });
  }, [selectedId, isLoaded, locations]);

  if (locations.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-metadata">GEOGRAPHIC MAP</h3>
        <div
          className="relative flex flex-col items-center justify-center rounded-2xl p-8 text-center"
          style={{
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-surface)",
            minHeight: "240px",
          }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-primary)]">
            <MapPin className="h-5 w-5" style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Map coordinates unavailable
          </p>
          <p className="mt-1 text-xs max-w-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Precise geographic coordinates could not be resolved from this content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-metadata">INTERACTIVE MAP</h3>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {locations.length} PIN{locations.length > 1 ? "S" : ""}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl shadow-xs"
        style={{
          border: "1px solid var(--color-border)",
          height: "400px",
        }}
      >
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Recenter Button */}
        {isLoaded && (
          <button
            type="button"
            onClick={handleRecenter}
            className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-primary)] shadow-xs hover:bg-white transition-all backdrop-blur-xs"
            style={{ border: "1px solid var(--color-border)" }}
            title="Recenter map to all locations"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Recenter</span>
          </button>
        )}

        {!isLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-6 w-6 animate-pulse" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                Rendering map…
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function createIcon(L: LeafletModule, isPrimary: boolean, isSelected: boolean) {
  const size = isSelected ? 18 : isPrimary ? 15 : 11;
  const bg = isSelected ? "#111111" : isPrimary ? "#111111" : "#8A8A8A";
  const bw = isSelected ? 3 : 2;

  return L.divIcon({
    className: "travel-map-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border:${bw}px solid #ffffff;
      border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,${isSelected ? 0.4 : 0.25});
      cursor:pointer;transition:all 200ms ease-out;
      display:flex;align-items:center;justify-content:center;
    ">${isPrimary ? '<div style="width:4px;height:4px;background:#fff;border-radius:50%"></div>' : ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
