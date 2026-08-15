import { useState, useEffect, useCallback } from 'react';
import { UserCog, UserCheck, Shield, Mail, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, EmptyState } from '@/components/ui/Form';
import * as db from '@/lib/db';
import { formatDate } from '@/lib/format';

interface ProfileRow {
  id: string;
  name: string;
  role: string;
  created_at: string;
  email: string;
}

export function Users() {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await db.getAllProfiles();
      setUsers(rows);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId: string, newRole: 'admin' | 'sales') => {
    if (userId === currentUser.id && newRole === 'sales') return;
    setBusyId(userId);
    try {
      await db.updateProfileRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-secondary-900">إدارة المستخدمين</h2>
        <p className="text-sm text-secondary-500">
          {users.length} مستخدم • {adminCount} مدير • {users.length - adminCount} مندوب
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100">
          <EmptyState icon={<UserCog className="w-8 h-8" />} title="لا يوجد مستخدمون" description="لم يقم أي شخص بإنشاء حساب بعد" />
        </div>
      ) : (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-secondary-50 border-b border-secondary-100">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-secondary-500">
              <div className="col-span-4">الاسم</div>
              <div className="col-span-5 hidden sm:block">البريد الإلكتروني</div>
              <div className="col-span-3 sm:col-span-2 text-center">الدور</div>
              <div className="col-span-5 sm:col-span-1 text-center">إجراء</div>
            </div>
          </div>
          <div className="divide-y divide-secondary-50">
            {users.map((u) => {
              const isAdmin = u.role === 'admin';
              const isYou = u.id === currentUser.id;
              return (
                <div key={u.id} className="px-4 py-3.5 hover:bg-secondary-50/50 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-success-100 text-success-700'}`}>
                        {isAdmin ? <UserCog className="w-4.5 h-4.5" /> : <UserCheck className="w-4.5 h-4.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-secondary-800 truncate">
                          {u.name || 'بدون اسم'}
                          {isYou && <span className="text-xs text-secondary-400 font-normal mr-1">(أنت)</span>}
                        </p>
                        <p className="text-xs text-secondary-400 sm:hidden truncate">{u.email}</p>
                        <p className="text-[10px] text-secondary-300 hidden sm:block">{formatDate(u.created_at)}</p>
                      </div>
                    </div>
                    <div className="col-span-5 hidden sm:flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-secondary-300 shrink-0" />
                      <span className="text-sm text-secondary-600 truncate" dir="ltr">{u.email}</span>
                    </div>
                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                      <Badge tone={isAdmin ? 'primary' : 'success'} icon={<Shield className="w-3 h-3" />}>
                        {isAdmin ? 'مدير' : 'مندوب'}
                      </Badge>
                    </div>
                    <div className="col-span-5 sm:col-span-1 flex justify-center gap-1">
                      {busyId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-secondary-400" />
                      ) : (
                        <>
                          {!isAdmin && (
                            <button
                              onClick={() => changeRole(u.id, 'admin')}
                              title="ترقية إلى مدير"
                              className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && !isYou && (
                            <button
                              onClick={() => changeRole(u.id, 'sales')}
                              title="تخفيض إلى مندوب"
                              className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800">
        <p className="font-semibold mb-1">ملاحظات</p>
        <ul className="space-y-1 text-xs text-primary-700">
          <li>• المدير: يرى جميع الأقسام بما فيها الشحنات والمخزون</li>
          <li>• المندوب: يرى الفواتير والعملاء ومبيعاته فقط</li>
          <li>• لا يمكنك تخفيض دورك أنت من مدير إلى مندوب</li>
        </ul>
      </div>
    </div>
  );
}
