// Auto-maintainable Database type for @supabase/supabase-js v2.
// When you have a live Supabase project, replace this file with:
//   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

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
      users: {
        Row: {
          id: string;
          role: 'admin' | 'staff';
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'staff';
          full_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'staff';
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      clients: {
        Row: {
          id: string;
          client_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          custom_fields: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          custom_fields?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          custom_fields?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      service_entries: {
        Row: {
          id: string;
          client_id: string;
          service_date: string;
          service_type: string;
          staff_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_date: string;
          service_type: string;
          staff_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_date?: string;
          service_type?: string;
          staff_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_entries_client_id_fkey';
            columns: ['client_id'];
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_entries_staff_id_fkey';
            columns: ['staff_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      prompts: {
        Row: {
          id: string;
          name: string;
          system_prompt: string;
          version: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          system_prompt: string;
          version?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          system_prompt?: string;
          version?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      note_embeddings: {
        Row: {
          id: string;
          service_entry_id: string;
          embedding: number[];
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_entry_id: string;
          embedding: number[];
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          service_entry_id?: string;
          embedding?: number[];
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'note_embeddings_service_entry_id_fkey';
            columns: ['service_entry_id'];
            referencedRelation: 'service_entries';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: Record<string, never>;
    // Note: note_embeddings.embedding is vector(512) — Voyage AI voyage-3-lite

    Functions: {
      match_notes: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          service_entry_id: string;
          content: string;
          similarity: number;
          client_id: string;
          service_date: string;
          service_type: string;
          client_first_name: string;
          client_last_name: string;
          client_human_id: string;
        }[];
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      generate_client_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };

    Enums: Record<string, never>;
  };
}
