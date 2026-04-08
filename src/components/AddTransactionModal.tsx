import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Category, PaymentMethod, CreditCard } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { X, TrendingDown, TrendingUp, Plus, CreditCard as CreditCardIcon, AlertTriangle, ExternalLink } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  onGoToCards?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'upi', label: 'UPI', emoji: '📱' },
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'debit_card', label: 'Debit Card', emoji: '💳' },
  { value: 'credit_card', label: 'Credit Card', emoji: '🏦' },
  { value: 'net_banking', label: 'Net Banking', emoji: '🌐' },
  { value: 'wallet', label: 'Wallet', emoji: '👛' },
  { value: 'cheque', label: 'Cheque', emoji: '📝' },
  { value: 'other', label: 'Other', emoji: '💰' },
];

export function AddTransactionModal({ isOpen, onClose, categories, onSuccess, onGoToCards }: AddTransactionModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '', amount: '', type: 'expense' as 'income' | 'expense',
    categoryId: '', date: new Date().toISOString().split('T')[0],
    notes: '', payment_method: 'upi' as PaymentMethod,
    credit_card_id: '',
  });
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredCategories = categories.filter(c => c.type === formData.type);
  const isCreditCard = formData.payment_method === 'credit_card';
  const selectedCard = creditCards.find(c => c.id === formData.credit_card_id);
  const wouldExceedLimit = selectedCard && formData.amount
    ? (selectedCard.current_balance + Number(formData.amount)) > selectedCard.credit_limit && selectedCard.credit_limit > 0
    : false;
  const newUsagePct = selectedCard && formData.amount && selectedCard.credit_limit > 0
    ? Math.min(100, ((selectedCard.current_balance + Number(formData.amount)) / selectedCard.credit_limit) * 100)
    : 0;

  useEffect(() => {
    if (isOpen && user) fetchCards();
  }, [isOpen, user]);

  const fetchCards = async () => {
    const { data } = await supabase.from('credit_cards').select('*').eq('is_active', true).order('card_name');
    setCreditCards((data as CreditCard[]) ?? []);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.title || !formData.amount || !formData.categoryId) {
      setError('Please fill in all required fields'); return;
    }
    if (Number(formData.amount) <= 0) { setError('Amount must be greater than 0'); return; }
    if (isCreditCard && !formData.credit_card_id) { setError('Please select a credit card'); return; }

    setLoading(true);

    // Insert transaction
    const { error: txnError } = await supabase.from('transactions').insert({
      user_id: user!.id,
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category_id: formData.categoryId,
      date: formData.date,
      notes: formData.notes || null,
      payment_method: formData.payment_method,
      credit_card_id: isCreditCard ? formData.credit_card_id : null,
    });

    if (txnError) { setError(txnError.message || 'Failed to add transaction'); setLoading(false); return; }

    // If paid by credit card, update card balance
    if (isCreditCard && formData.credit_card_id && formData.type === 'expense') {
      const card = creditCards.find(c => c.id === formData.credit_card_id);
      if (card) {
        await supabase.from('credit_cards').update({
          current_balance: card.current_balance + Number(formData.amount),
          updated_at: new Date().toISOString(),
        }).eq('id', card.id);
      }
    }

    reset(); setLoading(false); onSuccess();
  };

  const reset = () => {
    setFormData({ title: '', amount: '', type: 'expense', categoryId: '', date: new Date().toISOString().split('T')[0], notes: '', payment_method: 'upi', credit_card_id: '' });
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border text-sm";
  const inputStyle = { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(59,130,246,0.6)';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(59,130,246,0.15)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg, #1e1e30, #16162a)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)', animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <h3 className="text-lg font-bold gradient-text">Add Transaction</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Type toggle */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t, categoryId: '' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={formData.type === t
                    ? { background: t === 'expense' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white', boxShadow: t === 'expense' ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(34,197,94,0.3)' }
                    : { color: 'rgba(255,255,255,0.4)' }}>
                  {t === 'expense' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
                <input className={inputCls} style={inputStyle} placeholder="e.g. Groceries, Salary" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount *</label>
                <input type="number" className={inputCls} style={inputStyle} placeholder="0.00" step="0.01" min="0" value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Date *</label>
                <input type="date" className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category *</label>
                <select className={inputCls} style={{ ...inputStyle, appearance: 'none' }} value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })} onFocus={onFocus} onBlur={onBlur} required>
                  <option value="" style={{ background: '#1e1e30' }}>Select category</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#1e1e30' }}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method *</label>
                <select className={inputCls} style={{ ...inputStyle, appearance: 'none' }} value={formData.payment_method}
                  onChange={e => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod, credit_card_id: '' })}
                  onFocus={onFocus} onBlur={onBlur}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value} style={{ background: '#1e1e30' }}>{m.emoji} {m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credit card picker — shown only when credit_card is selected */}
            {isCreditCard && (
              <div className="rounded-2xl border border-purple-500/20 p-4" style={{ background: 'rgba(139,92,246,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCardIcon className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-semibold text-purple-300">Select Credit Card</p>
                </div>

                {creditCards.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-slate-400 text-sm mb-2">No credit cards added yet</p>
                    <button type="button" onClick={() => { handleClose(); onGoToCards?.(); }}
                      className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Add a Credit Card first
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {creditCards.map(card => {
                      const usagePct = card.credit_limit > 0 ? Math.min(100, (card.current_balance / card.credit_limit) * 100) : 0;
                      const isSelected = formData.credit_card_id === card.id;
                      return (
                        <button key={card.id} type="button"
                          onClick={() => setFormData({ ...formData, credit_card_id: card.id })}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left"
                          style={{
                            background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.2)',
                            borderColor: isSelected ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)',
                            boxShadow: isSelected ? '0 0 0 1px rgba(139,92,246,0.3)' : 'none',
                          }}>
                          {/* Mini card visual */}
                          <div className="w-12 h-8 rounded-lg flex-shrink-0 flex items-end p-1.5"
                            style={{ background: card.color }}>
                            <p className="text-white/70 text-[8px] font-mono">••{card.last_four}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{card.card_name}</p>
                            <p className="text-xs text-slate-500">{card.bank_name} · ₹{card.current_balance.toLocaleString('en-IN')} used</p>
                          </div>
                          {card.credit_limit > 0 && (
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs font-semibold" style={{ color: usagePct > 80 ? '#ef4444' : usagePct > 50 ? '#f59e0b' : '#22c55e' }}>
                                {usagePct.toFixed(0)}%
                              </p>
                              <p className="text-xs text-slate-600">used</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Warning if would exceed limit */}
                {wouldExceedLimit && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-300 border border-amber-500/30"
                    style={{ background: 'rgba(245,158,11,0.08)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    This transaction will exceed your credit limit!
                  </div>
                )}

                {/* New usage preview */}
                {selectedCard && formData.amount && selectedCard.credit_limit > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Balance after this transaction</span>
                      <span style={{ color: wouldExceedLimit ? '#ef4444' : '#94a3b8' }}>
                        ₹{(selectedCard.current_balance + Number(formData.amount)).toLocaleString('en-IN')} / ₹{selectedCard.credit_limit.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${newUsagePct}%`, background: newUsagePct > 80 ? '#ef4444' : newUsagePct > 50 ? '#f59e0b' : '#22c55e' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
              <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
                placeholder="Optional notes..." rows={2} value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-200">
                Cancel
              </button>
              <button type="submit" disabled={loading || (isCreditCard && creditCards.length === 0)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                {loading ? 'Adding...' : (<><Plus className="w-4 h-4" /> Add Transaction</>)}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}
