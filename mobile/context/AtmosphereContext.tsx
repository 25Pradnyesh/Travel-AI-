/**
 * VAMO Mobile — Global Atmosphere Context & Provider
 *
 * Implements the sharp photo-first atmospheric engine:
 * - Cold start picks a random bundled nature/cityscape photo (never same as previous launch).
 * - Location found or selected: adapts to THAT destination's sharp photo on ALL screens.
 * - Profile > Preferences: "Adaptive backgrounds" On/Off (Off = bundled landscapes only).
 * - Tracks Google Places / contributor photo attribution for persistent UI display.
 * - Avoids duplicate re-renders and circular update cascades.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  resolvePhotoAttribution,
} from '@/lib/atmosphere/imagery-resolver';
import {
  BUNDLED_LOCAL_PHOTOS,
  getAdaptiveBackgroundsPreference,
  getNextColdStartPhotoIndex,
  setAdaptiveBackgroundsPreference,
} from '@/lib/atmosphere/background-manifest';

export interface AtmosphereContextType {
  activePlace: PlaceAtmosphereInput | null;
  activePalette: AtmospherePalette;
  activeTier: ResolverTier;
  activeImage: string | number;
  activeAuthor: string | null;
  adaptiveEnabled: boolean;
  setAdaptiveEnabled: (enabled: boolean) => Promise<void>;
  setActivePlace: (place: PlaceAtmosphereInput | null, photoAuthor?: string[] | string | null) => void;
  resetActivePlace: () => void;
  blurTargetRef: React.RefObject<View | null>;
}

export const AtmosphereContext = createContext<AtmosphereContextType>({
  activePlace: null,
  activePalette: VAMO_DEFAULT_PRESET,
  activeTier: 'system_default',
  activeImage: DEFAULT_DISCOVERY_IMAGE,
  activeAuthor: null,
  adaptiveEnabled: true,
  setAdaptiveEnabled: async () => {},
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
  const [explicitAuthor, setExplicitAuthor] = useState<string | null>(null);
  const [coldStartImage, setColdStartImage] = useState<string | number>(DEFAULT_DISCOVERY_IMAGE);
  const [adaptiveEnabled, setAdaptiveEnabledState] = useState<boolean>(true);
  const blurTargetRef = useRef<View>(null);

  // Initialize random cold-start photo and load user preference on app launch
  useEffect(() => {
    let mounted = true;

    getNextColdStartPhotoIndex(BUNDLED_LOCAL_PHOTOS.length).then((idx) => {
      if (mounted && BUNDLED_LOCAL_PHOTOS[idx]) {
        setColdStartImage(BUNDLED_LOCAL_PHOTOS[idx].source);
      }
    });

    getAdaptiveBackgroundsPreference().then((enabled) => {
      if (mounted) {
        setAdaptiveEnabledState(enabled);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setAdaptiveEnabled = useCallback(async (enabled: boolean) => {
    setAdaptiveEnabledState(enabled);
    await setAdaptiveBackgroundsPreference(enabled);
  }, []);

  const lastValidImageRef = useRef<string | number>(DEFAULT_DISCOVERY_IMAGE);

  const resolved = useMemo(() => {
    return resolveAtmosphere(activePlace);
  }, [activePlace]);

  // Determine active background photo:
  // If adaptive backgrounds is disabled by user, always stay on cold-start bundled photo
  const activeImage = useMemo(() => {
    if (!adaptiveEnabled) {
      return coldStartImage;
    }

    if (!activePlace) {
      return coldStartImage;
    }

    const resolvedImg = resolveDestinationImage(activePlace, lastValidImageRef.current);
    if (resolvedImg) {
      lastValidImageRef.current = resolvedImg;
    }
    return resolvedImg || coldStartImage;
  }, [adaptiveEnabled, activePlace, coldStartImage]);

  // Determine active photo author attribution
  const activeAuthor = useMemo(() => {
    if (!adaptiveEnabled || !activePlace) {
      return null;
    }
    return resolvePhotoAttribution(activePlace, explicitAuthor);
  }, [adaptiveEnabled, activePlace, explicitAuthor]);

  const setActivePlace = useCallback(
    (place: PlaceAtmosphereInput | null, photoAuthor?: string[] | string | null) => {
      setActivePlaceState((prev) => {
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

      if (photoAuthor) {
        if (Array.isArray(photoAuthor)) {
          setExplicitAuthor(photoAuthor.filter(Boolean).join(', '));
        } else {
          setExplicitAuthor(String(photoAuthor));
        }
      } else {
        setExplicitAuthor(null);
      }
    },
    []
  );

  const resetActivePlace = useCallback(() => {
    setActivePlaceState(null);
    setExplicitAuthor(null);
  }, []);

  const contextValue = useMemo<AtmosphereContextType>(
    () => ({
      activePlace,
      activePalette: resolved.palette,
      activeTier: resolved.tier,
      activeImage,
      activeAuthor,
      adaptiveEnabled,
      setAdaptiveEnabled,
      setActivePlace,
      resetActivePlace,
      blurTargetRef,
    }),
    [
      activePlace,
      resolved,
      activeImage,
      activeAuthor,
      adaptiveEnabled,
      setAdaptiveEnabled,
      setActivePlace,
      resetActivePlace,
    ]
  );

  return (
    <AtmosphereContext.Provider value={contextValue}>
      {children}
    </AtmosphereContext.Provider>
  );
};

export default AtmosphereProvider;
