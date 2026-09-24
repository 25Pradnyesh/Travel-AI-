/**
 * Travel AI — In-Memory Analysis Store
 *
 * Lightweight, synchronous state preservation for active analysis results
 * between processing, results, and place detail routes in Expo Router.
 */

import { AnalysisResponse, NearbyPlace } from '@/types/analysis';
import { getSavedPlaceByIdSync } from '../storage/saved-places';
import { apiClient } from './client';

class AnalysisStore {
  private currentResult: AnalysisResponse | null = null;
  private currentSourceUrl: string = '';
  private placeMap = new Map<string, NearbyPlace>();
  private photoMap = new Map<string, string>();

  public setAnalysisResult(data: AnalysisResponse, sourceUrl: string): void {
    this.currentResult = data;
    this.currentSourceUrl = sourceUrl;
    this.placeMap.clear();
    this.photoMap.clear();

    const bg = data.best_guess;
    if (bg) {
      const primaryPlace: NearbyPlace = {
        place_id: bg.place_id || 'primary_destination',
        name: bg.name,
        formatted_address: bg.formatted_address,
        latitude: bg.latitude,
        longitude: bg.longitude,
        rating: bg.rating,
        user_ratings_total: bg.user_ratings_total,
        types: bg.types,
        distance_km: 0,
        maps_url: bg.maps_url,
        category: 'Primary Destination',
      };
      this.placeMap.set('primary_destination', primaryPlace);
      this.placeMap.set('primary', primaryPlace);
      if (bg.place_id) this.placeMap.set(bg.place_id, primaryPlace);
      if (bg.name) this.placeMap.set(bg.name, primaryPlace);

      const heroUrl = this.resolvePhotoUrl(bg.photos?.[0]?.url);
      if (heroUrl) {
        this.photoMap.set('primary_destination', heroUrl);
        this.photoMap.set('primary', heroUrl);
        if (bg.place_id) this.photoMap.set(bg.place_id, heroUrl);
        if (bg.name) this.photoMap.set(bg.name, heroUrl);
      }
    }

    if (Array.isArray(data.nearby_places)) {
      data.nearby_places.forEach((p) => {
        if (p) {
          if (p.place_id) this.placeMap.set(p.place_id, p);
          if (p.name) this.placeMap.set(p.name, p);

          let photo: string | undefined;
          if (Array.isArray((p as any).photos) && (p as any).photos[0]?.url) {
            photo = (p as any).photos[0].url;
          } else if (typeof (p as any).photo === 'string') {
            photo = (p as any).photo;
          }
          if (photo) {
            const resolved = this.resolvePhotoUrl(photo);
            if (resolved) {
              if (p.place_id) this.photoMap.set(p.place_id, resolved);
              if (p.name) this.photoMap.set(p.name, resolved);
            }
          }
        }
      });
    }
  }

  public getAnalysisResult(): { data: AnalysisResponse | null; sourceUrl: string } {
    return {
      data: this.currentResult,
      sourceUrl: this.currentSourceUrl,
    };
  }

  public clearAnalysisResult(): void {
    this.currentResult = null;
    this.currentSourceUrl = '';
    this.placeMap.clear();
    this.photoMap.clear();
  }

  public getPlaceById(placeId: string): NearbyPlace | null {
    if (!placeId) return null;

    // 1. O(1) in-memory session index lookup
    const indexed = this.placeMap.get(placeId);
    if (indexed) return indexed;

    // 2. Fallback: Check persisted saved places
    const saved = getSavedPlaceByIdSync(placeId);
    if (saved) {
      return {
        place_id: saved.id,
        name: saved.name,
        formatted_address: saved.address || '',
        latitude: saved.latitude,
        longitude: saved.longitude,
        rating: saved.rating || 0,
        user_ratings_total: saved.review_count || 0,
        types: saved.tags || [],
        distance_km: saved.distance,
        maps_url: saved.maps_url || '',
        category: saved.category || 'Saved Place',
      };
    }

    return null;
  }

  public getPrimaryPlace(): NearbyPlace | null {
    return this.placeMap.get('primary_destination') || null;
  }

  public getPlacePhotoUrl(placeId: string): string | undefined {
    if (!placeId) return undefined;

    // 1. O(1) in-memory photo index lookup
    const indexed = this.photoMap.get(placeId);
    if (indexed) return indexed;

    // 2. Fallback: Check saved places photo
    const saved = getSavedPlaceByIdSync(placeId);
    if (saved?.photo) {
      return this.resolvePhotoUrl(saved.photo);
    }

    return undefined;
  }

  /**
   * Resolves a photo URL against the active API base URL.
   * If the photo URL is a relative proxy path (e.g., /places/photo?name=...),
   * prepends the API base URL so native Image components can fetch it.
   */
  public resolvePhotoUrl(photoUrl?: string | null): string | undefined {
    if (!photoUrl) return undefined;
    const trimmed = photoUrl.trim();
    if (!trimmed) return undefined;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return `${apiClient.getBaseUrl()}${trimmed}`;
    }

    return trimmed;
  }
}

export const analysisStore = new AnalysisStore();
