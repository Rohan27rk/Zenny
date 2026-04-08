import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, Legend,
} from 'recharts';
import { TransactionWithCategory } from '../lib/database.types';

interface Props {
    transactions: TransactionWithCategory[];
    formatCurrency: (n: number) => string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function buildCategoryData(transactions: TransactionWithCategory[]) {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const key = t.categories.name;
            if (!map[key]) map[key] = { name: key, value: 0, color: t.categories.color };
            map[key].value += Number(t.amount);
        });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 6);
}

function buildMonthlyData(transactions: TransactionWithCategory[]) {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!map[key]) map[key] = { month: label, income: 0, expense: 0 };
        if (t.type === 'income') map[key].income += Number(t.amount);
        else map[key].expense += Number(t.amount);
    });
    return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([, v]) => v);
}

function buildDailySpend(transactions: TransactionWithCategory[]) {
    const map: Record<string, number> = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const d = new Date(t.date);
            const key = d.toLocaleString('default', { month: 'short', day: 'numeric' });
            map[key] = (map[key] ?? 0) + Number(t.amount);
        });
    return Object.entries(map).slice(-14).map(([day, amount]) => ({ day, amount }));
}

// ── tooltip styles ────────────────────────────────────────────────────────────

const tooltipStyle = {
    contentStyle: {
        background: 'rgba(15,15,26,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    labelStyle: { color: '#94a3b8' },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
};

// ── sub-components ────────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/8 p-5 ${className}`}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <p className="text-sm font-semibold text-slate-300 mb-4">{children}</p>;
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function SpendingDonut({ data, formatCurrency }: { data: ReturnType<typeof buildCategoryData>; formatCurrency: (n: number) => string }) {
    const total = data.reduce((s, d) => s + d.value, 0);

    if (data.length === 0) return (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No expense data yet</div>
    );

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                            paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                </ResponsiveContainer>
                {/* centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(total)}</p>
                </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <p className="text-xs text-slate-400 truncate flex-1">{d.name}</p>
                        <p className="text-xs font-semibold text-white flex-shrink-0">{Math.round((d.value / total) * 100)}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Monthly bar chart ─────────────────────────────────────────────────────────

function MonthlyBars({ data, formatCurrency }: { data: ReturnType<typeof buildMonthlyData>; formatCurrency: (n: number) => string }) {
    if (data.length === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No monthly data yet</div>
    );

    return (
        <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ── Daily spend area chart ────────────────────────────────────────────────────

function DailySpendArea({ data, formatCurrency }: { data: ReturnType<typeof buildDailySpend>; formatCurrency: (n: number) => string }) {
    if (data.length === 0) return (
        <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No spend data yet</div>
    );

    return (
        <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="amount" name="Spent" stroke="#8b5cf6" strokeWidth={2} fill="url(#spendGrad)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ── Savings rate widget ───────────────────────────────────────────────────────

function SavingsRate({ transactions, formatCurrency }: { transactions: TransactionWithCategory[]; formatCurrency: (n: number) => string }) {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const rate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    const saved = Math.max(0, income - expense);

    const color = rate >= 20 ? '#22c55e' : rate >= 10 ? '#f59e0b' : '#ef4444';
    const label = rate >= 20 ? 'Great job! 🎉' : rate >= 10 ? 'Getting there 💪' : 'Needs attention ⚠️';

    return (
        <div className="flex items-center gap-4">
            {/* ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - rate / 100)}`}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-bold" style={{ color }}>{rate}%</p>
                </div>
            </div>
            <div>
                <p className="text-white font-semibold">{label}</p>
                <p className="text-slate-400 text-xs mt-0.5">Saved {formatCurrency(saved)} so far</p>
                <p className="text-slate-500 text-xs mt-1">Target: 20% savings rate</p>
            </div>
        </div>
    );
}

// ── Top spends ────────────────────────────────────────────────────────────────

function TopSpends({ data, formatCurrency }: { data: ReturnType<typeof buildCategoryData>; formatCurrency: (n: number) => string }) {
    const max = data[0]?.value ?? 1;
    return (
        <div className="space-y-3">
            {data.slice(0, 4).map((d, i) => (
                <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-300">{d.name}</p>
                        <p className="text-xs font-semibold text-white">{formatCurrency(d.value)}</p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
                    </div>
                </div>
            ))}
            {data.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No expense data yet</p>}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DashboardCharts({ transactions, formatCurrency }: Props) {
    const categoryData = buildCategoryData(transactions);
    const monthlyData = buildMonthlyData(transactions);
    const dailyData = buildDailySpend(transactions);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

            {/* Spending by category donut */}
            <GlassCard>
                <SectionTitle>Spending by Category</SectionTitle>
                <SpendingDonut data={categoryData} formatCurrency={formatCurrency} />
            </GlassCard>

            {/* Savings rate */}
            <GlassCard>
                <SectionTitle>Savings Rate</SectionTitle>
                <SavingsRate transactions={transactions} formatCurrency={formatCurrency} />
            </GlassCard>

            {/* Monthly income vs expense */}
            <GlassCard className="lg:col-span-2">
                <SectionTitle>Monthly Income vs Expenses</SectionTitle>
                <MonthlyBars data={monthlyData} formatCurrency={formatCurrency} />
            </GlassCard>

            {/* Daily spend trend */}
            <GlassCard>
                <SectionTitle>Daily Spend (last 14 days)</SectionTitle>
                <DailySpendArea data={dailyData} formatCurrency={formatCurrency} />
            </GlassCard>

            {/* Top spending categories bar */}
            <GlassCard>
                <SectionTitle>Top Spending Categories</SectionTitle>
                <TopSpends data={categoryData} formatCurrency={formatCurrency} />
            </GlassCard>

        </div>
    );
}
