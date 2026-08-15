import { useState } from 'react';
import { Loader as Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { Layout, type PageKey } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { Shipments } from '@/pages/Shipments';
import { Trips } from '@/pages/Trips';
import { Invoices } from '@/pages/Invoices';
import { Shops } from '@/pages/Shops';
import { MySales } from '@/pages/MySales';
import { Users } from '@/pages/Users';
import { Login } from '@/pages/Login';

function AuthGate() {
  const { user, profile, loading: authLoading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
          <p className="text-sm text-secondary-500 font-medium">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  if (!user && !profile) {
    return <Login />;
  }

  return (
    <AppProvider>
      <MainApp page={page} setPage={setPage} />
    </AppProvider>
  );
}

function MainApp({ page, setPage }: { page: PageKey; setPage: (p: PageKey) => void }) {
  const { role, loading: appLoading } = useApp();
  const isAdmin = role === 'admin';

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
          <p className="text-sm text-secondary-500 font-medium">جاري مزامنة البيانات...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'inventory':
        return <Inventory />;
      case 'shipments':
        return isAdmin ? <Shipments /> : <Dashboard onNavigate={setPage} />;
      case 'trips':
        return <Trips />;
      case 'invoices':
        return <Invoices />;
      case 'shops':
        return <Shops />;
      case 'my-sales':
        return <MySales />;
      case 'users':
        return isAdmin ? <Users /> : <Dashboard onNavigate={setPage} />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout current={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
