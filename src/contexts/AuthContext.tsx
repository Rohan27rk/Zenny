import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsOtp?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      // Try profiles table first
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        setProfile(data as Profile);
        setProfileLoading(false);
        setLoading(false);
        return;
      }
    } catch (_) { }

    // Fallback: use auth user metadata as profile store
    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const fallbackProfile: Profile = {
      id: userId,
      full_name: meta.full_name ?? null,
      phone: meta.phone ?? null,
      date_of_birth: meta.date_of_birth ?? null,
      occupation: meta.occupation ?? null,
      monthly_income: meta.monthly_income ?? null,
      savings_goal_pct: meta.savings_goal_pct ?? 20,
      currency: meta.currency ?? 'INR',
      avatar_url: meta.avatar_url ?? null,
      onboarding_complete: meta.onboarding_complete ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfile(fallbackProfile);
    setProfileLoading(false);
    setLoading(false);
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error, needsOtp: !error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] signIn attempt:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[Auth] signIn result:', { data, error });
      if (!error && !data.session) {
        return { error: new Error('Please confirm your email address first. Check your inbox for a confirmation link.') };
      }
      return { error };
    } catch (error) {
      console.error('[Auth] signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[Auth] Google OAuth attempt, redirectTo:', window.location.origin);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account', // always show account picker
            access_type: 'offline',
          },
        },
      });
      console.log('[Auth] Google OAuth result:', { data, error });
      return { error };
    } catch (error) {
      console.error('[Auth] Google OAuth exception:', error);
      return { error: error as Error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      // Try profiles table first
      const { error: tableError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...data, updated_at: new Date().toISOString() });

      if (tableError) {
        // Fallback: save to auth user metadata
        const { error: metaError } = await supabase.auth.updateUser({ data });
        if (metaError) return { error: metaError };
      }

      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, profileLoading, signUp, signIn, signInWithGoogle, verifyOtp, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
