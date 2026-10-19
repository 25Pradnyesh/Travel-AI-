/**
 * VAMO Mobile — Global Atmosphere Context & Provider
 *
 * Maintains the active destination context, resolved atmospheric palette,
 * and primary destination imagery across the entire application navigation tree:
 * - Cold start initializes with DEFAULT_DISCOVERY_IMAGE & VAMO_DEFAULT_PRESET.
 * - Image-led atmosphere: adapts to verified destination photography upon reel analysis,
 *   history review, or saved place selection.
 * - Retains active destination imagery across tab navigation (Analyze, Explore, Saved, Profile).
 * - Avoids duplicate sources of truth by accepting standard place fields directly.
 * - Integrates Android BlurTargetView ref for 60 FPS glass blur resolution.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AtmospherePalette,
  PlaceAtmosphereInput,
  ResolverTier,
} from '@/types/atmosphere';
import { VAMO_DEFAULT_PRESET } from '@/lib/atmosphere/presets';
import { resolveAtmosphere } from '@/lib/atmosphere/palette-resolver';
import {
  DEFAULT_DISCOVERY_IMAGE,
  resolveDestinationImage,
} from '@/lib/atmosphere/imagery-resolver';

export interface AtmosphereContextType {
  activePlace: PlaceAtmosphereInput | null;
  activePalette: AtmospherePalette;
  activeTier: ResolverTier;
  activeImage: string | number;
  setActivePlace: (place: PlaceAtmosphereInput | null) => void;
  resetActivePlace: () => void;
  blurTargetRef: React.RefObject<View | null>;
}

export const AtmosphereContext = createContext<AtmosphereContextType>({
  activePlace: null,
  activePalette: VAMO_DEFAULT_PRESET,
  activeTier: 'system_default',
  activeImage: DEFAULT_DISCOVERY_IMAGE,
  setActivePlace: () => {},
  resetActivePlace: () => {},
  blurTargetRef: { current: null },
});

export const useAtmosphere = () => useContext(AtmosphereContext);

export interface AtmosphereProviderProps {
  children: React.ReactNode;
  initialPlace?: PlaceAtmosphereInput | null;
}

export const AtmosphereProvider: React.FC<AtmosphereProviderProps> = ({
  children,
  initialPlace = null,
}) => {
  const [activePlace, setActivePlaceState] = useState<PlaceAtmosphereInput | null>(initialPlace);
  const blurTargetRef = useRef<View>(null);

  const initialResolvedImage = useMemo(
    () => (initialPlace ? resolveDestinationImage(initialPlace) : DEFAULT_DISCOVERY_IMAGE),
    [initialPlace]
  );
  const lastValidImageRef = useRef<string | number>(initialResolvedImage);

  const resolved = useMemo(() => {
    return resolveAtmosphere(activePlace);
  }, [activePlace]);

  const activeImage = useMemo(() => {
    if (!activePlace) {
      return DEFAULT_DISCOVERY_IMAGE;
    }
    const resolvedImg = resolveDestinationImage(activePlace, lastValidImageRef.current);
    if (resolvedImg) {
      lastValidImageRef.current = resolvedImg;
    }
    return resolvedImg || DEFAULT_DISCOVERY_IMAGE;
  }, [activePlace]);

  const setActivePlace = useCallback((place: PlaceAtmosphereInput | null) => {
    setActivePlaceState((prev) => {
      // Avoid duplicate state updates if place hasn't changed
      if (!place && !prev) return prev;
      if (
        place &&
        prev &&
        place.place_id === prev.place_id &&
        place.city === prev.city &&
        place.country === prev.country &&
        place.name === prev.name &&
        place.heroPhotoUrl === prev.heroPhotoUrl
      ) {
        return prev;
      }
      return place;
    });
  }, []);

  const resetActivePlace = useCallback(() => {
    setActivePlaceState(null);
  }, []);

  const contextValue = useMemo<AtmosphereContextType>(
    () => ({
      activePlace,
      activePalette: resolved.palette,
      activeTier: resolved.tier,
      activeImage,
      setActivePlace,
      resetActivePlace,
      blurTargetRef,
    }),
    [activePlace, resolved, activeImage, setActivePlace, resetActivePlace]
  );

  return (
    <AtmosphereContext.Provider value={contextValue}>
      {children}
    </AtmosphereContext.Provider>
  );
};

export default AtmosphereProvider;
