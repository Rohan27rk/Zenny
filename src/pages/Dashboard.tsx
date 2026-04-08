import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Transaction, Category, TransactionWithCategory } from '../lib/database.types';
import { TransactionList } from '../components/TransactionList';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { ImportPDFModal } from '../components/ImportPDFModal';
import { DashboardCharts } from '../components/DashboardCharts';
import { ProfilePage } from './ProfilePage';
import { CreditCards } from './CreditCards';
import { HomePage } from './HomePage';
import { SIPTracker } from './SIPTracker';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus,
  LogOut, Upload, BarChart2, List, User, Menu, X, Home, CreditCard, RefreshCw,
} from 'lucide-react';
import { ZennyLogo } from '../components/ZennyLogo';

type DashTab = 'home' | 'analytics' | 'transactions' | 'credit-cards' | 'sip' | 'profile';
interface FinancialStats { totalBalance: number; totalIncome: number; totalExpense: number; }

const TAB_KEY = 'sf_active_tab';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<FinancialStats>({ totalBalance: 0, totalIncome: 0, totalExpense: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashTab>(() => {
    const saved = localStorage.getItem(TAB_KEY) as DashTab | null;
    return saved ?? 'home';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (tab: string) => {
    setActiveTab(tab as DashTab);
    localStorage.setItem(TAB_KEY, tab);
    setSidebarOpen(false);
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try { await Promise.all([fetchTransactions(), fetchCategories()]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('transactions').select('*, categories(*)').order('date', { ascending: false });
    if (error) { console.error(error); return; }
    if (data) { setTransactions(data as TransactionWithCategory[]); calculateStats(data as Transaction[]); }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) { console.error(error); return; }
    if (data) setCategories(data);
  };

  const calculateStats = (txns: Transaction[]) => {
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    setStats({ totalIncome: income, totalExpense: expense, totalBalance: income - expense });
  };

  const handleTransactionAdded = () => { fetchTransactions(); setIsAddModalOpen(false); };
  const handleImportSuccess = () => { fetchTransactions(); setIsImportOpen(false); };
  const handleTransactionDeleted = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error(error); return; }
    fetchTransactions();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: profile?.currency ?? 'INR', maximumFractionDigits: 0 }).format(amount);

  const navItems: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'credit-cards', label: 'Credit Cards', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'sip', label: 'SIP Tracker', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <List className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #1a1a2e 100%)' }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 40px rgba(139,92,246,0.6)' }}>
            <ZennyLogo size={42} />
          </div>
          <p className="text-white font-bold text-lg">Zenny</p>
          <p className="text-slate-500 text-sm animate-pulse mt-1">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex"
      style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #1a1a2e 100%)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(80px)' }} />
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen z-50 w-60 flex flex-col border-r border-white/8 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto lg:h-auto lg:min-h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, rgba(10,10,20,0.98) 0%, rgba(20,20,40,0.98) 100%)', backdropFilter: 'blur(20px)' }}>

        <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 18px rgba(139,92,246,0.55)' }}>
              <ZennyLogo size={22} />
            </div>
            <span className="font-black text-base gradient-text tracking-tight">Zenny</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 12px rgba(139,92,246,0.4)' }}>
              {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => navigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left"
              style={activeTab === item.id
                ? { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', boxShadow: '0 0 0 1px rgba(59,130,246,0.25)' }
                : { color: 'rgba(255,255,255,0.45)' }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-center text-slate-700 text-[10px] mt-3">by <span className="text-slate-500">Rohan Kanegaonkar</span></p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/8"
          style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm gradient-text">Zenny</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">

          {activeTab === 'home' && (
            <HomePage transactions={transactions} stats={stats} formatCurrency={formatCurrency} onNavigate={navigate} onImport={() => setIsImportOpen(true)} />
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Analytics</h2>
                <p className="text-slate-500 text-sm mt-0.5">Your financial overview</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Net Balance" value={formatCurrency(stats.totalBalance)}
                  valueColor={stats.totalBalance >= 0 ? '#22c55e' : '#ef4444'}
                  glowColor="rgba(59,130,246,0.15)" icon={<Wallet className="w-5 h-5" />}
                  iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)" iconGlow="rgba(59,130,246,0.5)" sub={`${transactions.length} transactions`} />
                <StatCard label="Total Income" value={formatCurrency(stats.totalIncome)}
                  valueColor="#22c55e" glowColor="rgba(34,197,94,0.1)"
                  icon={<TrendingUp className="w-5 h-5" />}
                  iconBg="linear-gradient(135deg, #22c55e, #15803d)" iconGlow="rgba(34,197,94,0.5)" sub="All time" />
                <StatCard label="Total Expenses" value={formatCurrency(stats.totalExpense)}
                  valueColor="#ef4444" glowColor="rgba(239,68,68,0.1)"
                  icon={<TrendingDown className="w-5 h-5" />}
                  iconBg="linear-gradient(135deg, #ef4444, #b91c1c)" iconGlow="rgba(239,68,68,0.5)" sub="All time" />
              </div>
              <DashboardCharts transactions={transactions} formatCurrency={formatCurrency} />
            </div>
          )}

          {activeTab === 'credit-cards' && <CreditCards />}

          {activeTab === 'sip' && <SIPTracker />}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Transactions</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{transactions.length} total</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-200">
                    <Upload className="w-3.5 h-3.5" /> Import PDF
                  </button>
                  <button onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 p-5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                <TransactionList transactions={transactions} onDelete={handleTransactionDeleted} formatCurrency={formatCurrency} />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfilePage />
            </div>
          )}
        </main>
      </div>

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} categories={categories} onSuccess={handleTransactionAdded} onGoToCards={() => { setIsAddModalOpen(false); navigate('credit-cards'); }} />
      <ImportPDFModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} categories={categories} onSuccess={handleImportSuccess} />
    </div>
  );
}

function StatCard({ label, value, valueColor, glowColor, icon, iconBg, iconGlow, sub }: {
  label: string; value: string; valueColor: string; glowColor: string;
  icon: React.ReactNode; iconBg: string; iconGlow: string; sub?: string;
}) {
  return (
    <div className="relative rounded-2xl p-5 border border-white/8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px ${glowColor}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1.5">{label}</p>
          <p className="text-xl font-bold" style={{ color: valueColor }}>{value}</p>
          {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: iconBg, boxShadow: `0 6px 16px ${iconGlow}` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
