import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CurrentUser } from '@/types';

interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'sales';
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  currentUser: CurrentUser;
  role: 'admin' | 'sales';
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoLogin: (asRole: 'admin' | 'sales') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USERS: Record<'admin' | 'sales', Profile> = {
  admin: {
    id: 'user-admin',
    name: 'مدير النظام (Admin)',
    role: 'admin',
    email: 'admin@autoparts.ly',
  },
  sales: {
    id: 'user-sales',
    name: 'أحمد المندوب (Sales)',
    role: 'sales',
    email: 'ahmed.sales@autoparts.ly',
  },
};

const DEMO_STORAGE_KEY = 'beko_demo_user_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, email')
        .eq('id', uid)
        .maybeSingle();

      if (error || !data) {
        return { id: uid, name: 'مستخدم', role: 'sales', email: '' };
      }
      return data as Profile;
    } catch {
      return { id: uid, name: 'مستخدم', role: 'sales', email: '' };
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In demo mode, restore stored role or default to admin
      const saved = localStorage.getItem(DEMO_STORAGE_KEY) as 'admin' | 'sales' | null;
      const initial = DEMO_USERS[saved && DEMO_USERS[saved] ? saved : 'admin'];
      setProfile(initial);
      setUser({ id: initial.id, email: initial.email } as unknown as User);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (mounted) setProfile(p);
        } else {
          // If no session and not in production, fallback to demo profile
          const saved = localStorage.getItem(DEMO_STORAGE_KEY) as 'admin' | 'sales' | null;
          const initial = DEMO_USERS[saved && DEMO_USERS[saved] ? saved : 'admin'];
          setProfile(initial);
          setUser({ id: initial.id, email: initial.email } as unknown as User);
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
        const initial = DEMO_USERS.admin;
        setProfile(initial);
        setUser({ id: initial.id, email: initial.email } as unknown as User);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (mounted) setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const isSales = email.toLowerCase().includes('sale');
      const selected = isSales ? DEMO_USERS.sales : DEMO_USERS.admin;
      setProfile(selected);
      setUser({ id: selected.id, email: selected.email } as unknown as User);
      localStorage.setItem(DEMO_STORAGE_KEY, selected.role);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message || 'فشل تسجيل الدخول' };
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    if (!isSupabaseConfigured) {
      const newProf: Profile = {
        id: 'user-' + Date.now(),
        name,
        email,
        role: 'sales',
      };
      setProfile(newProf);
      setUser({ id: newProf.id, email } as unknown as User);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name } },
      });
      if (error) return { error: error.message };
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          role: 'sales',
          email,
        });
      }
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message || 'فشل إنشاء الحساب' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const demoLogin = (asRole: 'admin' | 'sales') => {
    const selected = DEMO_USERS[asRole];
    setProfile(selected);
    setUser({ id: selected.id, email: selected.email } as unknown as User);
    localStorage.setItem(DEMO_STORAGE_KEY, asRole);
  };

  const role = profile?.role ?? 'sales';
  const currentUser: CurrentUser = {
    id: profile?.id ?? 'user-demo',
    email: profile?.email ?? 'demo@autoparts.ly',
    name: profile?.name ?? 'مستخدم',
    role,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentUser,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
