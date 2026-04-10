// AI-powered Bank Statement PDF Parser using Google Gemini
import * as pdfjsLib from 'pdfjs-dist';

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

// ── Extract raw text from PDF ─────────────────────────────────────────────────
async function extractText(file: File, password?: string): Promise<string> {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: buf,
        ...(password ? { password } : {}),
    }).promise;

    let text = '';
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        // Group by Y to reconstruct rows
        const byY: Record<number, { x: number; str: string }[]> = {};
        for (const item of content.items as any[]) {
            if (!item.str.trim()) continue;
            const y = Math.round(item.transform[5]);
            const x = Math.round(item.transform[4]);
            if (!byY[y]) byY[y] = [];
            byY[y].push({ x, str: item.str.trim() });
        }
        const ys = Object.keys(byY).map(Number).sort((a, b) => b - a);
        for (const y of ys) {
            const row = byY[y].sort((a, b) => a.x - b.x).map(i => i.str).join(' ');
            text += row + '\n';
        }
        text += '\n';
    }
    return text;
}

// ── Call Gemini API ───────────────────────────────────────────────────────────
async function parseWithGemini(rawText: string): Promise<ParsedTransaction[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCZt_BVHT6of3TCq4up3nr3FQJSjU9Oao8';
    if (!apiKey) throw new Error('Gemini API key not configured');

    const prompt = `You are a bank statement parser. Extract ALL transactions from the following bank statement text.

Return ONLY a valid JSON array with no markdown, no explanation, no code blocks. Just the raw JSON array.

Each transaction object must have exactly these fields:
- "date": string in format "YYYY-MM-DD"
- "title": string (clean description, remove UPI ref numbers like UPIOUT/123456/, keep the merchant/person name)
- "amount": number (positive value, no currency symbols)
- "type": "income" or "expense" (UPI IN / credit / salary = income, UPI OUT / debit / payment = expense)

Rules:
- Include EVERY transaction row, do not skip any
- For "DD Mon" dates without year, use the year found in the statement header
- Remove noise like opening balance, closing balance, page numbers
- If title is a UPI ID like "paytm.d10088933172@pty", use it as-is but clean up slashes

Bank statement text:
${rawText.slice(0, 15000)}`; // Gemini free tier has token limits

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error: ${res.status} — ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Gemini returned no valid JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) throw new Error('Gemini response is not an array');

    // Validate and clean each transaction
    return parsed
        .filter((t: any) => t.date && t.amount && t.type)
        .map((t: any): ParsedTransaction => ({
            date: String(t.date),
            title: String(t.title || 'Bank Transaction').slice(0, 80),
            amount: Math.abs(Number(t.amount)),
            type: t.type === 'income' ? 'income' : 'expense',
            notes: 'Imported via AI',
        }))
        .filter(t => t.amount > 0);
}

// ── Regex fallback parser ─────────────────────────────────────────────────────
function parseWithRegex(text: string): ParsedTransaction[] {
    const year = (() => {
        const m = text.match(/\b(20\d{2})\b/g);
        if (!m) return new Date().getFullYear();
        const freq: Record<string, number> = {};
        for (const x of m) freq[x] = (freq[x] || 0) + 1;
        return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
    })();

    const results: ParsedTransaction[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const amountRe = /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g;
    const shortDateRe = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const fullDateRe = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
    const MONTHS: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

    let currentDate: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for full date
        const fd = line.match(fullDateRe);
        if (fd) { currentDate = `${fd[3]}-${fd[2].padStart(2, '0')}-${fd[1].padStart(2, '0')}`; }

        // Check for short date like "01 Apr"
        const sd = line.match(shortDateRe);
        if (sd && line.trim().length <= 10) {
            currentDate = `${year}-${MONTHS[sd[2].toLowerCase()]}-${sd[1].padStart(2, '0')}`;
            continue;
        }

        if (!currentDate) continue;

        const amounts = [...line.matchAll(new RegExp(amountRe.source, 'g'))].map(m => parseFloat(m[0].replace(/,/g, ''))).filter(n => n > 0 && n < 10_000_000);
        if (amounts.length === 0) continue;

        const amount = amounts[0];
        const title = line.replace(new RegExp(amountRe.source, 'g'), '').replace(fullDateRe, '').replace(shortDateRe, '').replace(/UPIOUT\/\d+\//gi, '').replace(/UPI IN\/\d+\//gi, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Bank Transaction';

        const l = line.toLowerCase();
        const type: 'income' | 'expense' = (l.includes('upi in') || l.includes('credit') || l.includes('salary') || l.includes('refund') || l.includes('deposit')) ? 'income' : 'expense';

        results.push({ date: currentDate, title, amount, type, notes: 'Imported from PDF' });
    }

    // Dedupe
    const seen = new Set<string>();
    return results.filter(t => {
        const key = `${t.date}|${t.amount}|${t.title.slice(0, 15)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ── Main Export ───────────────────────────────────────────────────────────────
export async function parseBankStatementPDF(file: File, password?: string): Promise<ParsedTransaction[]> {
    const text = await extractText(file, password);
    try {
        const aiResults = await parseWithGemini(text);
        if (aiResults.length > 0) return aiResults;
    } catch (e: any) {
        console.warn('Gemini failed, using regex fallback:', e?.message);
    }
    return parseWithRegex(text);
}
