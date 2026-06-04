import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LogOut, Database, RefreshCw, Download,
  Globe, MapPin, TrendingUp, BarChart2, Bell,
  AlertTriangle, Filter, Zap, CheckCircle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { supabase, DiseaseHotspot, SystemAlert } from '../lib/supabase';

const MONTHLY_TREND = [
  { bulan: 'Jan', diare: 120, ispa: 210, malaria: 45 },
  { bulan: 'Feb', diare: 98, ispa: 190, malaria: 38 },
  { bulan: 'Mar', diare: 145, ispa: 230, malaria: 52 },
  { bulan: 'Apr', diare: 167, ispa: 215, malaria: 41 },
  { bulan: 'Mei', diare: 134, ispa: 245, malaria: 33 },
  { bulan: 'Jun', diare: 189, ispa: 228, malaria: 47 },
];

const NATIONAL_TREND = [
  { bulan: 'Jan', nasional: 15000, sumbar: 890, mentawai: 120 },
  { bulan: 'Feb', nasional: 13800, sumbar: 780, mentawai: 98 },
  { bulan: 'Mar', nasional: 16200, sumbar: 960, mentawai: 145 },
  { bulan: 'Apr', nasional: 17100, sumbar: 1020, mentawai: 167 },
  { bulan: 'Mei', nasional: 14900, sumbar: 890, mentawai: 134 },
  { bulan: 'Jun', nasional: 18300, sumbar: 1100, mentawai: 189 },
];

type FilterView = 'nasional' | 'sumbar' | 'mentawai';

export default function CommandCenter() {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<DiseaseHotspot[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filter, setFilter] = useState<FilterView>('mentawai');
  const [syncing, setSyncing] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/');
    });
    supabase.from('disease_hotspots').select('*').order('case_count', { ascending: false })
      .then(({ data }) => { if (data) setHotspots(data); });
    supabase.from('system_alerts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAlerts(data); });
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function syncSatusehat() {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setSyncing(false);
  }

  async function broadcastAlert(diseaseName: string, diseaseCode: string) {
    setBroadcasting(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const existing = alerts.find((a) => a.disease_name === diseaseName && a.is_active);
    if (!existing) {
      await supabase.from('system_alerts').insert({
        disease_name: diseaseName,
        disease_code: diseaseCode,
        message: `Peningkatan kasus ${diseaseName} terdeteksi di Kepulauan Mentawai. Waspada dan lakukan tindakan pencegahan.`,
        severity: 'high',
        is_active: true,
        activated_by: userId ?? null,
      });
    }
    setBroadcasting(false);
    setBroadcastSuccess(diseaseName);
    setTimeout(() => setBroadcastSuccess(''), 3000);

    const { data } = await supabase.from('system_alerts').select('*').order('created_at', { ascending: false });
    if (data) setAlerts(data);
  }

  const topDisease = hotspots.reduce<Record<string, number>>((acc, h) => {
    acc[h.disease_name] = (acc[h.disease_name] ?? 0) + h.case_count;
    return acc;
  }, {});

  const sortedDiseases = Object.entries(topDisease).sort((a, b) => b[1] - a[1]);
  const chartData = filter === 'mentawai' ? MONTHLY_TREND.map((d) => ({ ...d, kasus: d.diare + d.ispa + d.malaria })) : NATIONAL_TREND;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-clinical-500 flex items-center justify-center">
              <Activity className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-sm">MentawaiCare</span>
              <span className="ml-2 text-xs text-slate-400">Pusat Komando Data</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/40 border border-emerald-700 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live Data
            </span>
            <button onClick={logout} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filter & Sync row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">Filter Komparasi Wilayah:</span>
            {(['mentawai', 'sumbar', 'nasional'] as FilterView[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === f
                    ? 'bg-clinical-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f === 'mentawai' ? 'Data Mentawai' : f === 'sumbar' ? 'Prov. Sumbar' : 'Data Nasional'}
              </button>
            ))}
          </div>
          <button
            onClick={syncSatusehat}
            disabled={syncing}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          >
            {syncing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Database size={14} />
            )}
            {syncing ? 'Menyinkronkan...' : 'Sinkronisasi SATUSEHAT API'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Kasus (Mentawai)', value: Object.values(topDisease).reduce((a, b) => a + b, 0), icon: MapPin, color: 'text-clinical-400' },
            { label: 'Penyakit Dominan', value: sortedDiseases[0]?.[0] ?? '—', icon: TrendingUp, color: 'text-amber-400' },
            { label: 'Hotspot Aktif', value: hotspots.filter((h) => h.severity === 'high' || h.severity === 'critical').length, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Siaran Aktif', value: alerts.filter((a) => a.is_active).length, icon: Bell, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
              <Icon className={`${color} mb-2`} size={18} />
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trend chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BarChart2 className="text-clinical-400" size={17} />
                  Tren Kasus 6 Bulan Terakhir
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {filter === 'mentawai' ? 'Kepulauan Mentawai — per penyakit' : 'Komparasi wilayah — total kasus'}
                </p>
              </div>
              <Download size={15} className="text-slate-500 cursor-pointer hover:text-slate-300" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              {filter === 'mentawai' ? (
                <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gDiare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gIspa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMalaria" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="diare" name="Diare" stroke="#ef4444" fill="url(#gDiare)" strokeWidth={2} />
                  <Area type="monotone" dataKey="ispa" name="ISPA" stroke="#0ea5e9" fill="url(#gIspa)" strokeWidth={2} />
                  <Area type="monotone" dataKey="malaria" name="Malaria" stroke="#f59e0b" fill="url(#gMalaria)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <LineChart data={NATIONAL_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="nasional" name="Nasional" stroke="#64748b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sumbar" name="Sumbar" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mentawai" name="Mentawai" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Disease ranking + broadcast */}
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Globe className="text-teal-400" size={16} />
                Peringkat Kasus Aktif
              </h3>
              <div className="space-y-3">
                {sortedDiseases.slice(0, 4).map(([disease, count], idx) => (
                  <div key={disease} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 ${idx === 0 ? 'text-red-400' : idx === 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-200">{disease}</span>
                        <span className="text-xs font-semibold text-slate-400">{count}</span>
                      </div>
                      <div className="bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-amber-500' : 'bg-clinical-500'}`}
                          style={{ width: `${Math.min((count / (sortedDiseases[0]?.[1] ?? 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast panel */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <Zap className="text-amber-400" size={16} />
                Terapkan Prioritas Literasi
              </h3>
              <p className="text-xs text-slate-400 mb-4">Kirim siaran darurat ke Portal Literasi Masyarakat berdasarkan tren penyakit terkini.</p>
              <div className="space-y-2">
                {sortedDiseases.slice(0, 3).map(([disease]) => {
                  const codeMap: Record<string, string> = { Diare: 'A09', ISPA: 'J06.9', Malaria: 'B54' };
                  const isSent = broadcastSuccess === disease;
                  return (
                    <button
                      key={disease}
                      onClick={() => broadcastAlert(disease, codeMap[disease] ?? 'R00')}
                      disabled={broadcasting || !!alerts.find((a) => a.disease_name === disease && a.is_active)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isSent
                          ? 'bg-emerald-800 text-emerald-300 border border-emerald-600'
                          : alerts.find((a) => a.disease_name === disease && a.is_active)
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      <span>
                        {isSent ? `Siaran ${disease} aktif!` : `Siaran Kewaspadaan ${disease}`}
                      </span>
                      {isSent ? <CheckCircle size={15} /> : <Zap size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Hotspot table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="text-clinical-400" size={16} />
            Tabel Hotspot Aktif — Mentawai
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  {['Pulau', 'Lokasi', 'Penyakit', 'Kode', 'Kasus', 'Tingkat'].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {hotspots.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 pr-4 text-slate-300">{h.island_name}</td>
                    <td className="py-3 pr-4 text-slate-200 font-medium">{h.location_name}</td>
                    <td className="py-3 pr-4 text-slate-300">{h.disease_name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400">{h.disease_code}</td>
                    <td className="py-3 pr-4 font-bold text-white">{h.case_count}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        h.severity === 'critical' ? 'bg-red-900/60 text-red-300 border border-red-700' :
                        h.severity === 'high' ? 'bg-orange-900/60 text-orange-300 border border-orange-700' :
                        h.severity === 'medium' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' :
                        'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      }`}>
                        {h.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
