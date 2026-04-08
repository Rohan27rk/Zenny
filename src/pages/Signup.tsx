import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { ZennyLogo } from '../components/ZennyLogo';

interface SignupProps {
  onToggleAuth: () => void;
}

export function Signup({ onToggleAuth }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); setLoading(false); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    const { error } = await signUp(email, password);
    if (error) { setError(error.message || 'Failed to create account'); setLoading(false); }
    else { setSuccess(true); setLoading(false); }
  };

  const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    borderColor: 'rgba(255,255,255,0.1)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(59,130,246,0.6)';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(59,130,246,0.15)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
  };

  const bgStyle = { background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)' };
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <div className="w-full max-w-md rounded-3xl border border-white/10 p-8 backdrop-blur-xl text-center" style={cardStyle}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 0 40px rgba(34,197,94,0.5)' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Created!</h1>
          <p className="text-slate-400 mb-6">Your account is ready. Sign in to get started.</p>
          <button onClick={onToggleAuth}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            Go to Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl border border-white/10 p-8 backdrop-blur-xl" style={cardStyle}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 40px rgba(139,92,246,0.6)' }}>
              <ZennyLogo size={42} />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Create Account</h1>
            <p className="text-slate-400 text-sm">Because adulting is expensive.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" placeholder="Repeat your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              {loading ? 'Creating account...' : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <button onClick={onToggleAuth} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
