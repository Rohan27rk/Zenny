import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Shield, Zap, BarChart2, ArrowRight, Star, CreditCard, RefreshCw } from 'lucide-react';
import { ZennyLogo } from '../components/ZennyLogo';

interface LandingProps { onGetStarted: () => void; }

// Floating 3D card data
const FLOAT_CARDS = [
    { label: 'Net Balance', value: '₹1,24,500', color: '#22c55e', bg: 'linear-gradient(135deg, #0f3460, #533483)', x: -60, y: -30, rot: -8, delay: 0 },
    { label: 'SIP — Mirae Asset', value: '₹2,000/mo', color: '#3b82f6', bg: 'linear-gradient(135deg, #1e3a5f, #1e40af)', x: 55, y: -50, rot: 6, delay: 0.4 },
    { label: 'HDFC Regalia', value: '•••• 2587', color: '#8b5cf6', bg: 'linear-gradient(135deg, #2d1b69, #11998e)', x: -45, y: 55, rot: 5, delay: 0.8 },
    { label: 'Savings Rate', value: '32% 🎯', color: '#f59e0b', bg: 'linear-gradient(135deg, #451a03, #92400e)', x: 60, y: 45, rot: -5, delay: 1.2 },
];

const features = [
    { icon: <BarChart2 className="w-5 h-5" />, color: '#3b82f6', title: 'Smart Analytics', desc: 'Visual charts that show exactly where your money goes every month.' },
    { icon: <TrendingUp className="w-5 h-5" />, color: '#22c55e', title: 'SIP Tracker', desc: 'Never miss a debit date. Track all your mutual fund SIPs in one place.' },
    { icon: <CreditCard className="w-5 h-5" />, color: '#8b5cf6', title: 'Credit Cards', desc: 'Monitor balances, utilisation and upcoming due dates effortlessly.' },
    { icon: <Zap className="w-5 h-5" />, color: '#f59e0b', title: 'PDF Import', desc: 'Upload your bank statement and we auto-import all transactions.' },
    { icon: <Shield className="w-5 h-5" />, color: '#06b6d4', title: 'Bank-grade Security', desc: 'Your data is encrypted and never shared with third parties.' },
    { icon: <RefreshCw className="w-5 h-5" />, color: '#ec4899', title: 'Real-time Sync', desc: 'Every update reflects instantly across all sections of the app.' },
];

export function Landing({ onGetStarted }: LandingProps) {
    const heroRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [scrollY, setScrollY] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const onMouseMove = (e: React.MouseEvent) => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMouse({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
    };

    return (
        <div className="min-h-screen text-white overflow-x-hidden"
            style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a18 40%, #0f0f22 100%)' }}>

            {/* Animated background grid */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    transform: `translateY(${scrollY * 0.1}px)`,
                }} />
                {/* Animated orbs */}
                <div className="absolute rounded-full animate-pulse" style={{
                    width: '600px', height: '600px', top: '-200px', left: '10%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)',
                    filter: 'blur(40px)', animationDuration: '4s',
                }} />
                <div className="absolute rounded-full" style={{
                    width: '500px', height: '500px', bottom: '-100px', right: '5%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'pulse 6s ease-in-out infinite',
                }} />
                <div className="absolute rounded-full" style={{
                    width: '300px', height: '300px', top: '40%', left: '50%',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)',
                    filter: 'blur(30px)',
                    animation: 'pulse 8s ease-in-out infinite 2s',
                }} />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5"
                style={{ transform: `translateY(${visible ? 0 : -20}px)`, opacity: visible ? 1 : 0, transition: 'all 0.6s ease' }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 20px rgba(139,92,246,0.6)' }}>
                        <ZennyLogo size={22} />
                    </div>
                    <span className="font-black text-lg gradient-text tracking-tight">Zenny</span>
                </div>
                <button onClick={onGetStarted}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}>
                    Get Started
                </button>
            </nav>

            {/* Hero */}
            <section ref={heroRef} onMouseMove={onMouseMove}
                className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-32 text-center"
                style={{ perspective: '1000px' }}>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border border-white/10"
                    style={{
                        background: 'rgba(59,130,246,0.1)', color: '#93c5fd',
                        transform: `translateY(${visible ? 0 : 20}px)`, opacity: visible ? 1 : 0,
                        transition: 'all 0.6s ease 0.1s',
                    }}>
                    <Star className="w-3 h-3" /> Free forever · No credit card required
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6"
                    style={{
                        transform: `translateY(${visible ? 0 : 30}px) rotateX(${mouse.y * -2}deg) rotateY(${mouse.x * 2}deg)`,
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
                        transformStyle: 'preserve-3d',
                    }}>
                    Because adulting{' '}
                    <span className="gradient-text" style={{ display: 'inline-block' }}>is expensive.</span>
                </h1>

                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
                    style={{
                        transform: `translateY(${visible ? 0 : 20}px)`, opacity: visible ? 1 : 0,
                        transition: 'all 0.7s ease 0.3s',
                    }}>
                    Track income, expenses, SIPs and credit cards in one beautiful dashboard.
                    Built for the generation that hustles.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
                    style={{
                        transform: `translateY(${visible ? 0 : 20}px)`, opacity: visible ? 1 : 0,
                        transition: 'all 0.7s ease 0.4s',
                    }}>
                    <button onClick={onGetStarted}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 hover:-translate-y-1 hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 8px 30px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                        Start for free <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={onGetStarted}
                        className="px-8 py-4 rounded-2xl text-base font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all duration-200">
                        Sign in
                    </button>
                </div>

                {/* 3D floating cards */}
                <div className="relative h-80 sm:h-96 mx-auto max-w-2xl"
                    style={{
                        perspective: '800px', transformStyle: 'preserve-3d',
                        transform: `rotateX(${mouse.y * 3}deg) rotateY(${mouse.x * 3}deg)`,
                        transition: 'transform 0.1s ease',
                    }}>

                    {/* Center glow */}
                    <div className="absolute inset-0 rounded-3xl" style={{
                        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15), transparent 70%)',
                        filter: 'blur(20px)',
                    }} />

                    {/* Central dashboard mockup */}
                    <div className="absolute inset-8 rounded-2xl border border-white/10 overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                            transform: 'translateZ(0px)',
                            opacity: visible ? 1 : 0,
                            transition: 'opacity 0.8s ease 0.5s',
                        }}>
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                            <div className="flex-1 mx-3 h-4 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {[['Balance', '₹1,24,500', '#22c55e'], ['Income', '₹2,00,000', '#22c55e'], ['Expenses', '₹75,500', '#ef4444']].map(([l, v, c]) => (
                                    <div key={l} className="rounded-xl p-2.5 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                        <p className="text-[10px] text-slate-500 mb-0.5">{l}</p>
                                        <p className="text-xs font-bold" style={{ color: c }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl p-3 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="flex items-end gap-1 h-12">
                                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-sm"
                                            style={{ height: `${h}%`, background: i % 2 === 0 ? 'rgba(139,92,246,0.6)' : 'rgba(59,130,246,0.4)', transition: `height ${0.3 + i * 0.05}s ease` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating 3D cards */}
                    {FLOAT_CARDS.map((card, i) => (
                        <div key={i} className="absolute rounded-xl p-3 border border-white/15"
                            style={{
                                background: card.bg,
                                width: '140px',
                                left: `calc(50% + ${card.x}px - 70px)`,
                                top: `calc(50% + ${card.y}px - 35px)`,
                                transform: `translateZ(40px) rotate(${card.rot}deg)`,
                                boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 20px ${card.color}30`,
                                opacity: visible ? 1 : 0,
                                transition: `opacity 0.6s ease ${0.6 + card.delay}s, transform 0.1s ease`,
                                animation: `float${i} ${3 + i * 0.5}s ease-in-out infinite ${card.delay}s`,
                            }}>
                            <p className="text-white/50 text-[9px] uppercase tracking-wider">{card.label}</p>
                            <p className="font-bold text-sm mt-0.5" style={{ color: card.color }}>{card.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <p className="text-center text-slate-500 text-sm font-medium uppercase tracking-widest mb-3">Everything you need</p>
                <h2 className="text-center text-3xl font-black text-white mb-12">Built different. Built for you.</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                        <div key={i}
                            className="rounded-2xl p-5 border border-white/8 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group cursor-default"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                transform: `perspective(600px) rotateX(0deg)`,
                                opacity: visible ? 1 : 0,
                                transition: `opacity 0.5s ease ${0.1 * i}s, transform 0.3s ease, box-shadow 0.3s ease`,
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${f.color}20`;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                            }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                                style={{ background: `${f.color}20`, border: `1px solid ${f.color}30`, color: f.color, boxShadow: `0 0 20px ${f.color}20` }}>
                                {f.icon}
                            </div>
                            <p className="font-bold text-white text-sm mb-1">{f.title}</p>
                            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 max-w-2xl mx-auto px-6 pb-24 text-center">
                <div className="rounded-3xl border border-white/10 p-10"
                    style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))',
                        boxShadow: '0 0 60px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 30px rgba(139,92,246,0.5)' }}>
                        <ZennyLogo size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Ready to get Zenny?</h3>
                    <p className="text-slate-400 text-sm mb-6">Join thousands who stopped guessing and started knowing.</p>
                    <button onClick={onGetStarted}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white mx-auto transition-all duration-200 hover:-translate-y-1 hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 8px 25px rgba(139,92,246,0.45)' }}>
                        Start for free <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-6 text-center">
                <p className="text-slate-400 text-xs">© 2026 Zenny · Built with ❤️ · Your data stays yours</p>
                <p className="text-slate-500 text-xs mt-1">Crafted by <span className="text-slate-300 font-medium">Rohan Kanegaonkar</span></p>
            </footer>

            <style>{`
        @keyframes float0 { 0%,100% { transform: translateZ(40px) rotate(-8deg) translateY(0px); } 50% { transform: translateZ(40px) rotate(-8deg) translateY(-10px); } }
        @keyframes float1 { 0%,100% { transform: translateZ(40px) rotate(6deg) translateY(0px); } 50% { transform: translateZ(40px) rotate(6deg) translateY(-8px); } }
        @keyframes float2 { 0%,100% { transform: translateZ(40px) rotate(5deg) translateY(0px); } 50% { transform: translateZ(40px) rotate(5deg) translateY(-12px); } }
        @keyframes float3 { 0%,100% { transform: translateZ(40px) rotate(-5deg) translateY(0px); } 50% { transform: translateZ(40px) rotate(-5deg) translateY(-6px); } }
      `}</style>
        </div>
    );
}
