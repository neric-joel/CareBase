// Application-level TypeScript types derived from the database schema.
// Use these in components and API routes instead of raw Database['public']['Tables']['x']['Row'].

import type { Database } from './supabase';

// ---- Row types (what you get back from SELECT) ----

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbClient = Database['public']['Tables']['clients']['Row'];
export type DbServiceEntry =
  Database['public']['Tables']['service_entries']['Row'];
export type DbPrompt = Database['public']['Tables']['prompts']['Row'];
export type DbNoteEmbedding =
  Database['public']['Tables']['note_embeddings']['Row'];

// ---- Insert types (what you send for INSERT) ----

export type DbUserInsert = Database['public']['Tables']['users']['Insert'];
export type DbClientInsert = Database['public']['Tables']['clients']['Insert'];
export type DbServiceEntryInsert =
  Database['public']['Tables']['service_entries']['Insert'];
export type DbPromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type DbNoteEmbeddingInsert =
  Database['public']['Tables']['note_embeddings']['Insert'];

// ---- Update types (what you send for UPDATE) ----

export type DbClientUpdate = Database['public']['Tables']['clients']['Update'];
export type DbServiceEntryUpdate =
  Database['public']['Tables']['service_entries']['Update'];
export type DbPromptUpdate = Database['public']['Tables']['prompts']['Update'];

// ---- Domain types ----

export type UserRole = DbUser['role']; // 'admin' | 'staff'

export const SERVICE_TYPES = [
  'Food Box Pickup',
  'Clothing Assistance',
  'Emergency Grocery',
  'Holiday Meal Kit',
  'Benefits Referral',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export interface ClientCustomFields {
  household_size?: number | null;
  dietary_restrictions?: string | null;
  language_preference?: string | null;
  [key: string]: unknown;
}

// ---- Composite / joined types ----

export interface ClientWithCreator extends DbClient {
  created_by_user?: DbUser | null;
}

export interface ServiceEntryWithStaff extends DbServiceEntry {
  staff?: DbUser | null;
}

export interface ClientWithServiceEntries extends DbClient {
  service_entries: ServiceEntryWithStaff[];
}

// ---- Semantic search result (from match_notes RPC) ----

export type NoteSearchResult =
  Database['public']['Functions']['match_notes']['Returns'][number];

// ---- API response shapes ----

export interface ApiSuccess<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ---- AI feature types ----

export interface PhotoIntakeResult {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  custom_fields: {
    household_size: number | null;
    dietary_restrictions: string | null;
    language_preference: string | null;
  };
}

export interface HandoffSummaryResult {
  background: string;
  services_history: string;
  current_status: string;
  active_needs: string[];
  risk_factors: string[];
  recommended_next_steps: string[];
}
