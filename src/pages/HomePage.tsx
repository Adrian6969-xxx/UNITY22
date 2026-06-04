import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Activity, Users, BookOpen,
  Stethoscope, ShieldCheck, ChevronRight,
  Wifi, Clock, AlertTriangle, TrendingUp,
} from 'lucide-react';
import MentawaiMap from '../components/MentawaiMap';
import LoginModal from '../components/LoginModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [loginTarget, setLoginTarget] = useState<'faskes' | 'admin' | null>(null);

  function handleLoginSuccess(role: 'faskes' | 'admin') {
    setLoginTarget(null);
    navigate(role === 'faskes' ? '/faskes' : '/komando');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-teal-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-clinical-600 flex items-center justify-center">
              <Activity className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-clinical-800 text-base tracking-tight">MentawaiCare</span>
              <span className="ml-2 text-xs text-slate-400 hidden sm:inline">Portal Hub Kesehatan Terpadu</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Sistem Aktif
            </span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: copy + CTA */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-clinical-600 bg-clinical-50 border border-clinical-200 px-3 py-1 rounded-full mb-5">
              <Wifi size={12} />
              Terintegrasi SATUSEHAT · INA-CBG · HL7 FHIR
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Radar Kesehatan
              <span className="block text-clinical-600">Kepulauan Mentawai</span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-lg">
              Platform terpadu pengelolaan rekam medis cerdas, klasifikasi penyakit berbasis Machine Learning, dan literasi kesehatan masyarakat 3T Mentawai.
            </p>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Users, label: 'Faskes Aktif', value: '12', color: 'text-clinical-600' },
                { icon: AlertTriangle, label: 'Hotspot', value: '8', color: 'text-amber-600' },
                { icon: TrendingUp, label: 'Kasus Hari Ini', value: '163', color: 'text-teal-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="card px-4 py-3.5 text-center">
                  <Icon className={`mx-auto mb-1.5 ${color}`} size={18} />
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setLoginTarget('faskes')}
                className="flex items-center justify-between bg-clinical-600 hover:bg-clinical-700 text-white font-semibold px-5 py-4 rounded-xl transition-all duration-200 shadow hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Stethoscope size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">Akses Tenaga Medis Faskes 1</div>
                    <div className="text-xs text-clinical-200">Login untuk masuk area klinis</div>
                  </div>
                </div>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setLoginTarget('admin')}
                className="flex items-center justify-between bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-4 rounded-xl transition-all duration-200 shadow hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">Radar Data Epidemiologi</div>
                    <div className="text-xs text-slate-400">Khusus Admin & Kepala Dinkes</div>
                  </div>
                </div>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/literasi')}
                className="flex items-center justify-between bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-4 rounded-xl transition-all duration-200 shadow hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">Pusat Literasi & Edukasi Warga</div>
                    <div className="text-xs text-teal-200">Akses bebas untuk masyarakat</div>
                  </div>
                </div>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right: Heatmap */}
          <div className="card p-4 lg:p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="text-clinical-600" size={18} />
                  Radar Peta Panas Mentawai
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Persebaran penyakit real-time per wilayah</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={12} />
                <span>Update 5 mnt lalu</span>
              </div>
            </div>
            <MentawaiMap />

            {/* Quick hotspot table */}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Hotspot Teratas</p>
              {[
                { loc: 'Muara Siberut', dis: 'Diare', count: 47, sev: 'bg-red-500' },
                { loc: 'Sioban, Sipora', dis: 'Diare', count: 31, sev: 'bg-orange-500' },
                { loc: 'Taileleu', dis: 'Malaria', count: 12, sev: 'bg-orange-500' },
              ].map((h) => (
                <div key={h.loc} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${h.sev}`} />
                    <span className="text-slate-700 font-medium">{h.loc}</span>
                    <span className="text-slate-400">{h.dis}</span>
                  </div>
                  <span className="font-semibold text-slate-600">{h.count} kasus</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="card px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">Kepatuhan & Regulasi</p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              'JKN / BPJS Kesehatan', 'Standar HL7 FHIR', 'SATUSEHAT Kemenkes',
              'PPK Faskes 1', 'ICD-10 WHO', 'Smart City Governance',
            ].map((badge) => (
              <span key={badge} className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        MentawaiCare © 2025 · Sistem Kesehatan Terintegrasi Kepulauan Mentawai · Dinas Kesehatan Kab. Mentawai
      </footer>

      {loginTarget && (
        <LoginModal
          defaultRole={loginTarget}
          onClose={() => setLoginTarget(null)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
