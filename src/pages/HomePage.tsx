import { BarChart2, CreditCard, Upload, Target, TrendingUp, TrendingDown, Wallet, ArrowRight, Zap, Shield, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TransactionWithCategory } from '../lib/database.types';

interface HomePageProps {
    transactions: TransactionWithCategory[];
    stats: { totalBalance: number; totalIncome: number; totalExpense: number };
    formatCurrency: (n: number) => string;
    onNavigate: (tab: string) => void;
    onImport: () => void;
}

const services = [
    { id: 'analytics', icon: <BarChart2 className="w-6 h-6" />, title: 'Analytics', desc: 'Visual charts & spending insights', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', bg: 'linear-gradient(135deg, #1e3a5f, #1e1e30)' },
    { id: 'credit-cards', icon: <CreditCard className="w-6 h-6" />, title: 'Credit Cards', desc: 'Track bills & due dates', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', bg: 'linear-gradient(135deg, #2d1b69, #1e1e30)' },
    { id: 'transactions', icon: <Zap className="w-6 h-6" />, title: 'Transactions', desc: 'View & manage all transactions', color: '#22c55e', glow: 'rgba(34,197,94,0.3)', bg: 'linear-gradient(135deg, #14532d, #1e1e30)' },
    { id: 'import', icon: <Upload className="w-6 h-6" />, title: 'Import PDF', desc: 'Auto-import bank statements', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', bg: 'linear-gradient(135deg, #451a03, #1e1e30)' },
    { id: 'analytics', icon: <PieChart className="w-6 h-6" />, title: 'Savings Goal', desc: 'Track your monthly savings rate', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', bg: 'linear-gradient(135deg, #0c4a6e, #1e1e30)' },
    { id: 'profile', icon: <Shield className="w-6 h-6" />, title: 'Profile', desc: 'Manage your account & settings', color: '#ec4899', glow: 'rgba(236,72,153,0.3)', bg: 'linear-gradient(135deg, #500724, #1e1e30)' },
];

export function HomePage({ transactions, stats, formatCurrency, onNavigate, onImport }: HomePageProps) {
    const { profile } = useAuth();
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
    const recentTxns = transactions.slice(0, 4);
    const savingsRate = stats.totalIncome > 0 ? Math.max(0, Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100)) : 0;

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-8">
            {/* Hero greeting */}
            <div className="relative rounded-3xl overflow-hidden p-7"
                style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0f0f2a 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(40px)' }} />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(40px)' }} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-slate-400 text-sm">{getGreeting()},</p>
                        <h1 className="text-3xl font-black text-white mt-0.5">{firstName} 👋</h1>
                        <p className="text-slate-400 text-sm mt-2">Here's your financial snapshot for today</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <p className="text-slate-400 text-xs">Net Balance</p>
                        <p className="text-3xl font-black" style={{ color: stats.totalBalance >= 0 ? '#22c55e' : '#ef4444' }}>
                            {formatCurrency(stats.totalBalance)}
                        </p>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: savingsRate >= 20 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: savingsRate >= 20 ? '#22c55e' : '#f59e0b' }}>
                            <Target className="w-3 h-3" />
                            {savingsRate}% savings rate
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Income', value: formatCurrency(stats.totalIncome), color: '#22c55e', icon: <TrendingUp className="w-4 h-4" />, bg: 'rgba(34,197,94,0.1)' },
                    { label: 'Expenses', value: formatCurrency(stats.totalExpense), color: '#ef4444', icon: <TrendingDown className="w-4 h-4" />, bg: 'rgba(239,68,68,0.1)' },
                    { label: 'Transactions', value: transactions.length.toString(), color: '#3b82f6', icon: <Zap className="w-4 h-4" />, bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Savings', value: formatCurrency(Math.max(0, stats.totalIncome - stats.totalExpense)), color: '#8b5cf6', icon: <Wallet className="w-4 h-4" />, bg: 'rgba(139,92,246,0.1)' },
                ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-4 border border-white/8 transition-all duration-300 hover:-translate-y-1"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                        <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Services grid */}
            <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Access</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {services.map((s, i) => (
                        <button key={i} onClick={() => s.id === 'import' ? onImport() : onNavigate(s.id)}
                            className="text-left rounded-2xl p-4 border border-white/8 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group"
                            style={{ background: s.bg, boxShadow: `0 4px 20px rgba(0,0,0,0.2)` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                                style={{ background: `${s.color}20`, color: s.color, boxShadow: `0 0 20px ${s.glow}` }}>
                                {s.icon}
                            </div>
                            <p className="text-sm font-semibold text-white">{s.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-2 group-hover:text-slate-400 group-hover:translate-x-1 transition-all duration-200" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent transactions */}
            {recentTxns.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</p>
                        <button onClick={() => onNavigate('transactions')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="rounded-2xl border border-white/8 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                        {recentTxns.map((t, i) => (
                            <div key={t.id} className={`flex items-center justify-between px-4 py-3 ${i < recentTxns.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                        style={{ background: `${t.categories.color}18`, border: `1px solid ${t.categories.color}25` }}>
                                        💰
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{t.title}</p>
                                        <p className="text-xs text-slate-500">{t.categories.name} · {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
