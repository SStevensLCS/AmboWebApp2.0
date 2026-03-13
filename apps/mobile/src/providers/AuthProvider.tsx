import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@ambo/database/types';
import type { Session } from '@supabase/supabase-js';

// Max time to wait for initial auth check before unblocking the UI
const AUTH_TIMEOUT_MS = 4000;
// Max time to wait for a sign-in attempt before aborting
const SIGN_IN_TIMEOUT_MS = 20000;

interface AuthState {
  session: Session | null;
  userRole: UserRole | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    userRole: null,
    isLoading: true,
  });
  const initialAuthResolved = useRef(false);

  useEffect(() => {
    // Timeout: unblock the UI if auth takes too long (cold-start hang fix).
    // The onAuthStateChange listener below will still update state if the
    // session resolves after the timeout, so the user won't be locked out.
    const timeout = setTimeout(() => {
      if (!initialAuthResolved.current) {
        initialAuthResolved.current = true;
        setState(prev => {
          if (prev.isLoading) {
            return { ...prev, isLoading: false };
          }
          return prev;
        });
      }
    }, AUTH_TIMEOUT_MS);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initialAuthResolved.current) return; // timeout already fired
      initialAuthResolved.current = true;
      clearTimeout(timeout);

      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes — this keeps working even after a timeout,
    // so a late-arriving session still logs the user in.
    // IMPORTANT: Do NOT await inside this callback — it can block
    // signInWithPassword from resolving its promise.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchUserRole(session.user.id).catch(err => {
            if (__DEV__) console.error('[Auth] onAuthStateChange fetchUserRole error:', err);
          });
        } else {
          setState({ session: null, userRole: null, isLoading: false });
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        if (__DEV__) console.error('[Auth] fetchUserRole error:', error.message);
      }

      const session = (await supabase.auth.getSession()).data.session;

      setState({
        session,
        userRole: error ? null : (data.role as UserRole),
        isLoading: false,
      });
    } catch (err) {
      if (__DEV__) console.error('[Auth] fetchUserRole unexpected error:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  async function signIn(email: string, password: string) {
    const result = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timed out. Please check your connection and try again.')), SIGN_IN_TIMEOUT_MS)
      ),
    ]);
    if (result.error) throw result.error;

    // Directly fetch role instead of relying on onAuthStateChange,
    // which can race against the client's internal session propagation.
    if (result.data?.session) {
      await fetchUserRole(result.data.session.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setState({ session: null, userRole: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
