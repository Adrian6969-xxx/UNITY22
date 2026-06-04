import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, BookOpen, Search, Play, ArrowLeft,
  Shield, Droplets, Wind, Zap, ChevronRight,
  AlertTriangle, Bell, X, ExternalLink,
} from 'lucide-react';
import { supabase, SystemAlert, LiteracyContent } from '../lib/supabase';

const DISEASE_ICONS: Record<string, React.ReactNode> = {
  Diare: <Droplets size={20} className="text-blue-500" />,
  ISPA: <Wind size={20} className="text-sky-500" />,
  Malaria: <Zap size={20} className="text-amber-500" />,
  DBD: <AlertTriangle size={20} className="text-red-500" />,
  Umum: <Shield size={20} className="text-teal-500" />,
  Trauma: <Shield size={20} className="text-slate-500" />,
};

const CATEGORY_LABEL: Record<string, string> = {
  'pertolongan-pertama': 'Pertolongan Pertama',
  panduan: 'Panduan Berobat',
  edukasi: 'Edukasi Penyakit',
  tutorial: 'Tutorial Digital',
  umum: 'Umum',
};

interface ArticleModalProps {
  content: LiteracyContent;
  onClose: () => void;
}

function ArticleModal({ content, onClose }: ArticleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {DISEASE_ICONS[content.disease_tag] ?? DISEASE_ICONS['Umum']}
            <span className="font-bold text-slate-800 text-base">{content.title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">
          <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full mb-4 inline-block">
            {CATEGORY_LABEL[content.category] ?? content.category}
          </span>
          <div
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed mt-3"
            dangerouslySetInnerHTML={{ __html: content.body_html }}
          />
          <div className="mt-6 p-3.5 bg-clinical-50 border border-clinical-200 rounded-lg text-xs text-clinical-700">
            <strong>Penting:</strong> Informasi ini bersifat edukatif. Segera kunjungi puskesmas terdekat jika gejala memburuk.
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoTutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-800">Cara Pakai Puskesmas Digital</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Play size={48} className="mx-auto mb-3 text-clinical-400" />
              <p className="text-sm">Tutorial Animasi</p>
              <p className="text-xs text-slate-500 mt-1">Cara berobat di sistem MentawaiCare</p>
            </div>
          </div>
          {[
            ['1', 'Datang ke Puskesmas', 'Bawa KTP atau Kartu Indonesia Sehat (KIS)'],
            ['2', 'Pendaftaran Digital', 'Petugas memasukkan NIK Anda ke sistem'],
            ['3', 'Pemeriksaan Dokter', 'Dokter mengisi rekam medis elektronik secara langsung'],
            ['4', 'Terima Resume Digital', 'Anda mendapat ringkasan diagnosa & obat via sistem'],
          ].map(([num, title, desc]) => (
            <div key={num} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-clinical-100 text-clinical-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{num}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LiteracyPortal() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [contents, setContents] = useState<LiteracyContent[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LiteracyContent | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTag, setActiveTag] = useState<string>('Semua');

  useEffect(() => {
    supabase.from('system_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAlerts(data); });
    supabase.from('literacy_content').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setContents(data); });
  }, []);

  const tags = ['Semua', ...Array.from(new Set(contents.map((c) => c.disease_tag).filter(Boolean)))];
  const activeAlert = alerts[0];

  const filtered = contents.filter((c) => {
    const matchTag = activeTag === 'Semua' || c.disease_tag === activeTag;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.disease_tag.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const featured = filtered.filter((c) => c.is_featured);
  const regular = filtered.filter((c) => !c.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-clinical-50">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 mr-1">
              <ArrowLeft size={18} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Activity className="text-white" size={15} />
            </div>
            <span className="font-bold text-teal-800 text-sm">MentawaiCare</span>
            <span className="text-xs text-slate-400 hidden sm:inline">· Portal Literasi Warga</span>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari penyakit..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic alert banner */}
        {activeAlert && (
          <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${
            activeAlert.severity === 'critical' || activeAlert.severity === 'high'
              ? 'bg-red-50 border-red-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              activeAlert.severity === 'critical' || activeAlert.severity === 'high'
                ? 'bg-red-100'
                : 'bg-amber-100'
            }`}>
              <Bell className={activeAlert.severity === 'high' || activeAlert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'} size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-base">
                Awas! Peningkatan Kasus {activeAlert.disease_name}
              </p>
              <p className="text-sm text-slate-600 mt-1">{activeAlert.message}</p>
              <button
                onClick={() => {
                  const article = contents.find((c) => c.disease_tag === activeAlert.disease_name);
                  if (article) setSelected(article);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800"
              >
                Baca Panduan Pencegahan Mandiri
                <ChevronRight size={15} />
              </button>
            </div>
            <span className="badge-red text-xs shrink-0">{activeAlert.severity.toUpperCase()}</span>
          </div>
        )}

        {/* No alert: default header */}
        {!activeAlert && (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-teal-600 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <BookOpen size={15} />
              Portal Literasi Kesehatan Masyarakat
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Informasi Kesehatan
              <span className="block text-teal-600">untuk Warga Mentawai</span>
            </h1>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Panduan pertolongan pertama, pencegahan penyakit, dan cara berobat yang mudah dipahami.
            </p>
          </div>
        )}

        {/* Video tutorial */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-clinical-700 to-teal-600 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-lg">Tutorial Puskesmas Digital</p>
              <p className="text-clinical-200 text-sm mt-0.5">Pelajari cara berobat di sistem baru ini</p>
            </div>
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center gap-2 bg-white text-clinical-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-clinical-50 transition-all shadow-sm"
            >
              <Play size={16} />
              Tonton Sekarang
            </button>
          </div>
        </div>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTag === tag
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Featured articles */}
        {featured.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Artikel Unggulan</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      {DISEASE_ICONS[item.disease_tag] ?? DISEASE_ICONS['Umum']}
                    </div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-teal-700 transition-colors leading-snug mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                    Baca selengkapnya
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direktori A-Z */}
        {regular.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <Search size={14} />
                Arsip Pertolongan Pertama
              </h2>
              <span className="text-xs text-slate-400">{regular.length} artikel</span>
            </div>
            <div className="card divide-y divide-slate-100">
              {regular.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {DISEASE_ICONS[item.disease_tag] ?? DISEASE_ICONS['Umum']}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm group-hover:text-teal-700 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {CATEGORY_LABEL[item.category] ?? item.category} · {item.disease_tag}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors shrink-0 ml-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium">Konten tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain atau pilih kategori berbeda</p>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-200">
          MentawaiCare · Portal Literasi Kesehatan Masyarakat · Konten diverifikasi oleh Dinas Kesehatan Kab. Mentawai
        </div>
      </main>

      {selected && <ArticleModal content={selected} onClose={() => setSelected(null)} />}
      {showVideo && <VideoTutorialModal onClose={() => setShowVideo(false)} />}
    </div>
  );
}
