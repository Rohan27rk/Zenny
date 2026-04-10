import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCZt_BVHT6of3TCq4up3nr3FQJSjU9Oao8';

const SYSTEM_PROMPT = `You are Zenny AI, a friendly and knowledgeable personal finance assistant built into the Zenny app. 
You help Indian users with:
- Investment advice (SIPs, mutual funds, stocks, FDs, PPF, NPS)
- Credit card recommendations (best cards for beginners, rewards, cashback)
- Savings strategies and budgeting tips
- Expense management and financial planning
- Understanding financial terms in simple language
- Tax saving tips (ELSS, 80C deductions)

Keep responses concise, practical and India-focused. Use ₹ for currency. 
Be warm, encouraging and use simple language. 
If asked about specific stock tips or guaranteed returns, politely decline and suggest consulting a SEBI-registered advisor.
Format responses with bullet points when listing multiple items. Keep answers under 200 words unless the question needs more detail.`;

const QUICK_QUESTIONS = [
    'Best credit card for beginners?',
    'How to start SIP with ₹500/month?',
    'How to save more money?',
    'What is ELSS and how does it save tax?',
    'Difference between SIP and lump sum?',
];

async function askGemini(messages: Message[]): Promise<string> {
    const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
    }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: history,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        }
    );

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not get a response. Please try again.';
}

export function AIChatbot() {
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: `Hey ${profile?.full_name?.split(' ')[0] ?? 'there'} 👋 I'm Zenny AI, your personal finance buddy. Ask me anything about investments, credit cards, savings, or SIPs!` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    const send = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Message = { role: 'user', text: text.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        try {
            const reply = await askGemini(newMessages);
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again in a moment.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Format text — convert **bold** and bullet points
    const formatText = (text: string) => {
        return text
            .split('\n')
            .map((line, i) => {
                const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
                    return <li key={i} className="ml-3 list-disc" dangerouslySetInnerHTML={{ __html: bold.slice(2) }} />;
                }
                return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
            });
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 8px 25px rgba(139,92,246,0.5)' }}>
                {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                {!open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0a0a14] animate-pulse" />
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-3xl border border-white/10 overflow-hidden flex flex-col"
                    style={{
                        background: 'linear-gradient(145deg, #1a1a2e, #12121f)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.2)',
                        height: '520px',
                        animation: 'chatIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Zenny AI</p>
                            <p className="text-emerald-400 text-[10px] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Online · Finance Expert
                            </p>
                        </div>
                        <button onClick={() => setOpen(false)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                                    {msg.role === 'user'
                                        ? <User className="w-3.5 h-3.5 text-blue-400" />
                                        : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                                </div>
                                {/* Bubble */}
                                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-1 ${msg.role === 'user'
                                        ? 'text-white rounded-tr-sm'
                                        : 'text-slate-200 rounded-tl-sm'
                                    }`}
                                    style={msg.role === 'user'
                                        ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }
                                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {formatText(msg.text)}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/20">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <div className="rounded-2xl rounded-tl-sm px-4 py-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div className="flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick questions — show only at start */}
                        {messages.length === 1 && !loading && (
                            <div className="space-y-1.5 pt-1">
                                <p className="text-slate-600 text-[10px] uppercase tracking-wider px-1">Quick questions</p>
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button key={i} onClick={() => send(q)}
                                        className="w-full text-left text-xs px-3 py-2 rounded-xl border border-white/8 text-slate-300 hover:bg-white/5 hover:text-white hover:border-purple-500/30 transition-all"
                                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-white/8 flex-shrink-0">
                        <div className="flex gap-2 items-center rounded-2xl border border-white/10 px-3 py-2"
                            style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <input
                                ref={inputRef}
                                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
                                placeholder="Ask about finance, SIPs, cards..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send(input)}
                                disabled={loading}
                            />
                            <button onClick={() => send(input)} disabled={!input.trim() || loading}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                                {loading ? <Loader className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                            </button>
                        </div>
                        <p className="text-slate-700 text-[9px] text-center mt-1.5">Powered by Gemini AI · Not financial advice</p>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes chatIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </>
    );
}
