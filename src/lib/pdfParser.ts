// Universal Indian Bank Statement PDF Parser
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export interface ParsedTransaction {
    date: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    notes: string;
}

const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseAmount(raw: string): number {
    const n = parseFloat(raw.replace(/,/g, '').replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
}

function guessType(text: string): 'income' | 'expense' {
    const l = text.toLowerCase();
    const inc = ['upi in', 'upi in/', 'credit', ' cr ', 'salary', 'refund', 'cashback',
        'interest', 'deposit', 'received', 'inward', 'neft cr', 'imps cr', 'rtgs cr',
        'reversal', 'reward', 'dividend', 'bonus', 'reimburs', 'money in'];
    const exp = ['upiout', 'upi out', 'debit', ' dr ', 'purchase', 'payment',
        'withdrawal', 'atm', 'emi', 'bill', 'outward', 'neft dr', 'imps dr', 'rtgs dr',
        'charge', 'fee', 'transfer out'];
    for (const s of inc) if (l.includes(s)) return 'income';
    for (const s of exp) if (l.includes(s)) return 'expense';
    return 'expense';
}

function cleanTitle(raw: string): string {
    return raw
        .replace(/UPIOUT\/\d+\//gi, '')
        .replace(/UPI IN\/\d+\//gi, '')
        .replace(/NEFT\/\S+\//gi, '')
        .replace(/IMPS\/\d+\//gi, '')
        .replace(/NFT\//gi, '')
        .replace(/\/\d{4}$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 80) || 'Bank Transaction';
}

function extractYear(text: string): number {
    const m = text.match(/\b(20\d{2})\b/g);
    if (!m) return new Date().getFullYear();
    const freq: Record<string, number> = {};
    for (const x of m) freq[x] = (freq[x] || 0) + 1;
    return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

function parseAnyDate(raw: string, y: number): string | null {
    // dd/mm/yyyy
    let m = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    // yyyy-mm-dd
    m = raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    // dd Mon yyyy
    m = raw.match(/(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\-](\d{4})/i);
    if (m) return `${m[3]}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
    // dd Mon (no year)
    m = raw.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    if (m) return `${y}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`;
    return null;
}

// ── Extract text items with full position info ────────────────────────────────
interface TextItem { x: number; y: number; str: string; }

async function extractItems(file: File, password?: string): Promise<TextItem[]> {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf, ...(password ? { password } : {}) }).promise;
    const items: TextItem[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        for (const item of content.items as any[]) {
            if (item.str.trim()) {
                items.push({ x: Math.round(item.transform[4]), y: Math.round(item.transform[5]), str: item.str.trim() });
            }
        }
    }
    return items;
}

// Group items into logical rows by Y coordinate (within 3px tolerance)
function groupIntoRows(items: TextItem[]): string[] {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: { y: number; parts: string[] }[] = [];
    for (const item of sorted) {
        const last = rows[rows.length - 1];
        if (last && Math.abs(last.y - item.y) <= 3) {
            last.parts.push(item.str);
        } else {
            rows.push({ y: item.y, parts: [item.str] });
        }
    }
    return rows.map(r => r.parts.join(' ').trim()).filter(Boolean);
}

// ── Main parsing logic ────────────────────────────────────────────────────────
function parseAllStrategies(lines: string[], year: number): ParsedTransaction[] {
    const amountRe = /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g;
    const results: ParsedTransaction[] = [];

    // Strategy: sliding window — for each line that has an amount,
    // look back up to 4 lines for a date, combine for title
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Find amounts in this line
        const amounts = [...line.matchAll(new RegExp(amountRe.source, 'g'))]
            .map(m => parseAmount(m[0]))
            .filter(n => n > 0 && n < 10_000_000);

        if (amounts.length === 0) continue;

        // Look for date in this line or nearby lines (up to 4 back, 1 forward)
        let dateStr: string | null = null;
        let dateLineIdx = -1;
        for (let d = i; d >= Math.max(0, i - 4); d--) {
            dateStr = parseAnyDate(lines[d], year);
            if (dateStr) { dateLineIdx = d; break; }
        }
        if (!dateStr) {
            // try forward
            if (i + 1 < lines.length) dateStr = parseAnyDate(lines[i + 1], year);
        }
        if (!dateStr) continue;

        // Build title from lines between date line and current line
        const titleParts: string[] = [];
        const start = dateLineIdx >= 0 ? dateLineIdx : i;
        for (let t = start; t <= i; t++) {
            const part = lines[t]
                .replace(new RegExp(amountRe.source, 'g'), '')
                .replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g, '')
                .replace(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\s+\d{4})?/gi, '')
                .trim();
            if (part) titleParts.push(part);
        }

        const fullContext = lines.slice(Math.max(0, i - 4), i + 2).join(' ');
        const amount = amounts[0]; // first amount = transaction amount
        const title = cleanTitle(titleParts.join(' '));

        results.push({
            date: dateStr,
            title,
            amount,
            type: guessType(fullContext),
            notes: 'Imported from PDF',
        });
    }

    return results;
}

function dedupe(txns: ParsedTransaction[]): ParsedTransaction[] {
    const seen = new Set<string>();
    return txns.filter(t => {
        const key = `${t.date}|${t.amount}|${t.title.slice(0, 15)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ── Main Export ───────────────────────────────────────────────────────────────
export async function parseBankStatementPDF(file: File, password?: string): Promise<ParsedTransaction[]> {
    const items = await extractItems(file, password);
    const lines = groupIntoRows(items);
    const year = extractYear(lines.join(' '));
    const results = parseAllStrategies(lines, year);
    return dedupe(results);
}
