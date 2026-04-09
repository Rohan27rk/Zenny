// PDF Bank Statement Parser
// Uses pdfjs-dist to extract text, then applies regex patterns
// to detect common Indian bank statement formats (HDFC, SBI, ICICI, Axis, Kotak)

import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker to avoid CDN fetch issues in production
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export interface ParsedTransaction {
    date: string;       // ISO yyyy-mm-dd
    title: string;
    amount: number;
    type: 'income' | 'expense';
    notes: string;
}

// Date patterns: dd/mm/yyyy, dd-mm-yyyy, dd Mon yyyy
const DATE_PATTERNS = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
];

const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDate(raw: string): string | null {
    // dd/mm/yyyy or dd-mm-yyyy
    const m1 = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;

    // dd Mon yyyy
    const m2 = raw.match(/(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (m2) return `${m2[3]}-${MONTHS[m2[2].toLowerCase()]}-${m2[1]}`;

    return null;
}

function parseAmount(raw: string): number {
    return parseFloat(raw.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
}

// Keywords that indicate a credit (income) transaction
const CREDIT_KEYWORDS = ['credit', 'cr', 'salary', 'refund', 'cashback', 'interest', 'deposit', 'received', 'inward', 'neft cr', 'imps cr'];
const DEBIT_KEYWORDS = ['debit', 'dr', 'purchase', 'payment', 'withdrawal', 'atm', 'emi', 'bill', 'outward', 'neft dr', 'imps dr'];

function guessType(line: string): 'income' | 'expense' {
    const lower = line.toLowerCase();
    if (CREDIT_KEYWORDS.some(k => lower.includes(k))) return 'income';
    if (DEBIT_KEYWORDS.some(k => lower.includes(k))) return 'expense';
    return 'expense'; // default to expense when ambiguous
}

/**
 * Extract all text from a PDF file using pdfjs-dist.
 */
async function extractTextFromPDF(file: File, password?: string): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, ...(password ? { password } : {}) });
    const pdf = await loadingTask.promise;
    const lines: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
        lines.push(...pageText.split('\n').map(l => l.trim()).filter(Boolean));
    }

    return lines;
}

/**
 * Main parser — tries to find rows that look like transactions.
 * Works best with HDFC, SBI, ICICI, Axis, Kotak statement PDFs.
 */
export async function parseBankStatementPDF(file: File, password?: string): Promise<ParsedTransaction[]> {
    const lines = await extractTextFromPDF(file, password);
    const fullText = lines.join('\n');

    const transactions: ParsedTransaction[] = [];

    // Strategy: scan each line for a date pattern + amount pattern
    // Amount pattern: one or more numbers with commas/decimals
    const amountPattern = /[\d,]+\.\d{2}/g;

    for (const line of lines) {
        // Must contain a date
        let dateStr: string | null = null;
        for (const dp of DATE_PATTERNS) {
            const m = line.match(dp);
            if (m) { dateStr = parseDate(m[0]); break; }
        }
        if (!dateStr) continue;

        // Must contain at least one amount
        const amounts = line.match(amountPattern);
        if (!amounts || amounts.length === 0) continue;

        // Use the first amount found as the transaction amount
        const amount = parseAmount(amounts[0]);
        if (amount <= 0) continue;

        // Title: strip the date and amounts from the line, use what's left
        let title = line
            .replace(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g, '')
            .replace(/(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi, '')
            .replace(amountPattern, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!title || title.length < 3) title = 'Bank Transaction';

        const type = guessType(line);

        transactions.push({
            date: dateStr,
            title: title.slice(0, 80), // cap length
            amount,
            type,
            notes: `Imported from PDF`,
        });
    }

    return transactions;
}
