import { useState } from 'react';
import { TransactionWithCategory } from '../lib/database.types';
import { Trash2, Calendar, Receipt, AlertTriangle } from 'lucide-react';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

const iconMap: Record<string, string> = {
  banknote: '💵', briefcase: '💼', 'trending-up': '📈', gift: '🎁',
  'plus-circle': '➕', utensils: '🍴', car: '🚗', 'shopping-bag': '🛍️',
  tv: '📺', 'heart-pulse': '❤️', receipt: '🧾', 'graduation-cap': '🎓',
  'minus-circle': '➖', circle: '⭕',
};

export function TransactionList({ transactions, onDelete, formatCurrency }: TransactionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));

  const confirmDelete = () => {
    if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null); }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Receipt className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-300 font-semibold text-lg">No transactions yet</p>
        <p className="text-slate-500 text-sm mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {transactions.map((t) => (
          <div key={t.id}
            className="group flex items-center justify-between p-4 rounded-xl border border-white/5 transition-all duration-200 hover:border-white/15 hover:translate-x-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}>

            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${t.categories.color}18`, boxShadow: `0 0 12px ${t.categories.color}30`, border: `1px solid ${t.categories.color}30` }}>
                {iconMap[t.categories.icon] ?? '💰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${t.categories.color}20`, color: t.categories.color }}>
                    {t.categories.name}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDate(t.date)}
                  </span>
                </div>
                {t.notes && <p className="text-xs text-slate-500 mt-1 truncate">{t.notes}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <p className={`text-base font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
              </p>
              <button
                onClick={() => setDeleteTarget(t)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 transition-all duration-200 hover:bg-red-500/10"
                aria-label="Delete transaction">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-80 rounded-2xl border border-white/10 p-6 text-center"
            style={{ background: 'linear-gradient(145deg, #1e1e32, #14141f)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-white font-bold text-base mb-1">Delete transaction?</p>
            <p className="text-slate-400 text-sm mb-1 truncate px-2">{deleteTarget.title}</p>
            <p className={`text-sm font-bold mb-5 ${deleteTarget.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {deleteTarget.type === 'income' ? '+' : '-'}{formatCurrency(Number(deleteTarget.amount))}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
