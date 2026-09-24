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

  public setAnalysisResult(data: AnalysisResponse, sourceUrl: string): void {
    this.currentResult = data;
    this.currentSourceUrl = sourceUrl;
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
  }

  public getPlaceById(placeId: string): NearbyPlace | null {
    // 1. Check nearby places in current session
    if (this.currentResult?.nearby_places) {
      const nearby = this.currentResult.nearby_places.find((p) => p.place_id === placeId);
      if (nearby) return nearby;
    }

    // 2. Check primary destination in current session
    const bg = this.currentResult?.best_guess;
    if (
      bg &&
      (bg.place_id === placeId ||
        placeId === 'primary_destination' ||
        placeId === 'primary' ||
        placeId === bg.name)
    ) {
      return {
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
    }

    // 3. Fallback: Check persisted saved places
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
    const bg = this.currentResult?.best_guess;
    if (!bg) return null;
    return {
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
  }

  public getPlacePhotoUrl(placeId: string): string | undefined {
    const bg = this.currentResult?.best_guess;
    if (
      bg &&
      (bg.place_id === placeId ||
        placeId === 'primary_destination' ||
        placeId === 'primary' ||
        placeId === bg.name)
    ) {
      return this.resolvePhotoUrl(bg.photos?.[0]?.url);
    }

    // Check nearby places in current session
    if (this.currentResult?.nearby_places) {
      const nearby = this.currentResult.nearby_places.find((p) => p.place_id === placeId);
      if (nearby && Array.isArray((nearby as any).photos) && (nearby as any).photos[0]?.url) {
        return this.resolvePhotoUrl((nearby as any).photos[0].url);
      }
      if (nearby && typeof (nearby as any).photo === 'string') {
        return this.resolvePhotoUrl((nearby as any).photo);
      }
    }

    // Fallback: Check saved places photo
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
