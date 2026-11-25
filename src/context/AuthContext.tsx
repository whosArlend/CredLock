import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  fetchUserProfile,
} from '@/features/auth/services/authService';
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

  // Initialize and restore session on mount
  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    if (!supabase || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // 1. Restore existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          setIsLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const userProf = await fetchUserProfile(
            initialSession.user.id,
            initialSession.user.user_metadata,
            initialSession.user.email
          );
          if (isMounted) {
            setProfile(userProf);
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or blocked
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // 2. Subscribe to auth lifecycle events (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userProf = await fetchUserProfile(
          currentSession.user.id,
          currentSession.user.user_metadata,
          currentSession.user.email
        );
        if (isMounted) {
          setProfile(userProf);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign In action
  const signIn = useCallback(async (credentials: SignInCredentials): Promise<SignInResult> => {
    const result = await signInWithEmail(credentials);
    if (result.success) {
      // The onAuthStateChange handler will automatically catch the session update,
      // but we also immediately fetch and prime the profile for low latency.
      const userProf = await fetchUserProfile(
        result.user.id,
        { display_name: result.user.displayName },
        result.user.email
      );
      setProfile(userProf);
    }
    return result;
  }, []);

  // Sign Up action
  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    return await signUpWithEmail(credentials);
  }, []);

  // Sign Out action
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const result = await signOutUser();
    setUser(null);
    setSession(null);
    setProfile(null);
    return result;
  }, []);

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
