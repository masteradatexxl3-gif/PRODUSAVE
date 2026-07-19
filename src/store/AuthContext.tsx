import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Role, User } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, role?: Role) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AVATAR_COLORS = ['#5865F2', '#D97706', '#059669', '#DC2626', '#7C3AED', '#DB2777', '#0891B2', '#EA580C'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string, email: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error || !profile) return null;

    return {
      id: profile.id,
      tenantId: profile.tenant_id ?? '',
      name: profile.name,
      email,
      role: (profile.role === 'super_admin' ? 'superadmin' : profile.role === 'boss' ? 'boss' : 'employee') as Role,
      avatarColor: AVATAR_COLORS[profile.role === 'super_admin' ? 0 : (profile.role.charCodeAt(0) % AVATAR_COLORS.length)],
      online: true,
      lastSeen: 'ahora',
      lastSeenAt: profile.last_seen_at ?? null,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        if (mounted) setUser(profile);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUser(null);
        return;
      }
      (async () => {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        if (mounted) setUser(profile);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const profile = await loadProfile(session.user.id, session.user.email ?? '');
    setUser(profile);
  }, [session, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string, role: Role = 'boss') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        role: role === 'superadmin' ? 'super_admin' : role,
        tenant_id: null,
      });
      if (profileError) return { error: profileError.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
