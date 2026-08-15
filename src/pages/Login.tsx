import { useState } from 'react';
import { Settings, Loader as Loader2, Mail, Lock, User as UserIcon, UserCog, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Login() {
  const { signIn, signUp, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error);
    } else {
      if (name.trim().length < 2) {
        setError('الرجاء إدخال الاسم');
        setBusy(false);
        return;
      }
      const { error } = await signUp(email.trim(), password, name.trim());
      if (error) setError(error);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100" style={{ direction: 'rtl' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center text-white shadow-lg shadow-primary-600/20 mb-4">
            <Settings className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">قطع غيار السيارات</h1>
          <p className="text-sm text-secondary-500 mt-1">نظام إدارة مبيعات الجملة والشحنات</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-secondary-200/50 p-6 sm:p-8 border border-secondary-100">
          <div className="flex gap-1 p-1 bg-secondary-100 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-500'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-500'
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-secondary-700 mb-1.5">الاسم</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-secondary-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    disabled={busy}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-secondary-700 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@autoparts.ly"
                  required
                  dir="ltr"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-secondary-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  disabled={busy}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-secondary-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  disabled={busy}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-error-700 bg-error-50 rounded-lg px-3 py-2.5 border border-error-100 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 cursor-pointer"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'دخول' : 'إنشاء حساب'}
            </button>
          </form>

          {/* Quick demo roles */}
          <div className="mt-6 pt-6 border-t border-secondary-100">
            <p className="text-xs text-secondary-500 font-semibold mb-3 text-center">
              أو تجربة سريعة بدون كلمة مرور:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => demoLogin('admin')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-primary-200 bg-primary-50/50 hover:bg-primary-100 text-primary-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <UserCog className="w-4 h-4 text-primary-600" />
                دخول كمدير (Admin)
              </button>
              <button
                type="button"
                onClick={() => demoLogin('sales')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-success-200 bg-success-50/50 hover:bg-success-100 text-success-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-success-600" />
                دخول كمندوب (Sales)
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-secondary-400 mt-6">
          نظام متكامل لإدارة قطع الغيار، الشحنات من الصين، الجولات، وفواتير العملاء
        </p>
      </div>
    </div>
  );
}
