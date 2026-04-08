import { TrendingUp, Shield, Zap, BarChart2, ArrowRight, Star } from 'lucide-react';
import { ZennyLogo } from '../components/ZennyLogo';

interface LandingProps {
    onGetStarted: () => void;
}

const features = [
    { icon: <BarChart2 className="w-5 h-5" />, color: '#3b82f6', title: 'Smart Analytics', desc: 'Visual charts that show exactly where your money goes every month.' },
    { icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', title: 'Savings Goals', desc: 'Set targets, track progress, and get nudges when you\'re off track.' },
    { icon: <Shield className="w-5 h-5" />, color: '#8b5cf6', title: 'Bank-grade Security', desc: 'Your data is encrypted and never shared with third parties.' },
    { icon: <Zap className="w-5 h-5" />, color: '#f59e0b', title: 'PDF Import', desc: 'Upload your bank statement and we auto-import all transactions.' },
];

export function Landing({ onGetStarted }: LandingProps) {
    return (
        <div className="min-h-screen text-white overflow-x-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 40%, #1a1a2e 100%)' }}>

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(80px)', transform: 'translateY(-50%)' }} />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(80px)', transform: 'translateY(50%)' }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 18px rgba(139,92,246,0.55)' }}>
                        <ZennyLogo size={22} />
                    </div>
                    <span className="font-black text-lg gradient-text tracking-tight">Zenny</span>
                </div>
                <button onClick={onGetStarted}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.35)' }}>
                    Get Started
                </button>
            </nav>

            {/* Hero */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border border-white/10"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}>
                    <Star className="w-3 h-3" />
                    Free forever · No credit card required
                </div>

                <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
                    Because adulting{' '}
                    <span className="gradient-text">is expensive.</span>
                </h1>

                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                    Track income, expenses, and savings in one beautiful dashboard.
                    Import bank statements, visualize trends, and hit your financial goals.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={onGetStarted}
                        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold text-white transition-all duration-200 hover:-translate-y-1 hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 8px 30px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                        Start for free
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={onGetStarted}
                        className="px-7 py-3.5 rounded-2xl text-base font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-200">
                        Sign in
                    </button>
                </div>

                {/* Mock dashboard preview */}
                <div className="mt-16 relative">
                    <div className="rounded-3xl border border-white/10 overflow-hidden mx-auto max-w-3xl"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                        {/* Fake browser bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                            <div className="w-3 h-3 rounded-full bg-red-500/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                            <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            <div className="flex-1 mx-4 h-5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        {/* Fake dashboard content */}
                        <div className="p-5">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[['Net Balance', '₹1,24,500', '#22c55e'], ['Income', '₹2,00,000', '#22c55e'], ['Expenses', '₹75,500', '#ef4444']].map(([label, val, color]) => (
                                    <div key={label} className="rounded-xl p-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                                        <p className="text-sm font-bold" style={{ color }}>{val}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl p-4 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="flex items-end gap-1 h-16">
                                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-sm transition-all"
                                            style={{ height: `${h}%`, background: i % 2 === 0 ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.4)' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow under preview */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 opacity-30"
                        style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent)', filter: 'blur(20px)' }} />
                </div>
            </section>

            {/* Features */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <p className="text-center text-slate-500 text-sm font-medium uppercase tracking-widest mb-10">Everything you need</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f, i) => (
                        <div key={i} className="rounded-2xl p-5 border border-white/8 transition-all duration-300 hover:-translate-y-1"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white"
                                style={{ background: `${f.color}20`, border: `1px solid ${f.color}30`, color: f.color }}>
                                {f.icon}
                            </div>
                            <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-6 text-center">
                <p className="text-slate-400 text-xs">© 2026 Zenny · Built with ❤️ · Your data stays yours</p>
                <p className="text-slate-500 text-xs mt-1">Crafted by <span className="text-slate-300 font-medium">Rohan Kanegaonkar</span></p>
            </footer>
        </div>
    );
}
