import { getSupabaseServiceClient, getEncryptionKey } from '../../_lib/supabase';

/**
 * Store or update API key for a user in Supabase with encryption
 */
export async function storeApiKeyForUser(
  userId: string,
  apiKey: string,
  workspaceId?: string | null,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const encryptionKey = getEncryptionKey();

  // Encrypt the API key using database function
  const { data: encryptedKey, error: encryptError } = await supabase.rpc('encrypt_credential', {
    plaintext: apiKey,
    encryption_key: encryptionKey,
  });

  if (encryptError || !encryptedKey) {
    throw new Error(`Failed to encrypt API key: ${encryptError?.message}`);
  }

  // Upsert credential
  const { error } = await supabase.from('resend_credentials').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId,
      connection_method: 'api_key',
      encrypted_api_key: encryptedKey,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,workspace_id',
    },
  );

  if (error) {
    throw new Error(`Failed to store API key: ${error.message}`);
  }
}

/**
 * Get decrypted API key for a user from Supabase
 */
export async function getApiKeyForUser(
  userId: string,
  workspaceId?: string | null,
): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  
  console.log('[getApiKeyForUser] Starting retrieval for userId:', userId, 'workspaceId:', workspaceId);
  
  let encryptionKey: string;
  try {
    encryptionKey = getEncryptionKey();
    console.log('[getApiKeyForUser] Encryption key retrieved, length:', encryptionKey.length);
  } catch (error) {
    console.error('[getApiKeyForUser] Failed to get encryption key:', error);
    return null;
  }

  // Get encrypted credential - fix query for null workspace_id
  // Use order + limit to handle multiple rows (from multiple onboarding attempts)
  let query = supabase
    .from('resend_credentials')
    .select('encrypted_api_key')
    .eq('user_id', userId)
    .eq('connection_method', 'api_key')
    .order('created_at', { ascending: false })
    .limit(1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getApiKeyForUser] Error fetching API key:', error);
    return null;
  }

  if (!data || data.length === 0 || !data[0]?.encrypted_api_key) {
    console.log('[getApiKeyForUser] No encrypted API key found for user:', userId);
    return null;
  }

  console.log('[getApiKeyForUser] Found encrypted credential, attempting decryption');

  // Decrypt the API key
  const { data: decryptedKey, error: decryptError } = await supabase.rpc('decrypt_credential', {
    encrypted: data[0].encrypted_api_key,
    encryption_key: encryptionKey,
  });

  if (decryptError) {
    console.error('[getApiKeyForUser] Error decrypting API key:', decryptError);
    return null;
  }

  console.log('[getApiKeyForUser] Successfully decrypted API key, starts with:', decryptedKey?.substring(0, 6));

  return decryptedKey;
}

/**
 * Delete API key credential for a user
 */
export async function deleteApiKeyForUser(
  userId: string,
  workspaceId?: string | null,
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('resend_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('connection_method', 'api_key');

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

/**
 * Check if user has stored credentials
 */
export async function hasCredentials(userId: string, workspaceId?: string | null): Promise<boolean> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('resend_credentials')
    .select('id')
    .eq('user_id', userId);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { data, error } = await query.maybeSingle();

  return !error && !!data;
}

/**
 * Get credential metadata without decrypting
 */
export async function getCredentialMeta(
  userId: string,
  workspaceId?: string | null,
): Promise<{ connectionMethod: string; updatedAt: string } | null> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('resend_credentials')
    .select('connection_method, updated_at')
    .eq('user_id', userId);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    connectionMethod: data.connection_method,
    updatedAt: data.updated_at,
  };
}

/**
 * Store OAuth tokens for a user (encrypted)
 */
export async function storeOAuthTokensForUser(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    scope?: string;
    expiresIn?: number;
  },
  workspaceId?: string | null,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const encryptionKey = getEncryptionKey();

  // Encrypt tokens
  const { data: encryptedAccessToken, error: accessError } = await supabase.rpc('encrypt_credential', {
    plaintext: tokens.accessToken,
    encryption_key: encryptionKey,
  });

  if (accessError || !encryptedAccessToken) {
    throw new Error(`Failed to encrypt access token: ${accessError?.message}`);
  }

  let encryptedRefreshToken: string | null = null;
  if (tokens.refreshToken) {
    const { data: refreshData, error: refreshError } = await supabase.rpc('encrypt_credential', {
      plaintext: tokens.refreshToken,
      encryption_key: encryptionKey,
    });

    if (refreshError) {
      throw new Error(`Failed to encrypt refresh token: ${refreshError?.message}`);
    }

    encryptedRefreshToken = refreshData;
  }

  const expiresAt = tokens.expiresIn
    ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
    : null;

  // Upsert OAuth credential
  const { error } = await supabase.from('resend_credentials').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId,
      connection_method: 'oauth',
      encrypted_access_token: encryptedAccessToken,
      encrypted_refresh_token: encryptedRefreshToken,
      token_type: tokens.tokenType,
      token_scope: tokens.scope || null,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,workspace_id',
    },
  );

  if (error) {
    throw new Error(`Failed to store OAuth tokens: ${error.message}`);
  }
}

/**
 * Get decrypted OAuth access token for a user
 */
export async function getOAuthAccessTokenForUser(
  userId: string,
  workspaceId?: string | null,
): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  const encryptionKey = getEncryptionKey();

  // Get encrypted credential - fix query for null workspace_id
  // Use order + limit to handle multiple rows
  let query = supabase
    .from('resend_credentials')
    .select('encrypted_access_token, token_expires_at')
    .eq('user_id', userId)
    .eq('connection_method', 'oauth')
    .order('created_at', { ascending: false })
    .limit(1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching OAuth token:', error);
    return null;
  }

  if (!data || data.length === 0 || !data[0]?.encrypted_access_token) {
    return null;
  }

  const credential = data[0];

  // Check if token is expired
  if (credential.token_expires_at) {
    const expiresAt = new Date(credential.token_expires_at);
    if (expiresAt <= new Date()) {
      console.warn('OAuth token expired');
      return null;
    }
  }

  // Decrypt the access token
  const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_credential', {
    encrypted: credential.encrypted_access_token,
    encryption_key: encryptionKey,
  });

  if (decryptError) {
    console.error('Error decrypting OAuth token:', decryptError);
    return null;
  }

  return decryptedToken;
}

/**
 * Delete OAuth credentials for a user
 */
export async function deleteOAuthForUser(userId: string, workspaceId?: string | null): Promise<void> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('resend_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('connection_method', 'oauth');

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    query = query.is('workspace_id', null);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to delete OAuth credentials: ${error.message}`);
  }
}
