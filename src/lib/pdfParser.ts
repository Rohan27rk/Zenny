// Universal Indian Bank Statement PDF Parser
// Supports: Axis, HDFC, SBI, ICICI, Kotak, Yes Bank, IndusInd, PNB, BOB, Canara, and any generic format

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

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

const INCOME_SIGNALS = [
    'upi in', 'upi in/', 'credit', ' cr ', '/cr/', 'cr.', 'salary', 'sal ',
    'refund', 'cashback', 'interest', 'deposit', 'received', 'inward',
    'neft cr', 'imps cr', 'rtgs cr', 'reversal', 'reward', 'dividend',
    'bonus', 'reimburs', 'transfer in', 'money in', 'receipt',
];

const EXPENSE_SIGNALS = [
    'upiout', 'upi out', 'debit', ' dr ', '/dr/', 'dr.', 'purchase',
    'payment', 'withdrawal', 'atm', 'emi', 'bill', 'outward',
    'neft dr', 'imps dr', 'rtgs dr', 'charge', 'fee', 'tax',
    'transfer out', 'spent', 'paid',
];

// Noise lines to skip
const SKIP_PATTERNS = [
    /opening balance/i, /closing balance/i, /^balance$/i,
    /page \d+ of \d+/i, /contact us/i, /account no/i, /account holder/i,
    /statement period/i, /^date$/i, /^narration$/i, /^particulars$/i,
    /^description$/i, /^amount$/i, /^debit$/i, /^credit$/i, /^balance$/i,
    /^transaction$/i, /^details$/i, /day\/night/i, /5am.*6pm/i,
    /^\s*$/, /^-+$/, /^\*+$/,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
    const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function guessType(text: string): 'income' | 'expense' {
    const l = text.toLowerCase();
    for (const s of INCOME_SIGNALS) if (l.includes(s)) return 'income';
    for (const s of EXPENSE_SIGNALS) if (l.includes(s)) return 'expense';
    return 'expense';
}

function shouldSkip(line: string): boolean {
    return SKIP_PATTERNS.some(p => p.test(line.trim()));
}

// Parse any date format and return ISO yyyy-mm-dd or null
function parseDate(raw: string, fallbackYear?: number): string | null {
    const y = fallbackYear ?? new Date().getFullYear();

    // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
    const m1 = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;

    // yyyy-mm-dd (ISO)
    const m2 = raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;

    // dd Mon yyyy  or  dd-Mon-yyyy
    const m3 = raw.match(/(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\-](\d{4})/i);
    if (m3) return `${m3[3]}-${MONTHS[m3[2].toLowerCase()]}-${m3[1].padStart(2, '0')}`;

    // dd Mon (no year) — use fallback year
    const m4 = raw.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i);
    if (m4) return `${y}-${MONTHS[m4[2].toLowerCase()]}-${m4[1].padStart(2, '0')}`;

    // dd-Mon (no year)
    const m5 = raw.match(/^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i);
    if (m5) return `${y}-${MONTHS[m5[2].toLowerCase()]}-${m5[1].padStart(2, '0')}`;

    return null;
}

// Find the most likely year from statement text
function extractYear(text: string): number {
    const matches = text.match(/\b(20\d{2})\b/g);
    if (!matches) return new Date().getFullYear();
    const freq: Record<string, number> = {};
    for (const m of matches) freq[m] = (freq[m] || 0) + 1;
    return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

// Clean up a transaction title
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

// ── PDF Text Extraction ───────────────────────────────────────────────────────

async function extractLines(file: File, password?: string): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        ...(password ? { password } : {}),
    }).promise;

    const allLines: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();

        // Group text items by Y coordinate to reconstruct rows
        const byY: Record<number, { x: number; str: string }[]> = {};
        for (const item of content.items as any[]) {
            const y = Math.round(item.transform[5]);
            const x = Math.round(item.transform[4]);
            if (!byY[y]) byY[y] = [];
            if (item.str.trim()) byY[y].push({ x, str: item.str });
        }

        // Sort rows top-to-bottom, items left-to-right
        const ys = Object.keys(byY).map(Number).sort((a, b) => b - a);
        for (const y of ys) {
            const row = byY[y].sort((a, b) => a.x - b.x).map(i => i.str).join(' ');
            if (row.trim()) allLines.push(row.trim());
        }
    }

    return allLines;
}

// ── Core Parsing Strategies ───────────────────────────────────────────────────

// Strategy A: Each line contains a date + description + amount(s)
function parseLineByLine(lines: string[], year: number): ParsedTransaction[] {
    const results: ParsedTransaction[] = [];
    const amountRe = /(?<![₹\d])(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+\.\d{2})(?!\d)/g;

    for (const line of lines) {
        if (shouldSkip(line)) continue;

        // Find date anywhere in the line
        let dateStr: string | null = null;
        const datePatterns = [
            /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
            /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
            /(\d{1,2})[\s\-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\-](\d{4})/i,
            /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?!\s+\d{4})/i,
        ];

        for (const dp of datePatterns) {
            const m = line.match(dp);
            if (m) { dateStr = parseDate(m[0], year); break; }
        }
        if (!dateStr) continue;

        // Find all amounts in the line
        const amounts: number[] = [];
        let match;
        const re = new RegExp(amountRe.source, 'g');
        while ((match = re.exec(line)) !== null) {
            const n = parseAmount(match[0]);
            if (n > 0 && n < 10000000) amounts.push(n);
        }
        if (amounts.length === 0) continue;

        // Use first amount (transaction amount), last is usually running balance
        const amount = amounts[0];

        // Build title from non-date, non-amount parts
        let title = line;
        for (const dp of datePatterns) title = title.replace(dp, '');
        title = title.replace(new RegExp(amountRe.source, 'g'), '').replace(/\s+/g, ' ').trim();
        title = cleanTitle(title);

        results.push({
            date: dateStr,
            title,
            amount,
            type: guessType(line),
            notes: 'Imported from PDF',
        });
    }

    return results;
}

// Strategy B: Multi-line blocks — date on one line, description on next
function parseMultiLine(lines: string[], year: number): ParsedTransaction[] {
    const results: ParsedTransaction[] = [];
    const amountRe = /(\d{1,3}(?:,\d{3})*\.\d{2})/g;

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (shouldSkip(line)) { i++; continue; }

        // Check if this line is just a date
        const dateStr = parseDate(line.trim(), year);
        if (dateStr && line.trim().length <= 12) {
            // Look ahead for description + amount
            const block: string[] = [];
            let j = i + 1;
            while (j < lines.length && j < i + 5) {
                if (shouldSkip(lines[j])) break;
                block.push(lines[j].trim());
                j++;
            }
            const blockText = block.join(' ');
            const amounts = blockText.match(amountRe);
            if (amounts && amounts.length > 0) {
                const amount = parseAmount(amounts[0]);
                if (amount > 0) {
                    let title = blockText.replace(amountRe, '').replace(/\s+/g, ' ').trim();
                    title = cleanTitle(title);
                    results.push({ date: dateStr, title, amount, type: guessType(blockText), notes: 'Imported from PDF' });
                    i = j;
                    continue;
                }
            }
        }
        i++;
    }

    return results;
}

// Strategy C: Token-based — find all dates and amounts, pair them up
function parseTokenBased(lines: string[], year: number): ParsedTransaction[] {
    const results: ParsedTransaction[] = [];
    const fullText = lines.join('\n');

    // Find all date positions
    const dateRe = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})|(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi;
    const amountRe = /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g;

    let dm;
    const dateMatches: { index: number; date: string }[] = [];
    while ((dm = dateRe.exec(fullText)) !== null) {
        const d = parseDate(dm[0], year);
        if (d) dateMatches.push({ index: dm.index, date: d });
    }

    for (let i = 0; i < dateMatches.length; i++) {
        const start = dateMatches[i].index;
        const end = dateMatches[i + 1]?.index ?? Math.min(start + 300, fullText.length);
        const segment = fullText.slice(start, end);

        const amounts: number[] = [];
        let am;
        const are = new RegExp(amountRe.source, 'g');
        while ((am = are.exec(segment)) !== null) {
            const n = parseAmount(am[0]);
            if (n > 0 && n < 10000000) amounts.push(n);
        }
        if (amounts.length === 0) continue;

        const amount = amounts[0];
        let title = segment
            .replace(dateRe, '')
            .replace(new RegExp(amountRe.source, 'g'), '')
            .replace(/\s+/g, ' ')
            .trim();
        title = cleanTitle(title);
        if (!title || title.length < 2) continue;

        results.push({
            date: dateMatches[i].date,
            title,
            amount,
            type: guessType(segment),
            notes: 'Imported from PDF',
        });
    }

    return results;
}

// Deduplicate results
function dedupe(txns: ParsedTransaction[]): ParsedTransaction[] {
    const seen = new Set<string>();
    return txns.filter(t => {
        const key = `${t.date}|${t.amount}|${t.title.slice(0, 20)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function parseBankStatementPDF(file: File, password?: string): Promise<ParsedTransaction[]> {
    const lines = await extractLines(file, password);
    const year = extractYear(lines.join(' '));

    // Try all strategies, use the one with most results
    const stratA = parseLineByLine(lines, year);
    const stratB = parseMultiLine(lines, year);
    const stratC = parseTokenBased(lines, year);

    const best = [stratA, stratB, stratC].sort((a, b) => b.length - a.length)[0];
    return dedupe(best);
}
