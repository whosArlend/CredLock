import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase.ts';
import {
  validateUsername,
  normalizeUsername,
  toSyntheticEmail,
  evaluatePasswordRequirements,
  validatePasswordConfirmation,
} from '../utils/validation.ts';
import type {
  SignUpCredentials,
  SignUpResult,
  SignInCredentials,
  SignInResult,
  UserProfile,
} from '../types/index.ts';

/**
 * Executes secure user registration against Supabase Auth using a deterministic
 * synthetic identity mapping (Approach A).
 *
 * Privacy & Security Guarantees:
 * - Operatives never provide a personal email address or phone number.
 * - Username uniqueness is enforced case-insensitively.
 * - Credentials travel directly to the Supabase Auth enclave via TLS without
 *   intermediary backend server exposure.
 */
export async function signUpWithUsername(
  credentials: SignUpCredentials,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<SignUpResult> {
  const { username, password, confirmPassword, displayName } = credentials;

  // 1. Client-side username validation
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.isValid) {
    return {
      success: false,
      code: 'INVALID_USERNAME',
      message: usernameCheck.error || 'Invalid username format.',
      field: 'username',
    };
  }

  // 2. Client-side password complexity check
  const passwordEvaluation = evaluatePasswordRequirements(password);
  if (!passwordEvaluation.isAllMet) {
    return {
      success: false,
      code: 'WEAK_PASSWORD',
      message: 'Master passphrase does not satisfy all cryptographic security requirements.',
      field: 'password',
    };
  }

  // 3. Client-side password confirmation check
  if (confirmPassword !== undefined) {
    const confirmationCheck = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmationCheck.isValid) {
      return {
        success: false,
        code: 'PASSWORD_MISMATCH',
        message: confirmationCheck.error || 'Passphrases do not match.',
        field: 'confirmPassword',
      };
    }
  }

  // 4. Supabase client resolution
  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
    return {
      success: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message:
        'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.',
    };
  }

  // 5. Normalization and synthetic identity derivation
  const normalized = normalizeUsername(username);
  const syntheticEmail = toSyntheticEmail(normalized);
  const resolvedDisplayName = displayName?.trim() || username.trim();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        data: {
          username: normalized,
          display_name: resolvedDisplayName,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();

      // Duplicate username conflict
      if (
        msg.includes('already registered') ||
        msg.includes('user already exists') ||
        error.status === 422
      ) {
        return {
          success: false,
          code: 'USERNAME_TAKEN',
          message: 'This username is already taken. Please choose another username.',
          field: 'username',
        };
      }

      // Security rate limit
      if (msg.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Security rate limit reached. Please wait a few moments before trying again.',
        };
      }

      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unable to register account. Please try again.',
      };
    }

    if (!data.user) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'No user data returned from authentication provider.',
      };
    }

    // GoTrue returns empty identities array when user already exists with email confirmations disabled
    if (data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        code: 'USERNAME_TAKEN',
        message: 'This username is already taken. Please choose another username.',
        field: 'username',
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        username: normalized,
        displayName: resolvedDisplayName,
      },
      sessionEstablished: Boolean(data.session),
      message: 'Operative account initialized successfully. Welcome to CredLock.',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network communication error.';
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: errorMsg,
    };
  }
}

/**
 * Authenticates user credentials against Supabase Auth using their operative username.
 *
 * Security Requirements:
 * - Both unknown username and incorrect passphrase return the exact same generic error:
 *   "Invalid username or master passphrase."
 * - Zero username enumeration vectors.
 * - Zero plaintext passphrase logging.
 */
export async function signInWithUsername(
  credentials: SignInCredentials,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<SignInResult> {
  const { username, password } = credentials;

  // 1. Client-side input validation
  if (!username || username.trim().length === 0) {
    return {
      success: false,
      code: 'INVALID_USERNAME',
      message: 'Username is required to authenticate.',
      field: 'username',
    };
  }

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      code: 'MISSING_PASSWORD',
      message: 'Master passphrase is required to authenticate.',
      field: 'password',
    };
  }

  // 2. Supabase client resolution
  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
    return {
      success: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      message:
        'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.',
    };
  }

  // 3. Normalization and synthetic identity derivation
  const normalized = normalizeUsername(username);
  const syntheticEmail = toSyntheticEmail(normalized);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();

      // Security rate limit
      if (msg.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please wait a few moments before trying again.',
        };
      }

      // Universal generic credentials error to defeat account enumeration
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or master passphrase. Please verify your credentials.',
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: 'No active session returned from identity provider.',
      };
    }

    const resolvedUsername =
      data.user.user_metadata?.username ||
      normalized;

    const resolvedDisplayName =
      data.user.user_metadata?.display_name ||
      resolvedUsername;

    return {
      success: true,
      user: {
        id: data.user.id,
        username: resolvedUsername,
        displayName: resolvedDisplayName,
      },
      session: {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      },
      message: 'Enclave authorization granted. Welcome back.',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network communication error.';
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: errorMsg,
    };
  }
}

export const SUPABASE_AUTH_STORAGE_KEY = 'credlock-auth-token' as const;

function clearLocalAuthStorage(storage?: Pick<Storage, 'removeItem'> | null): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;

  if (targetStorage) {
    targetStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  }
}

/**
 * Terminates the active Supabase session and flushes client auth credentials.
 * If remote revocation fails due to network/API error, explicitly falls back to
 * local-scope signOut and removes only the CredLock auth storage key.
 */
export async function signOutUser(
  customSupabaseClient?: ReturnType<typeof getSupabase>,
  customStorage?: Pick<Storage, 'removeItem'> | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = customSupabaseClient ?? getSupabase();
  if (!supabase) {
    clearLocalAuthStorage(customStorage);
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore secondary local signOut error; explicit fallback below clears token key
      }
      clearLocalAuthStorage(customStorage);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore secondary local signOut error
    }
    clearLocalAuthStorage(customStorage);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to terminate session',
    };
  }
}

/**
 * Safely fetches the public profile associated with an authenticated user id.
 * Exposes username and avoids any synthetic email leakage in the returned UserProfile.
 */
export async function fetchUserProfile(
  userId: string,
  userMetadata?: Record<string, unknown>,
  customSupabaseClient?: ReturnType<typeof getSupabase>
): Promise<UserProfile> {
  const fallbackUsername = (userMetadata?.username as string) || 'operative';
  const fallbackProfile: UserProfile = {
    id: userId,
    username: fallbackUsername,
    displayName: (userMetadata?.display_name as string) ?? fallbackUsername,
    avatarUrl: (userMetadata?.avatar_url as string) ?? null,
    role: 'user',
    isActive: true,
  };

  const supabase = customSupabaseClient ?? getSupabase();
  const configured = customSupabaseClient ? true : isSupabaseConfigured();
  if (!supabase || !configured) {
    return fallbackProfile;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return fallbackProfile;
    }

    return {
      id: data.id,
      username: data.username || fallbackUsername,
      displayName: data.display_name ?? data.username ?? fallbackProfile.displayName,
      avatarUrl: data.avatar_url ?? null,
      role: (data.role as 'user' | 'admin' | 'analyst') || 'user',
      isActive: Boolean(data.is_active ?? true),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return fallbackProfile;
  }
}
