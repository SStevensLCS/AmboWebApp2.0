import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@ambo/database/types';
import type { Session } from '@supabase/supabase-js';

// Max time to wait for initial auth check before unblocking the UI
const AUTH_TIMEOUT_MS = 4000;

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchUserRole(session.user.id);
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
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const session = (await supabase.auth.getSession()).data.session;

    setState({
      session,
      userRole: error ? null : (data.role as UserRole),
      isLoading: false,
    });
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
