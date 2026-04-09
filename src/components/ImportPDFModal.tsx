import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react';
import { parseBankStatementPDF, ParsedTransaction } from '../lib/pdfParser';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Category } from '../lib/database.types';

interface ImportPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSuccess: () => void;
}

export function ImportPDFModal({ isOpen, onClose, categories, onSuccess }: ImportPDFModalProps) {
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'upload' | 'password' | 'review' | 'done'>('upload');
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [fileName, setFileName] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');

    const defaultCategoryId = (type: 'income' | 'expense') =>
        categories.find(c => c.type === type)?.id ?? '';

    const handleFile = async (file: File, pwd?: string) => {
        if (!file.name.endsWith('.pdf')) { setError('Please upload a PDF file.'); return; }
        setError('');
        setParsing(true);
        setFileName(file.name);
        try {
            const txns = await parseBankStatementPDF(file, pwd);
            if (txns.length === 0) {
                setError('No transactions found. This PDF format may not be supported yet. Try a different bank statement.');
                setParsing(false);
                return;
            }
            setParsed(txns);
            setSelected(new Set(txns.map((_, i) => i)));
            setStep('review');
        } catch (e: any) {
            const msg: string = e?.message ?? '';
            if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
                setPendingFile(file);
                setPassword('');
                setStep('password');
            } else {
                setError('Failed to parse PDF: ' + msg);
            }
        } finally {
            setParsing(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!pendingFile || !password.trim()) return;
        await handleFile(pendingFile, password.trim());
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const toggleSelect = (i: number) => {
        const next = new Set(selected);
        next.has(i) ? next.delete(i) : next.add(i);
        setSelected(next);
    };

    const handleImport = async () => {
        setSaving(true);
        setError('');
        const toImport = parsed.filter((_, i) => selected.has(i));
        const rows = toImport.map(t => ({
            user_id: user!.id,
            title: t.title,
            amount: t.amount,
            type: t.type,
            category_id: defaultCategoryId(t.type),
            date: t.date,
            notes: t.notes,
        }));

        const { error } = await supabase.from('transactions').insert(rows);
        if (error) { setError(error.message); setSaving(false); return; }
        setSaving(false);
        setStep('done');
        setTimeout(() => { onSuccess(); handleClose(); }, 1500);
    };

    const handleClose = () => {
        setStep('upload');
        setParsed([]);
        setSelected(new Set());
        setError('');
        setFileName('');
        setPendingFile(null);
        setPassword('');
        onClose();
    };

    if (!isOpen) return null;

    const overlayStyle = { background: 'linear-gradient(135deg, #1e1e30, #16162a)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden" style={{ ...overlayStyle, animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold gradient-text">Import Bank Statement</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Upload a PDF from your bank to auto-import transactions</p>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div>
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 hover:border-blue-500/50"
                                style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)' }}
                            >
                                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                {parsing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader className="w-10 h-10 text-blue-400 animate-spin" />
                                        <p className="text-slate-300 font-medium">AI is reading {fileName}...</p>
                                        <p className="text-slate-500 text-sm">Gemini is extracting all transactions</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                                            <Upload className="w-7 h-7 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">Drop your bank statement here</p>
                                            <p className="text-slate-400 text-sm mt-1">or click to browse — PDF files only</p>
                                        </div>
                                        <p className="text-xs text-slate-600">Works with HDFC, SBI, ICICI, Axis, Kotak and most Indian banks</p>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="mt-6 p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <p className="text-xs font-semibold text-slate-400 mb-2">How it works</p>
                                <ul className="text-xs text-slate-500 space-y-1">
                                    <li>• Download your bank statement as PDF from your bank's net banking portal</li>
                                    <li>• Upload it here — we parse it locally in your browser (nothing is sent to any server)</li>
                                    <li>• Review the detected transactions and deselect any you don't want</li>
                                    <li>• Hit Import to add them all at once</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step: Password */}
                    {step === 'password' && (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-base mb-1">Password Protected PDF</p>
                            <p className="text-slate-400 text-sm mb-1">{fileName}</p>
                            <p className="text-slate-500 text-xs mb-6">This PDF is encrypted. Enter the password set by your bank.<br />Common formats: <span className="text-slate-400">DDMMYYYY</span> · <span className="text-slate-400">NAME + DOB</span> · <span className="text-slate-400">PAN number</span> · <span className="text-slate-400">Account number</span></p>

                            {error && (
                                <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30 text-left" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none border text-sm mb-4"
                                style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
                                placeholder="Enter PDF password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                                autoFocus
                            />

                            <div className="flex gap-3">
                                <button onClick={() => { setStep('upload'); setError(''); }}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all">
                                    Back
                                </button>
                                <button onClick={handlePasswordSubmit} disabled={parsing || !password.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
                                    {parsing ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                    {parsing ? 'Unlocking...' : 'Unlock & Parse'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Review */}
                    {step === 'review' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-white font-semibold flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        {fileName}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-0.5">Found {parsed.length} transactions — {selected.size} selected</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelected(new Set(parsed.map((_, i) => i)))} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Select all</button>
                                    <span className="text-slate-600">·</span>
                                    <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-300 transition-colors">Deselect all</button>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                {parsed.map((t, i) => (
                                    <div key={i}
                                        onClick={() => toggleSelect(i)}
                                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                                        style={{
                                            background: selected.has(i) ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                                            borderColor: selected.has(i) ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                                        }}>
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${selected.has(i) ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                                            {selected.has(i) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{t.title}</p>
                                            <p className="text-xs text-slate-500">{t.date}</p>
                                        </div>
                                        <p className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setStep('upload')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-200">
                                    Back
                                </button>
                                <button onClick={handleImport} disabled={saving || selected.size === 0}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                    {saving ? 'Importing...' : `Import ${selected.size} transactions`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Done */}
                    {step === 'done' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}>
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-white font-bold text-lg">Import Successful</p>
                            <p className="text-slate-400 text-sm mt-1">{selected.size} transactions added to your account</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        </div>
    );
}
