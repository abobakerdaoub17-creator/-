import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        loadProfile(sess.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setUser({
        id: data.id,
        name: data.name || 'مستخدم',
        role: data.role as 'admin' | 'sales',
      });
    } else {
      setUser({ id: userId, name: 'مستخدم', role: 'sales' });
    }
    setLoading(false);
  }

  async function signUp(email: string, password: string, name: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { error: translateError(error.message) };

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        role: 'sales',
      });
    }

    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message) };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <Ctx.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'هذا البريد مسجل بالفعل';
  if (msg.includes('Password should be')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (msg.includes('Unable to send email')) return 'تعذر إرسال بريد التأكيد';
  return 'حدث خطأ، حاول مرة أخرى';
}
