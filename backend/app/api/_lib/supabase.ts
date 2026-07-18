import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { requireEnv, getOptionalEnv } from '../resend/_lib/env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client with service role (for backend operations)
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

/**
 * Get Supabase client for user operations (with user JWT)
 */
export function getSupabaseClient(accessToken: string): SupabaseClient {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get encryption key for credential storage
 */
export function getEncryptionKey(): string {
  const key = getOptionalEnv('CREDENTIAL_ENCRYPTION_KEY');
  if (!key || key.length < 32) {
    throw new Error(
      'CREDENTIAL_ENCRYPTION_KEY must be set and at least 32 characters. ' +
        'Generate one with: openssl rand -base64 32',
    );
  }
  return key;
}

/**
 * Database types
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          joined_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
        };
      };
      resend_credentials: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          connection_method: 'api_key' | 'oauth';
          encrypted_api_key: string | null;
          encrypted_access_token: string | null;
          encrypted_refresh_token: string | null;
          token_type: string | null;
          token_scope: string | null;
          token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          connection_method: 'api_key' | 'oauth';
          encrypted_api_key?: string | null;
          encrypted_access_token?: string | null;
          encrypted_refresh_token?: string | null;
          token_type?: string | null;
          token_scope?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string | null;
          connection_method?: 'api_key' | 'oauth';
          encrypted_api_key?: string | null;
          encrypted_access_token?: string | null;
          encrypted_refresh_token?: string | null;
          token_type?: string | null;
          token_scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
        };
      };
      webhook_tokens: {
        Row: {
          id: string;
          token: string;
          user_id: string;
          workspace_id: string | null;
          is_active: boolean;
          created_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          user_id: string;
          workspace_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          token?: string;
          user_id?: string;
          workspace_id?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          workspace_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          workspace_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
