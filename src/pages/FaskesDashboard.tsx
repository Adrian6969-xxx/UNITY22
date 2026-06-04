import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Plus, LogOut, Users, CheckCircle,
  ArrowRightCircle, Clock, AlertCircle, RefreshCw,
  ClipboardList, TrendingUp, Phone,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { supabase, MedicalRecord } from '../lib/supabase';
import EMRForm from '../components/EMRForm';

const DAILY_SAMPLE = [
  { hour: '08:00', selesai: 3, rujuk: 0 },
  { hour: '09:00', selesai: 5, rujuk: 1 },
  { hour: '10:00', selesai: 7, rujuk: 2 },
  { hour: '11:00', selesai: 4, rujuk: 0 },
  { hour: '12:00', selesai: 2, rujuk: 1 },
  { hour: '13:00', selesai: 6, rujuk: 0 },
  { hour: '14:00', selesai: 4, rujuk: 2 },
];

export default function FaskesDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showEMR, setShowEMR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/'); return; }
      setUser({ id: data.user.id, email: data.user.email ?? '' });
    });
  }, [navigate]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('medical_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRecords(data as MedicalRecord[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const totalToday = records.length;
  const selesai = records.filter((r) => r.disposition === 'faskes' || r.disposition === 'manual').length;
  const tele = records.filter((r) => r.disposition === 'tele').length;
  const rujuk = records.filter((r) => r.disposition === 'rujuk').length;

  const dispositionLabel: Record<string, string> = {
    faskes: 'Selesai di Faskes', tele: 'Tele-Expertise', rujuk: 'Dirujuk', manual: 'Manual', pending: 'Menunggu',
  };
  const dispositionBadge: Record<string, string> = {
    faskes: 'badge-green', tele: 'badge-amber', rujuk: 'badge-red', manual: 'badge-blue', pending: 'badge-blue',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-clinical-600 flex items-center justify-center">
              <Activity className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-clinical-800 text-sm">MentawaiCare</span>
              <span className="ml-2 text-xs text-slate-400">Dashboard Faskes 1</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={() => setShowEMR(true)}
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Input Pemeriksaan Pasien Baru</span>
              <span className="sm:hidden">+ Pasien</span>
            </button>
            <button onClick={logout} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Audit trail notice */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-4 py-2.5">
          <AlertCircle size={13} className="text-clinical-500 shrink-0" />
          Sistem Audit Trail aktif — setiap tindakan dicatat dengan waktu, identitas, dan aksi untuk keamanan medikolegal.
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Pasien (Sesi)', value: totalToday, color: 'text-clinical-600', bg: 'bg-clinical-50' },
            { icon: CheckCircle, label: 'Selesai di Faskes', value: selesai, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Phone, label: 'Tele-Expertise', value: tele, color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: ArrowRightCircle, label: 'Dirujuk RSUD', value: rujuk, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card px-5 py-4">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={color} size={18} />
              </div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Daily chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-clinical-500" size={17} />
                  Rasio Pasien Harian
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Selesai vs Dirujuk per jam</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DAILY_SAMPLE} barSize={10} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="selesai" name="Selesai" radius={[4, 4, 0, 0]} fill="#22c55e" />
                <Bar dataKey="rujuk" name="Dirujuk" radius={[4, 4, 0, 0]} fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Records list */}
          <div className="card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-clinical-500" size={17} />
                Rekam Medis Terbaru
              </h3>
              <button onClick={fetchRecords} className="text-slate-400 hover:text-clinical-600 transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-clinical-200 border-t-clinical-600 rounded-full animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Belum ada rekam medis hari ini</p>
                <p className="text-xs mt-1">Mulai input pasien baru dengan tombol di atas</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72 scrollbar-thin pr-1">
                {records.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between px-3.5 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">{rec.patient_name}</p>
                        <span className={`${dispositionBadge[rec.disposition] ?? 'badge-blue'} text-xs`}>
                          {dispositionLabel[rec.disposition] ?? rec.disposition}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        [{rec.final_diagnosis_code ?? rec.ml_diagnosis_code ?? '—'}] {rec.final_diagnosis_name ?? rec.ml_diagnosis_name ?? rec.chief_complaint}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(rec.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {rec.ina_cbg_claimed && (
                        <span className="text-xs text-emerald-600 font-medium">INA-CBG ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showEMR && user && (
        <EMRForm
          staffId={user.id}
          onClose={() => setShowEMR(false)}
          onSaved={() => { setShowEMR(false); fetchRecords(); }}
        />
      )}
    </div>
  );
}
