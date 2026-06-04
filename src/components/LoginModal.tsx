import { useState } from 'react';
import { X, Eye, EyeOff, Stethoscope, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
  onSuccess: (role: 'faskes' | 'admin') => void;
  defaultRole: 'faskes' | 'admin';
}

export default function LoginModal({ onClose, onSuccess, defaultRole }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'faskes' | 'admin'>(defaultRole);
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      onSuccess(role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-clinical-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {role === 'faskes' ? (
              <Stethoscope className="text-white" size={22} />
            ) : (
              <ShieldCheck className="text-white" size={22} />
            )}
            <div>
              <p className="text-white font-semibold text-base">
                {role === 'faskes' ? 'Portal Tenaga Medis' : 'Portal Admin Dinkes'}
              </p>
              <p className="text-clinical-200 text-xs">MentawaiCare — Akses Aman</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Role toggle */}
        <div className="px-6 pt-5">
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {(['faskes', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  role === r
                    ? 'bg-white text-clinical-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'faskes' ? 'Tenaga Medis' : 'Admin / Dinkes'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Institusi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@faskes.go.id"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isRegister ? 'Daftar & Masuk' : 'Masuk ke Portal'}
          </button>

          <p className="text-center text-xs text-slate-500">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-clinical-600 hover:underline font-medium">
              {isRegister ? 'Masuk' : 'Daftar'}
            </button>
          </p>

          <p className="text-center text-xs text-slate-400">
            Dilindungi enkripsi end-to-end · Standar HL7 FHIR
          </p>
        </form>
      </div>
    </div>
  );
}
