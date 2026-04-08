import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import {
    CreditCard as CreditCardIcon, Plus, Trash2, X, AlertTriangle,
    Calendar, Edit2, Check, Wallet, TrendingDown,
} from 'lucide-react';

const CARD_COLORS = [
    'linear-gradient(135deg, #0f3460 0%, #533483 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
    'linear-gradient(135deg, #1a0533 0%, #4a0e8f 100%)',
    'linear-gradient(135deg, #1b4332 0%, #081c15 100%)',
];

const CARD_TYPES = ['visa', 'mastercard', 'rupay', 'amex', 'other'] as const;

const emptyForm = {
    card_name: '', bank_name: '', last_four: '',
    card_type: 'visa' as CreditCard['card_type'],
    credit_limit: '', current_balance: '',
    billing_date: '1', due_date: '15',
    color: CARD_COLORS[0],
};

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function ordinal(n: number) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CreditCards() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCard, setEditCard] = useState<CreditCard | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => { if (user) fetchCards(); }, [user]);

    const fetchCards = async () => {
        setLoading(true);
        const { data } = await supabase.from('credit_cards').select('*').order('created_at', { ascending: false });
        setCards((data as CreditCard[]) ?? []);
        setLoading(false);
    };

    const openAdd = () => { setEditCard(null); setForm({ ...emptyForm }); setFormError(''); setShowModal(true); };
    const openEdit = (card: CreditCard) => {
        setEditCard(card);
        setForm({
            card_name: card.card_name, bank_name: card.bank_name, last_four: card.last_four,
            card_type: card.card_type, credit_limit: String(card.credit_limit),
            current_balance: String(card.current_balance),
            billing_date: String(card.billing_date), due_date: String(card.due_date),
            color: card.color,
        });
        setFormError(''); setShowModal(true);
    };

    const handleSave = async () => {
        setFormError('');
        if (!form.card_name.trim() || !form.bank_name.trim() || !form.last_four.trim()) {
            setFormError('Card name, bank name and last 4 digits are required'); return;
        }
        if (!/^\d{4}$/.test(form.last_four)) { setFormError('Last 4 digits must be exactly 4 numbers'); return; }
        setSaving(true);
        const payload = {
            card_name: form.card_name.trim(), bank_name: form.bank_name.trim(), last_four: form.last_four,
            card_type: form.card_type, credit_limit: Number(form.credit_limit) || 0,
            current_balance: Number(form.current_balance) || 0,
            billing_date: Number(form.billing_date) || 1, due_date: Number(form.due_date) || 15,
            color: form.color, is_active: true, updated_at: new Date().toISOString(),
        };
        const { error: e } = editCard
            ? await (supabase.from('credit_cards') as any).update(payload).eq('id', editCard.id)
            : await (supabase.from('credit_cards') as any).insert({ ...payload, user_id: user!.id });
        if (e) { setFormError(e.message); setSaving(false); return; }
        setSaving(false); setShowModal(false); fetchCards();
    };

    const handleDelete = async (id: string) => {
        await supabase.from('credit_cards').delete().eq('id', id);
        setDeleteId(null); fetchCards();
    };

    const totalLimit = cards.reduce((s, c) => s + c.credit_limit, 0);
    const totalUsed = cards.reduce((s, c) => s + c.current_balance, 0);
    const totalAvailable = Math.max(0, totalLimit - totalUsed);
    const overallPct = totalLimit > 0 ? Math.min(100, (totalUsed / totalLimit) * 100) : 0;

    return (
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Credit Cards</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {cards.length} card{cards.length !== 1 ? 's' : ''} · manage balances & due dates
                    </p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
                    <Plus className="w-4 h-4" /> Add Card
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <p className="text-slate-500 text-sm animate-pulse">Loading cards...</p>
                </div>
            ) : cards.length === 0 ? (
                <EmptyState onAdd={openAdd} />
            ) : (
                <>
                    {/* Summary bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard label="Total Credit Limit" value={fmt(totalLimit)}
                            icon={<Wallet className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)" glow="rgba(59,130,246,0.3)" />
                        <SummaryCard label="Total Outstanding" value={fmt(totalUsed)}
                            icon={<TrendingDown className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #ef4444, #b91c1c)" glow="rgba(239,68,68,0.25)"
                            sub={`${overallPct.toFixed(0)}% utilisation`}
                            subColor={overallPct > 80 ? '#ef4444' : overallPct > 50 ? '#f59e0b' : '#22c55e'} />
                        <SummaryCard label="Total Available" value={fmt(totalAvailable)}
                            icon={<CreditCardIcon className="w-5 h-5" />}
                            iconBg="linear-gradient(135deg, #22c55e, #15803d)" glow="rgba(34,197,94,0.25)" />
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {cards.map(card => (
                            <CardTile key={card.id} card={card} onEdit={openEdit} onDelete={id => setDeleteId(id)} />
                        ))}
                    </div>
                </>
            )}

            {showModal && (
                <CardModal form={form} setForm={setForm} editCard={editCard}
                    error={formError} saving={saving} onSave={handleSave} onClose={() => setShowModal(false)} />
            )}

            {/* Delete confirm — proper small centered dialog */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '1rem' }}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setDeleteId(null)} />
                    <div className="relative z-10 w-80 rounded-2xl border border-white/10 p-6 text-center"
                        style={{
                            background: 'linear-gradient(145deg, #1e1e32, #14141f)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                        }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-white font-bold text-base mb-1">Delete this card?</p>
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

// ─── Card Tile ────────────────────────────────────────────────────────────────
function CardTile({ card, onEdit, onDelete }: {
    card: CreditCard; onEdit: (c: CreditCard) => void; onDelete: (id: string) => void;
}) {
    const usagePct = card.credit_limit > 0 ? Math.min(100, (card.current_balance / card.credit_limit) * 100) : 0;
    const available = card.credit_limit > 0 ? Math.max(0, card.credit_limit - card.current_balance) : null;
    const barColor = usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#22c55e';

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{ background: '#0f0f1a', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>

            {/* Card face — inset with padding so it floats inside the container */}
            <div className="p-3 pt-4 pb-0">
                <div className="relative rounded-xl overflow-hidden flex flex-col justify-between p-4"
                    style={{ background: card.color, minHeight: '140px' }}>
                    {/* Shine overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-30"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7), transparent)', filter: 'blur(20px)' }} />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,1), transparent)', filter: 'blur(16px)' }} />
                    </div>
                    {/* Top row */}
                    <div className="relative z-10 flex items-start justify-between mb-6">
                        <div>
                            <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">{card.bank_name}</p>
                            <p className="text-white font-bold text-sm mt-0.5">{card.card_name}</p>
                        </div>
                        <span className="text-white/75 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>
                            {card.card_type}
                        </span>
                    </div>
                    {/* Bottom row */}
                    <div className="relative z-10 flex items-end justify-between">
                        <p className="text-white/85 font-mono text-sm tracking-[0.18em]">•••• •••• •••• {card.last_four}</p>
                        <CreditCardIcon className="w-5 h-5 text-white/35" />
                    </div>
                </div>
            </div>

            {/* Info section */}
            <div className="p-3 flex flex-col gap-2.5 flex-1">

                {/* Usage */}
                {card.credit_limit > 0 ? (
                    <div className="rounded-xl p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-400">Balance used</span>
                            <span className="text-xs font-bold" style={{ color: barColor }}>{usagePct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${usagePct}%`, background: barColor }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Used <span className="text-slate-300">{fmt(card.current_balance)}</span></span>
                            <span>Limit <span className="text-slate-300">{fmt(card.credit_limit)}</span></span>
                        </div>
                        {available !== null && (
                            <p className="text-xs mt-1 font-medium" style={{ color: '#22c55e' }}>✓ {fmt(available)} available</p>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl p-3 border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-xs text-slate-500">Outstanding</p>
                        <p className="text-sm font-bold text-white mt-0.5">{fmt(card.current_balance)}</p>
                    </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 border border-white/5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                            <Calendar className="w-3 h-3 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Billing</p>
                            <p className="text-xs font-bold text-white">{card.billing_date}<sup className="text-[8px]">{ordinal(card.billing_date)}</sup></p>
                        </div>
                    </div>
                    <div className="rounded-xl p-2.5 border border-white/5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wide">Due</p>
                            <p className="text-xs font-bold text-white">{card.due_date}<sup className="text-[8px]">{ordinal(card.due_date)}</sup></p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-0.5">
                    <button onClick={() => onEdit(card)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/8 hover:bg-white/5 hover:text-white transition-all">
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => onDelete(card.id)}
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
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <CreditCardIcon className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-white font-bold text-base mb-1">No credit cards yet</p>
            <p className="text-slate-500 text-sm mb-5 max-w-xs">Add your cards to track balances, utilisation and upcoming due dates.</p>
            <button onClick={onAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
                <Plus className="w-4 h-4" /> Add Your First Card
            </button>
        </div>
    );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
interface ModalProps {
    form: typeof emptyForm; setForm: (f: typeof emptyForm) => void;
    editCard: CreditCard | null; error: string; saving: boolean;
    onSave: () => void; onClose: () => void;
}

function CardModal({ form, setForm, editCard, error, saving, onSave, onClose }: ModalProps) {
    const set = (k: keyof typeof emptyForm, v: string) => setForm({ ...form, [k]: v });

    const inputCls = "w-full px-3 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border text-sm";
    const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' };
    const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(139,92,246,0.6)';
        e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
    };
    const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] flex flex-col"
                style={{ background: 'linear-gradient(135deg, #1e1e30, #16162a)', boxShadow: '0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)', animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>

                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 10px rgba(139,92,246,0.4)' }}>
                            <CreditCardIcon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-white">{editCard ? 'Edit Card' : 'Add Credit Card'}</h3>
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

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Card Details</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Card Name *</label>
                                <input className={inputCls} style={inputStyle} placeholder="e.g. HDFC Regalia" value={form.card_name}
                                    onChange={e => set('card_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Bank Name *</label>
                                    <input className={inputCls} style={inputStyle} placeholder="e.g. HDFC Bank" value={form.bank_name}
                                        onChange={e => set('bank_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Last 4 Digits *</label>
                                    <input className={inputCls} style={inputStyle} placeholder="1234" maxLength={4} value={form.last_four}
                                        onChange={e => set('last_four', e.target.value.replace(/\D/g, ''))} onFocus={onFocus} onBlur={onBlur} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Card Network</label>
                                <div className="flex gap-2 flex-wrap">
                                    {CARD_TYPES.map(t => (
                                        <button key={t} type="button" onClick={() => set('card_type', t)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border"
                                            style={form.card_type === t
                                                ? { background: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.5)', color: '#c4b5fd' }
                                                : { background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Financials</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Credit Limit (₹)</label>
                                <input type="number" className={inputCls} style={inputStyle} placeholder="0" min="0" value={form.credit_limit}
                                    onChange={e => set('credit_limit', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Balance (₹)</label>
                                <input type="number" className={inputCls} style={inputStyle} placeholder="0" min="0" value={form.current_balance}
                                    onChange={e => set('current_balance', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Billing Date</label>
                                <input type="number" className={inputCls} style={inputStyle} placeholder="1–31" min="1" max="31" value={form.billing_date}
                                    onChange={e => set('billing_date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Due Date</label>
                                <input type="number" className={inputCls} style={inputStyle} placeholder="1–31" min="1" max="31" value={form.due_date}
                                    onChange={e => set('due_date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Card Colour</p>
                        <div className="flex gap-2 flex-wrap mb-4">
                            {CARD_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => set('color', c)}
                                    className="w-9 h-9 rounded-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                    style={{ background: c, outline: form.color === c ? '2px solid rgba(139,92,246,0.8)' : '2px solid transparent', outlineOffset: '2px' }}>
                                    {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                                </button>
                            ))}
                        </div>
                        <div className="relative rounded-xl overflow-hidden p-4 flex flex-col justify-between" style={{ background: form.color, minHeight: '100px' }}>
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-25"
                                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent)', filter: 'blur(16px)' }} />
                            </div>
                            <div className="relative z-10 flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-white/50 text-[10px] uppercase tracking-wider">{form.bank_name || 'Bank Name'}</p>
                                    <p className="text-white font-bold text-sm">{form.card_name || 'Card Name'}</p>
                                </div>
                                <span className="text-white/70 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                                    style={{ background: 'rgba(255,255,255,0.18)' }}>{form.card_type}</span>
                            </div>
                            <p className="relative z-10 text-white/85 font-mono text-sm tracking-[0.18em]">•••• •••• •••• {form.last_four || '0000'}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/8 flex gap-3 flex-shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 15px rgba(139,92,246,0.4)' }}>
                        {saving ? 'Saving...' : (<><Check className="w-4 h-4" /> {editCard ? 'Save Changes' : 'Add Card'}</>)}
                    </button>
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}
