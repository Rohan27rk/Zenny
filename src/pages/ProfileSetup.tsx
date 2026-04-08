import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Phone,
  Briefcase,
  Target,
  ChevronRight,
  Check,
} from "lucide-react";
import { ZennyLogo } from "../components/ZennyLogo";

const OCCUPATIONS = [
  "Salaried Employee",
  "Self-Employed",
  "Business Owner",
  "Freelancer",
  "Student",
  "Homemaker",
  "Retired",
  "Other",
];
const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee" },
  { code: "USD", label: "$ US Dollar" },
  { code: "EUR", label: "€ Euro" },
  { code: "GBP", label: "£ British Pound" },
];

export function ProfileSetup() {
  const { updateProfile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    occupation: "",
    monthly_income: "",
    savings_goal_pct: 20,
    currency: "INR",
  });

  const set = (key: string, val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    const { error } = await updateProfile({
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      occupation: form.occupation || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      savings_goal_pct: form.savings_goal_pct,
      currency: form.currency,
      onboarding_complete: true,
    } as any);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 border text-sm";
  const inputStyle = {
    background: "rgba(0,0,0,0.35)",
    borderColor: "rgba(255,255,255,0.1)",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
  };
  const onFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    e.target.style.borderColor = "rgba(59,130,246,0.6)";
    e.target.style.boxShadow =
      "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(59,130,246,0.12)";
  };
  const onBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
  };

  const steps = [
    { label: "Personal", icon: <User className="w-3.5 h-3.5" /> },
    { label: "Financial", icon: <Briefcase className="w-3.5 h-3.5" /> },
    { label: "Goals", icon: <Target className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #1a1a2e 100%)",
      }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #3b82f6, transparent)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full opacity-8"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              boxShadow: "0 0 30px rgba(139,92,246,0.5)",
            }}
          >
            <ZennyLogo size={24} />
          </div>
          <h1 className="text-2xl font-bold gradient-text">
            Set up your profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Takes about 2 minutes · You can edit this later
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
                  style={
                    done
                      ? {
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                          border: "1px solid rgba(34,197,94,0.3)",
                        }
                      : active
                        ? {
                            background: "rgba(59,130,246,0.15)",
                            color: "#93c5fd",
                            border: "1px solid rgba(59,130,246,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.3)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }
                  }
                >
                  {done ? <Check className="w-3 h-3" /> : s.icon}
                  {s.label}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-4 h-px"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          className="rounded-3xl border border-white/10 p-7 backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/25"
              style={{ background: "rgba(239,68,68,0.08)" }}
            >
              {error}
            </div>
          )}

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  className={inputBase}
                  style={inputStyle}
                  placeholder="Enter your name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div
                    className="px-3 py-3 rounded-xl border border-white/10 text-sm text-slate-400 flex-shrink-0"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                  >
                    +91
                  </div>
                  <input
                    className={inputBase}
                    style={inputStyle}
                    placeholder="9876543210"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className={inputBase}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Currency
                </label>
                <select
                  className={inputBase}
                  style={{ ...inputStyle, appearance: "none" }}
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  {CURRENCIES.map((c) => (
                    <option
                      key={c.code}
                      value={c.code}
                      style={{ background: "#1e1e30" }}
                    >
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (!form.full_name.trim()) {
                    setError("Please enter your name");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5 mt-2"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
                }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Financial info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Occupation
                </label>
                <select
                  className={inputBase}
                  style={{ ...inputStyle, appearance: "none" }}
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="" style={{ background: "#1e1e30" }}>
                    Select occupation
                  </option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o} style={{ background: "#1e1e30" }}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Monthly Income (approx.)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    className={`${inputBase} pl-7`}
                    style={inputStyle}
                    placeholder="50000"
                    min="0"
                    value={form.monthly_income}
                    onChange={(e) => set("monthly_income", e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Used to calculate your savings rate. Not shared anywhere.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setError("");
                    setStep(3);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
                  }}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-3">
                  Monthly Savings Goal —{" "}
                  <span className="text-blue-400 font-bold">
                    {form.savings_goal_pct}%
                  </span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={form.savings_goal_pct}
                  onChange={(e) =>
                    set("savings_goal_pct", Number(e.target.value))
                  }
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>5%</span>
                  <span className="text-slate-400">Recommended: 20%</span>
                  <span>80%</span>
                </div>
                {form.monthly_income && (
                  <div
                    className="mt-3 p-3 rounded-xl border border-white/8 text-center"
                    style={{ background: "rgba(59,130,246,0.08)" }}
                  >
                    <p className="text-xs text-slate-400">
                      Monthly savings target
                    </p>
                    <p className="text-lg font-bold text-blue-400 mt-0.5">
                      ₹
                      {Math.round(
                        (Number(form.monthly_income) * form.savings_goal_pct) /
                          100,
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="p-4 rounded-xl border border-white/8"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  Your profile summary
                </p>
                <div className="space-y-1">
                  {[
                    ["Name", form.full_name],
                    ["Occupation", form.occupation || "—"],
                    ["Currency", form.currency],
                    ["Savings goal", `${form.savings_goal_pct}% of income`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 hover:bg-white/5 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #15803d)",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
                  }}
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Let's go!
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
