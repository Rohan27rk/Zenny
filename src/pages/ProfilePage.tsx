import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Briefcase, Target, Save, Check } from 'lucide-react';

const OCCUPATIONS = ['Salaried Employee', 'Self-Employed', 'Business Owner', 'Freelancer', 'Student', 'Homemaker', 'Retired', 'Other'];
const CURRENCIES = [{ code: 'INR', label: '₹ Indian Rupee' }, { code: 'USD', label: '$ US Dollar' }, { code: 'EUR', label: '€ Euro' }, { code: 'GBP', label: '£ British Pound' }];

export function ProfilePage() {
    const { user, profile, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        date_of_birth: profile?.date_of_birth ?? '',
        occupation: profile?.occupation ?? '',
        monthly_income: profile?.monthly_income?.toString() ?? '',
        savings_goal_pct: profile?.savings_goal_pct ?? 20,
        currency: profile?.currency ?? 'INR',
    });

    // Keep form in sync if profile reloads (e.g. after save)
    useEffect(() => {
        if (profile) {
            setForm({
                full_name: profile.full_name ?? '',
                phone: profile.phone ?? '',
                date_of_birth: profile.date_of_birth ?? '',
                occupation: profile.occupation ?? '',
                monthly_income: profile.monthly_income?.toString() ?? '',
                savings_goal_pct: profile.savings_goal_pct ?? 20,
                currency: profile.currency ?? 'INR',
            });
        }
    }, [profile]);

    const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.full_name.trim()) { setError('Name is required'); return; }
        setLoading(true);
        const { error } = await updateProfile({
            full_name: form.full_name.trim(),
            phone: form.phone || null,
            date_of_birth: form.date_of_birth || null,
            occupation: form.occupation || null,
            monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
            savings_goal_pct: form.savings_goal_pct,
            currency: form.currency,
        } as any);
        setLoading(false);
        if (error) { setError(error.message); return; }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const inputBase = "w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border text-sm";
    const inputStyle = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)' };
    const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(59,130,246,0.6)';
        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.25), 0 0 0 3px rgba(59,130,246,0.12)';
    };
    const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.25)';
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Profile & Settings</h2>
                <p className="text-slate-500 text-sm mt-0.5">Manage your personal and financial preferences</p>
            </div>

            {/* Avatar / identity card */}
            <div className="rounded-2xl border border-white/8 p-5 mb-5 flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                    {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-white">{profile?.full_name ?? 'Your Name'}</p>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Member since {new Date(profile?.created_at ?? Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/25"
                        style={{ background: 'rgba(239,68,68,0.08)' }}>
                        {error}
                    </div>
                )}

                {/* Personal info */}
                <div className="rounded-2xl border border-white/8 p-5 mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Personal Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1.5">Full Name *</label>
                            <input className={inputBase} style={inputStyle} placeholder="Enter your full name"
                                value={form.full_name} onChange={e => set('full_name', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Phone</label>
                            <input className={inputBase} style={inputStyle} placeholder="+91 9876543210" type="tel"
                                value={form.phone} onChange={e => set('phone', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Date of Birth</label>
                            <input type="date" className={inputBase} style={{ ...inputStyle, colorScheme: 'dark' }}
                                value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-sm text-slate-500"
                                style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <Mail className="w-3.5 h-3.5" />
                                {user?.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Occupation</label>
                            <select className={inputBase} style={{ ...inputStyle, appearance: 'none' }}
                                value={form.occupation} onChange={e => set('occupation', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur}>
                                <option value="" style={{ background: '#1e1e30' }}>Select</option>
                                {OCCUPATIONS.map(o => <option key={o} value={o} style={{ background: '#1e1e30' }}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Financial preferences */}
                <div className="rounded-2xl border border-white/8 p-5 mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Financial Preferences
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Monthly Income</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                                <input type="number" className={`${inputBase} pl-7`} style={inputStyle}
                                    placeholder="50000" min="0"
                                    value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)}
                                    onFocus={onFocus} onBlur={onBlur} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Currency</label>
                            <select className={inputBase} style={{ ...inputStyle, appearance: 'none' }}
                                value={form.currency} onChange={e => set('currency', e.target.value)}
                                onFocus={onFocus} onBlur={onBlur}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ background: '#1e1e30' }}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Savings goal */}
                <div className="rounded-2xl border border-white/8 p-5 mb-5"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Savings Goal
                    </p>
                    <label className="block text-xs text-slate-500 mb-2">
                        Monthly savings target — <span className="text-blue-400 font-bold">{form.savings_goal_pct}%</span>
                        {form.monthly_income && (
                            <span className="text-slate-600 ml-2">
                                = ₹{Math.round(Number(form.monthly_income) * form.savings_goal_pct / 100).toLocaleString('en-IN')}/mo
                            </span>
                        )}
                    </label>
                    <input type="range" min={5} max={80} step={5} value={form.savings_goal_pct}
                        onChange={e => set('savings_goal_pct', Number(e.target.value))}
                        className="w-full accent-blue-500" />
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>5%</span><span>Recommended: 20%</span><span>80%</span>
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    style={saved
                        ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 4px 15px rgba(34,197,94,0.35)' }
                        : { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.35)' }}>
                    {saved ? <><Check className="w-4 h-4" /> Saved!</> : loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </form>
        </div>
    );
}
