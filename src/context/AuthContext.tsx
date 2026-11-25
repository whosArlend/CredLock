import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  signInWithUsername,
  signUpWithUsername,
  signOutUser,
  fetchUserProfile,
} from '@/features/auth/services/authService';
import { resetHistoryMemoryCache } from '@/services/historyStorage';
import type {
  AuthContextValue,
  SignInCredentials,
  SignInResult,
  SignUpCredentials,
  SignUpResult,
  UserProfile,
} from '@/features/auth/types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Epoch counter prevents stale async getSession()/fetchUserProfile() calls
  // from restoring authenticated state after signOut() or SIGNED_OUT.
  const authEpochRef = useRef<number>(0);
  const hasActiveSessionRef = useRef<boolean>(false);

  const clearLocalAuthAndMemoryState = useCallback(() => {
    authEpochRef.current += 1;
    setUser(null);
    setSession(null);
    setProfile(null);
    if (hasActiveSessionRef.current) {
      hasActiveSessionRef.current = false;
      resetHistoryMemoryCache();
    }
  }, []);

  // Initialize and restore session on mount
  useEffect(() => {
    let isMounted = true;
    const mountEpoch = authEpochRef.current;
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // 1. Restore existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted || authEpochRef.current !== mountEpoch) return;
        if (error) {
          setIsLoading(false);
          return;
        }

        if (initialSession?.user) {
          hasActiveSessionRef.current = true;
          setSession(initialSession);
          setUser(initialSession.user);
          const userProf = await fetchUserProfile(
            initialSession.user.id,
            initialSession.user.user_metadata
          );
          if (isMounted && authEpochRef.current === mountEpoch) {
            setProfile(userProf);
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or blocked
      })
      .finally(() => {
        if (isMounted && authEpochRef.current === mountEpoch) {
          setIsLoading(false);
        }
      });

    // 2. Subscribe to auth lifecycle events (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !currentSession?.user) {
        clearLocalAuthAndMemoryState();
        setIsLoading(false);
        return;
      }

      const eventEpoch = ++authEpochRef.current;
      hasActiveSessionRef.current = true;
      setSession(currentSession);
      setUser(currentSession.user);

      const userProf = await fetchUserProfile(
        currentSession.user.id,
        currentSession.user.user_metadata
      );
      if (isMounted && authEpochRef.current === eventEpoch) {
        setProfile(userProf);
      }

      if (isMounted && authEpochRef.current === eventEpoch) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearLocalAuthAndMemoryState]);

  // Sign In action
  const signIn = useCallback(async (credentials: SignInCredentials): Promise<SignInResult> => {
    const result = await signInWithUsername(credentials);
    if (result.success) {
      hasActiveSessionRef.current = true;
      const userProf = await fetchUserProfile(
        result.user.id,
        {
          username: result.user.username,
          display_name: result.user.displayName,
        }
      );
      setProfile(userProf);
    }
    return result;
  }, []);

  // Sign Up action
  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    return await signUpWithUsername(credentials);
  }, []);

  // Sign Out action: clears local React auth state & in-memory history cache immediately
  // so slow or failed network sign-out cannot leave the UI in an authenticated state.
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    clearLocalAuthAndMemoryState();
    try {
      return await signOutUser();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, [clearLocalAuthAndMemoryState]);

  // Refresh active session token
  const refreshSession = useCallback(async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
  }, []);

  const isAuthenticated = Boolean(user && session);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAuthenticated,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [user, session, profile, isAuthenticated, isLoading, signIn, signUp, signOut, refreshSession]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
