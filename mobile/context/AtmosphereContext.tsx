/**
 * VAMO Mobile — Global Atmosphere Context & Provider
 *
 * Implements the sharp photo-first atmospheric engine:
 * - Slideshow of 22 bundled photos runs on all screens in the default state.
 * - When a destination is found or selected, that destination's photo crossfades in
 *   and pauses the slideshow.
 * - When destination is cleared, the slideshow resumes.
 * - User preferences:
 *     - "Adaptive backgrounds" On/Off (Off = bundled photos only)
 *     - "Background slideshow" On/Off (Off = one static photo)
 * - Tracks photographer attribution ONLY for remote photos requiring attribution.
 * - Provides blurTargetRef for native Android GlassView sampling.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, View } from 'react-native';
import * as Device from 'expo-device';
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
  BUNDLED_BACKGROUNDS,
  getAdaptiveBackgroundsPreference,
  getBackgroundSlideshowPreference,
  getNextColdStartPhotoIndex,
  setAdaptiveBackgroundsPreference,
  setBackgroundSlideshowPreference,
} from '@/lib/atmosphere/background-manifest';
import {
  GlassBlurPreset,
  getStoredGlassBlurPreset,
  setStoredGlassBlurPreset,
} from '@/constants/glass';

export interface AtmosphereContextType {
  activePlace: PlaceAtmosphereInput | null;
  activePalette: AtmospherePalette;
  activeTier: ResolverTier;
  activeImage: string | number;
  activeAuthor: string | null;
  adaptiveEnabled: boolean;
  slideshowEnabled: boolean;
  isDestinationActive: boolean;
  destinationKey: string | null;
  activeDestinationImage: string | number | null;
  coldStartImage: string | number;
  glassBlurPreset: GlassBlurPreset;
  effectiveGlassPreset: GlassBlurPreset;
  isReduceTransparency: boolean;
  isLowEndDevice: boolean;
  setAdaptiveEnabled: (enabled: boolean) => Promise<void>;
  setSlideshowEnabled: (enabled: boolean) => Promise<void>;
  setGlassBlurPreset: (preset: GlassBlurPreset) => Promise<void>;
  setActivePlace: (
    place: PlaceAtmosphereInput | null,
    photoAuthor?: string[] | string | null
  ) => void;
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
  slideshowEnabled: true,
  isDestinationActive: false,
  destinationKey: null,
  activeDestinationImage: null,
  coldStartImage: DEFAULT_DISCOVERY_IMAGE,
  glassBlurPreset: 'medium',
  effectiveGlassPreset: 'medium',
  isReduceTransparency: false,
  isLowEndDevice: false,
  setAdaptiveEnabled: async () => { },
  setSlideshowEnabled: async () => { },
  setGlassBlurPreset: async () => { },
  setActivePlace: () => { },
  resetActivePlace: () => { },
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
  const [slideshowEnabled, setSlideshowEnabledState] = useState<boolean>(true);
  const [glassBlurPreset, setGlassBlurPresetState] = useState<GlassBlurPreset>('medium');
  const [isReduceTransparency, setIsReduceTransparency] = useState<boolean>(false);
  const blurTargetRef = useRef<View>(null);

  // Detect low-end devices (< 3GB RAM or legacy year class)
  const isLowEndDevice = useMemo(() => {
    try {
      if (typeof Device?.totalMemory === 'number' && Device.totalMemory < 3 * 1024 * 1024 * 1024) {
        return true;
      }
    } catch { }
    return false;
  }, []);

  // Monitor system Accessibility Reduce Transparency preference
  useEffect(() => {
    if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then(setIsReduceTransparency)
        .catch(() => { });
    }

    const sub = typeof AccessibilityInfo?.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceTransparencyChanged', setIsReduceTransparency)
      : null;
    return () => {
      sub?.remove();
    };
  }, []);

  // Effective glass preset: Low forced if reduce transparency or low-end device; otherwise user preference
  const effectiveGlassPreset: GlassBlurPreset = useMemo(() => {
    if (isReduceTransparency || isLowEndDevice) {
      return 'low';
    }
    return glassBlurPreset;
  }, [isReduceTransparency, isLowEndDevice, glassBlurPreset]);

  // Initialize random cold-start photo and load user preferences on launch
  useEffect(() => {
    let mounted = true;

    getNextColdStartPhotoIndex(BUNDLED_BACKGROUNDS.length).then((idx) => {
      if (mounted && BUNDLED_BACKGROUNDS[idx]) {
        setColdStartImage(BUNDLED_BACKGROUNDS[idx].source);
      }
    });

    getAdaptiveBackgroundsPreference().then((enabled) => {
      if (mounted) {
        setAdaptiveEnabledState(enabled);
      }
    });

    getBackgroundSlideshowPreference().then((enabled) => {
      if (mounted) {
        setSlideshowEnabledState(enabled);
      }
    });

    getStoredGlassBlurPreset().then((preset) => {
      if (mounted) {
        setGlassBlurPresetState(preset);
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

  const setSlideshowEnabled = useCallback(async (enabled: boolean) => {
    setSlideshowEnabledState(enabled);
    await setBackgroundSlideshowPreference(enabled);
  }, []);

  const setGlassBlurPreset = useCallback(async (preset: GlassBlurPreset) => {
    setGlassBlurPresetState(preset);
    await setStoredGlassBlurPreset(preset);
  }, []);

  const currentPlaceIdRef = useRef<string | null>(null);

  const resolved = useMemo(() => {
    return resolveAtmosphere(activePlace);
  }, [activePlace]);

  // Check if a destination photo is actively displayed
  const isDestinationActive = Boolean(adaptiveEnabled && activePlace);

  // Destination key uniquely tying background photo to destination
  const destinationKey = useMemo<string | null>(() => {
    if (!activePlace) return null;
    const pid = activePlace.place_id || '';
    const coords =
      activePlace.latitude != null && activePlace.longitude != null
        ? `${Number(activePlace.latitude).toFixed(3)},${Number(activePlace.longitude).toFixed(3)}`
        : '';
    const name = (activePlace.name || activePlace.city || '').toLowerCase().trim();
    return `${pid}|${coords}|${name}`;
  }, [activePlace]);

  // Destination photos cached strictly by destinationKey
  const destinationPhotoCacheRef = useRef<Map<string, string | number>>(new Map());

  // Resolved destination photo (remote or matched bundled).
  // Strictly per-destination: rendered only if destinationKey matches displayed destination.
  const activeDestinationImage = useMemo<string | number | null>(() => {
    if (!isDestinationActive || !activePlace || !destinationKey) {
      return null;
    }

    const cached = destinationPhotoCacheRef.current.get(destinationKey);
    if (cached !== undefined) {
      return cached;
    }

    const resolvedImg = resolveDestinationImage(activePlace, null);
    if (resolvedImg) {
      destinationPhotoCacheRef.current.set(destinationKey, resolvedImg);
      return resolvedImg;
    }

    return null;
  }, [isDestinationActive, activePlace, destinationKey]);

  // Overall activeImage: destination image if active (may be null if loading/none); only use coldStartImage on general discovery screens
  const activeImage = useMemo<string | number>(() => {
    if (isDestinationActive) {
      return activeDestinationImage || '';
    }
    return coldStartImage;
  }, [isDestinationActive, activeDestinationImage, coldStartImage]);

  // Attribution: ONLY for remote photos requiring attribution
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
      slideshowEnabled,
      isDestinationActive,
      destinationKey,
      activeDestinationImage,
      coldStartImage,
      glassBlurPreset,
      effectiveGlassPreset,
      isReduceTransparency,
      isLowEndDevice,
      setAdaptiveEnabled,
      setSlideshowEnabled,
      setGlassBlurPreset,
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
      slideshowEnabled,
      isDestinationActive,
      destinationKey,
      activeDestinationImage,
      coldStartImage,
      glassBlurPreset,
      effectiveGlassPreset,
      isReduceTransparency,
      isLowEndDevice,
      setAdaptiveEnabled,
      setSlideshowEnabled,
      setGlassBlurPreset,
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
