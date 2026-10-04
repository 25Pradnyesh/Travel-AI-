/**
-- Travel AI Mobile — Supabase Database Type Definitions (Stage 1)
--
-- Strongly-typed database contracts mirroring the public PostgreSQL schema
-- defined in supabase/migrations/20261001000000_supabase_foundation.sql.
-- Compatible with the official @supabase/supabase-js client.
*/

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      analyses: {
        Row: {
          id: string;
          user_id: string | null;
          reel_url: string;
          reel_id: string | null;
          thumbnail_url: string | null;
          destination: string;
          country: string | null;
          confidence: number | null;
          travel_intelligence: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          reel_url: string;
          reel_id?: string | null;
          thumbnail_url?: string | null;
          destination: string;
          country?: string | null;
          confidence?: number | null;
          travel_intelligence?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          reel_url?: string;
          reel_id?: string | null;
          thumbnail_url?: string | null;
          destination?: string;
          country?: string | null;
          confidence?: number | null;
          travel_intelligence?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analyses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      analysis_places: {
        Row: {
          id: string;
          analysis_id: string;
          place_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          rating: number | null;
          category: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          place_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          category?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          place_id?: string;
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          category?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analysis_places_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          }
        ];
      };
      saved_places: {
        Row: {
          id: string;
          user_id: string | null;
          place_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          rating: number | null;
          category: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          place_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          category?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          place_id?: string;
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          rating?: number | null;
          category?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_places_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience Row aliases for mobile client usage
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type AnalysisRow = Database['public']['Tables']['analyses']['Row'];
export type AnalysisPlaceRow = Database['public']['Tables']['analysis_places']['Row'];
export type SavedPlaceRow = Database['public']['Tables']['saved_places']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
export type AnalysisPlaceInsert = Database['public']['Tables']['analysis_places']['Insert'];
export type SavedPlaceInsert = Database['public']['Tables']['saved_places']['Insert'];
