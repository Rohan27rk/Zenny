import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SIPInvestment, Category } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus, Trash2, X, AlertTriangle, Edit2, Check,
    Calendar, TrendingUp, Wallet, RefreshCw, PauseCircle, CheckCircle2, Zap,
} from 'lucide-react';

const SIP_COLORS = [
    'linear-gradient(135deg, #0f3460 0%, #533483 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
    'linear-gradient(135deg, #4a1942 0%, #831843 100%)',
    'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
    'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
    'linear-gradient(135deg, #14532d 0%, #166534 100%)',
];

const FUND_TYPES = ['equity', 'debt', 'hybrid', 'elss', 'index', 'other'] as const;
const FUND_TYPE_COLORS: Record<string, string> = {
    equity: '#3b82f6', debt: '#f59e0b', hybrid: '#8b5cf6',
    elss: '#22c55e', index: '#06b6d4', other: '#94a3b8',
};

const emptyForm = {
    fund_name: '', amc: '',
    fund_type: 'equity' as SIPInvestment['fund_type'],
    monthly_amount: '', sip_date: '5',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '', status: 'active' as SIPInvestment['status'],
    color: SIP_COLORS[0], notes: '',
};

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function ordinal(n: number) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function daysUntilNext(sipDate: number): number {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), sipDate);
    if (thisMonth >= today) return Math.ceil((thisMonth.getTime() - today.getTime()) / 86400000);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, sipDate);
    return Math.ceil((nextMonth.getTime() - today.getTime()) / 86400000);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SIPTracker() {
    const { user } = useAuth();
    const [sips, setSips] = useState<SIPInvestment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editSip, setEditSip] = useState<SIPInvestment | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => { if (user) fetchSips(); }, [user]);

    const fetchSips = async () => {
        setLoading(true);
        const { data } = await (supabase.from('sip_investments') as any).select('*').order('created_at', { ascending: false });
        setSips((data as SIPInvestment[]) ?? []);
        setLoading(false);
    };

    // Get or create "Investment" expense category
    const getInvestmentCategory = async (): Promise<string | null> => {
        const { data } = await supabase.from('categories').select('id').eq('name', 'Investment').eq('type', 'expense').maybeSingle();
        if (data) return data.id;
        // Create it
        const { data: created } = await supabase.from('categories').insert({
            name: 'Investment', type: 'expense', icon: 'trending-up',
            color: '#22c55e', is_default: false, user_id: user!.id,
        }).select('id').single();
        return created?.id ?? null;
    };

    const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
    const [logging, setLogging] = useState<string | null>(null);

    const logSipTransaction = async (sip: SIPInvestment) => {
        setLogging(sip.id);
        const categoryId = await getInvestmentCategory();
        if (!categoryId) { setLogging(null); return; }
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('transactions').insert({
            user_id: user!.id,
            title: `SIP — ${sip.fund_name}`,
            amount: sip.monthly_amount,
            type: 'expense',
            category_id: categoryId,
            date: today,
            notes: `Auto-logged SIP debit for ${sip.amc}`,
        });
        setLoggedIds(prev => new Set(prev).add(sip.id));
        setLogging(null);
    };

    const openAdd = () => { setEditSip(null); setForm({ ...emptyForm }); setFormError(''); setShowModal(true); };
    const openEdit = (sip: SIPInvestment) => {
        setEditSip(sip);
        setForm({
            fund_name: sip.fund_name, amc: sip.amc, fund_type: sip.fund_type,
            monthly_amount: String(sip.monthly_amount), sip_date: String(sip.sip_date),
            start_date: sip.start_date, end_date: sip.end_date ?? '',
            status: sip.status, color: sip.color, notes: sip.notes ?? '',
        });
        setFormError(''); setShowModal(true);
    };

    const handleSave = async () => {
        setFormError('');
        if (!form.fund_name.trim() || !form.amc.trim()) { setFormError('Fund name and AMC are required'); return; }
        if (!form.monthly_amount || Number(form.monthly_amount) <= 0) { setFormError('Monthly amount must be greater than 0'); return; }
        setSaving(true);
        const payload = {
            fund_name: form.fund_name.trim(), amc: form.amc.trim(),
            fund_type: form.fund_type, monthly_amount: Number(form.monthly_amount),
            sip_date: Number(form.sip_date) || 5,
            start_date: form.start_date,
            end_date: form.end_date || null,
            status: form.status, color: form.color,
            notes: form.notes || null, updated_at: new Date().toISOString(),
        };
        const { error: e } = editSip
            ? await (supabase.from('sip_investments') as any).update(payload).eq('id', editSip.id)
            : await (supabase.from('sip_investments') as any).insert({ ...payload, user_id: user!.id });
        if (e) { setFormError(e.message); setSaving(false); return; }
        setSaving(false); setShowModal(false); fetchSips();
    };

    const handleDelete = async (id: string) => {
        await (supabase.from('sip_investments') as any).delete().eq('id', id);
        setDeleteId(null); fetchSips();
    };

    const activeSips = sips.filter(s => s.status === 'active');
    const totalMonthly = activeSips.reduce((s, sip) => s + sip.monthly_amount, 0);
    const totalYearly = totalMonthly * 12;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">SIP Tracker</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {sips.length} SIP{sips.length !== 1 ? 's' : ''} · never miss a debit date
                    </p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                    <Plus className="w-4 h-4" /> Add SIP
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <p className="text-slate-500 text-sm animate-pulse">Loading SIPs...</p>
                </div>
            ) : sips.length === 0 ? (
                <EmptyState onAdd={openAdd} />
            ) : (
                <>
                    {/* Summary bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard label="Monthly SIP Total" value={fmt(totalMonthly)}
                            icon={<RefreshCw className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #22c55e, #15803d)" glow="rgba(34,197,94,0.3)"
                            sub={`${activeSips.length} active SIP${activeSips.length !== 1 ? 's' : ''}`} subColor="#22c55e" />
                        <SummaryCard label="Yearly Commitment" value={fmt(totalYearly)}
                            icon={<TrendingUp className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)" glow="rgba(59,130,246,0.3)" />
                        <SummaryCard label="Total SIPs" value={String(sips.length)}
                            icon={<Wallet className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)" glow="rgba(139,92,246,0.3)"
                            sub={`${sips.filter(s => s.status === 'paused').length} paused`} subColor="#f59e0b" />
                    </div>

                    {/* SIP grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {sips.map(sip => (
                            <SIPTile key={sip.id} sip={sip} onEdit={openEdit} onDelete={id => setDeleteId(id)}
                                onLog={logSipTransaction} logged={loggedIds.has(sip.id)} logging={logging === sip.id} />
                        ))}
                    </div>
                </>
            )}

            {showModal && (
                <SIPModal form={form} setForm={setForm} editSip={editSip}
                    error={formError} saving={saving} onSave={handleSave} onClose={() => setShowModal(false)} />
            )}

            {/* Delete confirm */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '1rem' }}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setDeleteId(null)} />
                    <div className="relative z-10 w-80 rounded-2xl border border-white/10 p-6 text-center"
                        style={{ background: 'linear-gradient(145deg, #1e1e32, #14141f)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-white font-bold text-base mb-1">Delete this SIP?</p>
                        <p className="text-slate-500 text-xs mb-5">This action cannot be undone.</p>
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteId)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, iconBg, glow, sub, subColor }: {
    label: string; value: string; icon: React.ReactNode;
    iconBg: string; glow: string; sub?: string; subColor?: string;
}) {
    return (
        <div className="rounded-2xl p-4 border border-white/8 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: iconBg, boxShadow: `0 4px 14px ${glow}` }}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-white truncate">{value}</p>
                {sub && <p className="text-xs font-medium mt-0.5" style={{ color: subColor ?? '#94a3b8' }}>{sub}</p>}
            </div>
        </div>
    );
}

// ─── SIP Tile ─────────────────────────────────────────────────────────────────
function SIPTile({ sip, onEdit, onDelete, onLog, logged, logging }: {
    sip: SIPInvestment; onEdit: (s: SIPInvestment) => void; onDelete: (id: string) => void;
    onLog: (s: SIPInvestment) => void; logged: boolean; logging: boolean;
}) {
    const days = sip.status === 'active' ? daysUntilNext(sip.sip_date) : null;
    const typeColor = FUND_TYPE_COLORS[sip.fund_type] ?? '#94a3b8';
    const StatusIcon = sip.status === 'active' ? CheckCircle2 : sip.status === 'paused' ? PauseCircle : CheckCircle2;
    const statusColor = sip.status === 'active' ? '#22c55e' : sip.status === 'paused' ? '#f59e0b' : '#94a3b8';
    // Show log button if SIP is active and debit is today or tomorrow
    const showLogBtn = sip.status === 'active' && days !== null && days <= 1;

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{ background: '#0f0f1a', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>

            {/* Card face */}
            <div className="p-3 pt-4 pb-0">
                <div className="relative rounded-xl overflow-hidden flex flex-col justify-between p-4"
                    style={{ background: sip.color, minHeight: '130px' }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-25"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7), transparent)', filter: 'blur(20px)' }} />
                    </div>
                    {/* Top row */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <div>
                            <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">{sip.amc}</p>
                            <p className="text-white font-bold text-sm mt-0.5 leading-tight">{sip.fund_name}</p>
                        </div>
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{ background: `${typeColor}30`, border: `1px solid ${typeColor}50`, color: typeColor }}>
                            {sip.fund_type}
                        </span>
                    </div>
                    {/* Bottom row */}
                    <div className="relative z-10 flex items-end justify-between">
                        <div>
                            <p className="text-white/50 text-[10px] uppercase tracking-wider">Monthly SIP</p>
                            <p className="text-white font-bold text-lg">{fmt(sip.monthly_amount)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${statusColor}20` }}>
                            <StatusIcon className="w-3 h-3" style={{ color: statusColor }} />
                            <span className="text-[10px] font-semibold capitalize" style={{ color: statusColor }}>{sip.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="p-3 flex flex-col gap-2.5 flex-1">

                {/* Next debit countdown */}
                {days !== null && (
                    <div className="rounded-xl p-3 border border-white/5 flex items-center justify-between"
                        style={{ background: days <= 3 ? 'rgba(239,68,68,0.08)' : days <= 7 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', borderColor: days <= 3 ? 'rgba(239,68,68,0.2)' : days <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" style={{ color: days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e' }} />
                            <span className="text-xs text-slate-400">Next debit</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: days <= 3 ? '#ef4444' : days <= 7 ? '#f59e0b' : '#22c55e' }}>
                            {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                        </span>
                    </div>
                )}

                {/* Dates row */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 border border-white/5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                            <Calendar className="w-3 h-3 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide">SIP Date</p>
                            <p className="text-xs font-bold text-white">{sip.sip_date}<sup className="text-[8px]">{ordinal(sip.sip_date)}</sup></p>
                        </div>
                    </div>
                    <div className="rounded-xl p-2.5 border border-white/5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Since</p>
                            <p className="text-xs font-bold text-white">
                                {new Date(sip.start_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Log SIP button — shown when debit is today or tomorrow */}
                {showLogBtn && (
                    <button onClick={() => !logged && onLog(sip)} disabled={logged || logging}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border"
                        style={logged
                            ? { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', cursor: 'default' }
                            : { background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.35)', color: '#4ade80' }}>
                        {logged
                            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Logged to transactions</>
                            : logging
                                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Logging...</>
                                : <><Zap className="w-3.5 h-3.5" /> Log {fmt(sip.monthly_amount)} SIP now</>
                        }
                    </button>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-0.5">
                    <button onClick={() => onEdit(sip)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/8 hover:bg-white/5 hover:text-white transition-all">
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => onDelete(sip.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-500/15 text-red-400 hover:bg-red-500/10 hover:border-red-500/35 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="rounded-2xl border border-white/8 flex flex-col items-center justify-center py-20 text-center px-6"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <RefreshCw className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-bold text-base mb-1">No SIPs tracked yet</p>
            <p className="text-slate-500 text-sm mb-5 max-w-xs">Add your SIPs to track debit dates, monthly commitments and never miss an investment.</p>
            <button onClick={onAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}>
                <Plus className="w-4 h-4" /> Add Your First SIP
            </button>
        </div>
    );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface ModalProps {
    form: typeof emptyForm; setForm: (f: typeof emptyForm) => void;
    editSip: SIPInvestment | null; error: string; saving: boolean;
    onSave: () => void; onClose: () => void;
}

function SIPModal({ form, setForm, editSip, error, saving, onSave, onClose }: ModalProps) {
    const set = (k: keyof typeof emptyForm, v: string) => setForm({ ...form, [k]: v });

    const inputCls = "w-full px-3 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border text-sm";
    const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' };
    const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = 'rgba(34,197,94,0.6)';
        e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)';
    };
    const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] flex flex-col"
                style={{ background: 'linear-gradient(135deg, #1e1e30, #16162a)', boxShadow: '0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)', animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 4px 10px rgba(34,197,94,0.35)' }}>
                            <RefreshCw className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-white">{editSip ? 'Edit SIP' : 'Add SIP'}</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {error && (
                        <div className="px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30 flex items-center gap-2"
                            style={{ background: 'rgba(239,68,68,0.08)' }}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                        </div>
                    )}

                    {/* Fund Details */}
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Fund Details</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fund Name *</label>
                                <input className={inputCls} style={inputStyle} placeholder="e.g. Mirae Asset Large Cap Fund"
                                    value={form.fund_name} onChange={e => set('fund_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">AMC / Platform *</label>
                                    <input className={inputCls} style={inputStyle} placeholder="e.g. Groww, Zerodha"
                                        value={form.amc} onChange={e => set('amc', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Monthly Amount (₹) *</label>
                                    <input type="number" className={inputCls} style={inputStyle} placeholder="0" min="1"
                                        value={form.monthly_amount} onChange={e => set('monthly_amount', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Fund Type</label>
                                <div className="flex gap-2 flex-wrap">
                                    {FUND_TYPES.map(t => {
                                        const c = FUND_TYPE_COLORS[t];
                                        return (
                                            <button key={t} type="button" onClick={() => set('fund_type', t)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border capitalize"
                                                style={form.fund_type === t
                                                    ? { background: `${c}20`, borderColor: `${c}60`, color: c }
                                                    : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
                                                {t.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Schedule</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">SIP Debit Date</label>
                                <input type="number" className={inputCls} style={inputStyle} placeholder="1–31" min="1" max="31"
                                    value={form.sip_date} onChange={e => set('sip_date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                                <div className="flex gap-2">
                                    {(['active', 'paused', 'completed'] as const).map(s => {
                                        const c = s === 'active' ? '#22c55e' : s === 'paused' ? '#f59e0b' : '#94a3b8';
                                        return (
                                            <button key={s} type="button" onClick={() => set('status', s)}
                                                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all border capitalize"
                                                style={form.status === s
                                                    ? { background: `${c}20`, borderColor: `${c}50`, color: c }
                                                    : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
                                <input type="date" className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
                                    value={form.start_date} onChange={e => set('start_date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date <span className="text-slate-600">(optional)</span></label>
                                <input type="date" className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties}
                                    value={form.end_date} onChange={e => set('end_date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                        </div>
                    </div>

                    {/* Card Colour */}
                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Card Colour</p>
                        <div className="flex gap-2 flex-wrap mb-4">
                            {SIP_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => set('color', c)}
                                    className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                    style={{ background: c, outline: form.color === c ? '2px solid rgba(34,197,94,0.8)' : '2px solid transparent', outlineOffset: '2px' }}>
                                    {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                                </button>
                            ))}
                        </div>
                        {/* Preview */}
                        <div className="relative rounded-xl overflow-hidden p-4 flex flex-col justify-between" style={{ background: form.color, minHeight: '100px' }}>
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-25"
                                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent)', filter: 'blur(16px)' }} />
                            </div>
                            <div className="relative z-10 flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-white/50 text-[10px] uppercase tracking-wider">{form.amc || 'AMC / Platform'}</p>
                                    <p className="text-white font-bold text-sm">{form.fund_name || 'Fund Name'}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                                    style={{ background: `${FUND_TYPE_COLORS[form.fund_type]}30`, color: FUND_TYPE_COLORS[form.fund_type] }}>
                                    {form.fund_type}
                                </span>
                            </div>
                            <p className="relative z-10 text-white font-bold text-base">{form.monthly_amount ? fmt(Number(form.monthly_amount)) : '₹0'}<span className="text-white/50 text-xs font-normal ml-1">/mo</span></p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes <span className="text-slate-600">(optional)</span></label>
                        <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
                            placeholder="e.g. Long-term wealth creation goal..." rows={2}
                            value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/8 flex gap-3 flex-shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 4px 15px rgba(34,197,94,0.35)' }}>
                        {saving ? 'Saving...' : (<><Check className="w-4 h-4" /> {editSip ? 'Save Changes' : 'Add SIP'}</>)}
                    </button>
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}
