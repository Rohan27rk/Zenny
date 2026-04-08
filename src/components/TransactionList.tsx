import { TransactionWithCategory } from '../lib/database.types';
import { Trash2, Calendar, Receipt } from 'lucide-react';

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
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Receipt className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-300 font-semibold text-lg">No transactions yet</p>
        <p className="text-slate-500 text-sm mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
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
                  <Calendar className="w-3 h-3" />
                  {formatDate(t.date)}
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
              onClick={() => { if (confirm('Delete this transaction?')) onDelete(t.id); }}
              className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 transition-all duration-200 hover:bg-red-500/10"
              aria-label="Delete transaction">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
