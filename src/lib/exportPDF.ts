// Export transactions as a PDF bank statement
import { TransactionWithCategory } from './database.types';

function formatCurrency(n: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function exportTransactionsPDF(
    transactions: TransactionWithCategory[],
    userName: string,
    currency = 'INR'
) {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const received = transactions.filter(t => t.type === 'received').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = income + received - expense;

    const typeLabel = (type: string) => {
        if (type === 'income') return 'Salary/Income';
        if (type === 'received') return 'Money Received';
        return 'Expense';
    };

    const typeColor = (type: string) => {
        if (type === 'income') return '#22c55e';
        if (type === 'received') return '#06b6d4';
        return '#ef4444';
    };

    const rows = transactions.map(t => `
    <tr style="border-bottom: 1px solid #1e1e30;">
      <td style="padding: 10px 12px; color: #94a3b8; font-size: 12px;">${formatDate(t.date)}</td>
      <td style="padding: 10px 12px; color: #e2e8f0; font-size: 13px; max-width: 200px;">${t.title}</td>
      <td style="padding: 10px 12px; color: #64748b; font-size: 11px;">${t.categories.name}</td>
      <td style="padding: 10px 12px; font-size: 11px; font-weight: 600;" >
        <span style="background: ${typeColor(t.type)}20; color: ${typeColor(t.type)}; padding: 2px 8px; border-radius: 20px;">
          ${typeLabel(t.type)}
        </span>
      </td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 700; font-size: 13px; color: ${typeColor(t.type)};">
        ${t.type === 'expense' ? '-' : '+'}${formatCurrency(Number(t.amount), currency)}
      </td>
    </tr>
  `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Zenny Statement — ${userName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a14; color: #e2e8f0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #1e1e30; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: white; }
    .logo-name { font-size: 22px; font-weight: 900; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .meta { text-align: right; }
    .meta p { color: #64748b; font-size: 12px; margin-bottom: 2px; }
    .meta strong { color: #e2e8f0; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: #1a1a2e; border: 1px solid #1e1e30; border-radius: 12px; padding: 16px; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .stat-value { font-size: 18px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: #0f0f1a; border-radius: 12px; overflow: hidden; border: 1px solid #1e1e30; }
    thead { background: #1a1a2e; }
    th { padding: 12px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    th:last-child { text-align: right; }
    tr:hover { background: #1a1a2e; }
    .footer { margin-top: 24px; text-align: center; color: #334155; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">Z</div>
      <div>
        <div class="logo-name">Zenny</div>
        <div style="color: #64748b; font-size: 11px;">Because adulting is expensive.</div>
      </div>
    </div>
    <div class="meta">
      <p>Account Holder: <strong>${userName}</strong></p>
      <p>Generated: <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
      <p>Total Transactions: <strong>${transactions.length}</strong></p>
    </div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">Net Balance</div>
      <div class="stat-value" style="color: ${netBalance >= 0 ? '#22c55e' : '#ef4444'}">${formatCurrency(netBalance, currency)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Salary / Income</div>
      <div class="stat-value" style="color: #22c55e">${formatCurrency(income, currency)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Money Received</div>
      <div class="stat-value" style="color: #06b6d4">${formatCurrency(received, currency)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Expenses</div>
      <div class="stat-value" style="color: #ef4444">${formatCurrency(expense, currency)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Category</th>
        <th>Type</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <p>Generated by Zenny · zenny-alpha.vercel.app · Crafted by Rohan Kanegaonkar</p>
    <p style="margin-top:4px">This is not an official bank statement. For personal tracking purposes only.</p>
  </div>
</body>
</html>`;

    // Open in new tab and trigger print
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
        win.print();
    };
}
