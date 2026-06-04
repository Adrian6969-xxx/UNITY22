import { useState } from 'react';
import {
  X, Loader2, CheckCircle, AlertTriangle, Phone, ArrowRightCircle, Edit3,
  Zap, FileText, ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  patientName: string;
  patientNik: string;
  age: string;
  gender: 'L' | 'P' | '';
  bloodPressure: string;
  temperature: string;
  respiratoryRate: string;
  chiefComplaint: string;
  symptomDuration: string;
}

interface TriageResult {
  icdCode: string;
  diagnosisName: string;
  confidence: number;
  recommendation: string;
  disposition: 'faskes' | 'tele' | 'rujuk';
}

// Rule-based ML simulation aligned with PPK Faskes 1 Kemenkes
function runMLTriage(form: FormData): TriageResult {
  const complaint = form.chiefComplaint.toLowerCase();
  const temp = parseFloat(form.temperature) || 0;
  const rr = parseInt(form.respiratoryRate) || 0;

  if (complaint.includes('diare') || complaint.includes('mencret') || complaint.includes('bab cair')) {
    return {
      icdCode: 'A09',
      diagnosisName: 'Gastroenteritis non-spesifik (Diare)',
      confidence: 89,
      recommendation: 'Rehidrasi oral, Zinc 10mg/hari, Oralit. Tuntas di Faskes.',
      disposition: 'faskes',
    };
  }
  if (rr > 24 || (complaint.includes('sesak') && temp > 38)) {
    return {
      icdCode: 'J18.9',
      diagnosisName: 'Pneumonia, tidak terspesifikasi',
      confidence: 82,
      recommendation: 'Pertimbangkan rujukan. Monitoring SpO2 dan foto toraks.',
      disposition: 'rujuk',
    };
  }
  if (complaint.includes('malaria') || complaint.includes('menggigil') || complaint.includes('demam hutan')) {
    return {
      icdCode: 'B54',
      diagnosisName: 'Malaria tanpa komplikasi',
      confidence: 78,
      recommendation: 'RDT Malaria, jika positif: ACT sesuai protokol Kemenkes.',
      disposition: 'faskes',
    };
  }
  if (complaint.includes('batuk') || complaint.includes('pilek') || complaint.includes('flu')) {
    return {
      icdCode: 'J06.9',
      diagnosisName: 'Infeksi Saluran Napas Atas Akut, tidak terspesifikasi (ISPA)',
      confidence: 92,
      recommendation: 'Simptomatik: Parasetamol, madu, edukasi higiene. Tuntas di Faskes.',
      disposition: 'faskes',
    };
  }
  if (complaint.includes('luka') || complaint.includes('trauma') || complaint.includes('jatuh')) {
    return {
      icdCode: 'T14.9',
      diagnosisName: 'Cedera tidak terspesifikasi pada lokasi tidak terspesifikasi',
      confidence: 74,
      recommendation: 'Evaluasi klinis lanjut. Pertimbangkan konsultasi spesialis bedah.',
      disposition: 'tele',
    };
  }
  if (temp > 39.5) {
    return {
      icdCode: 'R50.9',
      diagnosisName: 'Demam tidak terspesifikasi',
      confidence: 71,
      recommendation: 'Antipiretik, hidrasi. Pantau 24 jam, pertimbangkan konsultasi spesialis.',
      disposition: 'tele',
    };
  }
  return {
    icdCode: 'J06.9',
    diagnosisName: 'Infeksi Saluran Napas Atas Akut, tidak terspesifikasi (ISPA)',
    confidence: 92,
    recommendation: 'Simptomatik: Parasetamol, madu, edukasi higiene. Tuntas di Faskes.',
    disposition: 'faskes',
  };
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  staffId: string;
}

export default function EMRForm({ onClose, onSaved, staffId }: Props) {
  const [form, setForm] = useState<FormData>({
    patientName: '', patientNik: '', age: '', gender: '',
    bloodPressure: '', temperature: '', respiratoryRate: '',
    chiefComplaint: '', symptomDuration: '',
  });
  const [step, setStep] = useState<'form' | 'running' | 'result' | 'manual'>('form');
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key: keyof FormData, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function runTriage() {
    setStep('running');
    await new Promise((r) => setTimeout(r, 1800));
    const result = runMLTriage(form);
    setTriage(result);
    setStep('result');
  }

  async function saveRecord(
    disposition: 'faskes' | 'tele' | 'rujuk' | 'manual',
    overrideDiagCode?: string,
    overrideDiagName?: string,
  ) {
    setSaving(true);
    const { data: rec, error } = await supabase
      .from('medical_records')
      .insert({
        patient_name: form.patientName,
        patient_nik: form.patientNik,
        age: parseInt(form.age) || null,
        gender: form.gender || null,
        blood_pressure: form.bloodPressure,
        temperature: parseFloat(form.temperature) || null,
        respiratory_rate: parseInt(form.respiratoryRate) || null,
        chief_complaint: form.chiefComplaint,
        symptom_duration: form.symptomDuration,
        attending_staff_id: staffId,
        ml_diagnosis_code: triage?.icdCode ?? null,
        ml_diagnosis_name: triage?.diagnosisName ?? null,
        ml_confidence: triage?.confidence ?? null,
        ml_recommendation: triage?.recommendation ?? null,
        final_diagnosis_code: overrideDiagCode ?? triage?.icdCode ?? null,
        final_diagnosis_name: overrideDiagName ?? triage?.diagnosisName ?? null,
        disposition,
        ina_cbg_claimed: disposition === 'faskes',
        referred_to: disposition === 'rujuk' ? 'RSUD Tuapejat' : null,
      })
      .select('id')
      .single();

    if (!error && rec) {
      await supabase.from('triage_logs').insert({
        record_id: rec.id,
        action: disposition === 'manual' ? 'manual' : disposition === 'rujuk' ? 'refer' : disposition === 'tele' ? 'tele' : 'validate',
        actor_id: staffId,
        note: disposition === 'rujuk' ? 'Rujuk ke RSUD Tuapejat via notifikasi HL7 FHIR' : '',
      });
    }
    setSaving(false);
    onSaved();
  }

  const dispositionColor = {
    faskes: 'emerald',
    tele: 'amber',
    rujuk: 'red',
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileText className="text-clinical-600" size={20} />
            <div>
              <p className="font-bold text-slate-800">Formulir Rekam Medis Elektronik</p>
              <p className="text-xs text-slate-400">Standar Kemenkes · Berstandar PPK Faskes 1</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        {step === 'form' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nama Pasien</label>
                <input
                  value={form.patientName} onChange={(e) => set('patientName', e.target.value)}
                  placeholder="Nama lengkap" required
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">NIK (opsional)</label>
                <input
                  value={form.patientNik} onChange={(e) => set('patientNik', e.target.value)}
                  placeholder="16 digit NIK"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Usia</label>
                <input
                  value={form.age} onChange={(e) => set('age', e.target.value)}
                  placeholder="Tahun" type="number"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Jenis Kelamin</label>
              <div className="flex gap-3">
                {(['L', 'P'] as const).map((g) => (
                  <button
                    key={g} type="button"
                    onClick={() => set('gender', g)}
                    className={`flex-1 py-2.5 text-sm rounded-lg border font-medium transition-all ${
                      form.gender === g
                        ? 'bg-clinical-600 text-white border-clinical-600'
                        : 'border-slate-200 text-slate-600 hover:border-clinical-400'
                    }`}
                  >
                    {g === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tekanan Darah</label>
                <input
                  value={form.bloodPressure} onChange={(e) => set('bloodPressure', e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Suhu Tubuh</label>
                <input
                  value={form.temperature} onChange={(e) => set('temperature', e.target.value)}
                  placeholder="36.5 °C" type="number" step="0.1"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Frek. Napas</label>
                <input
                  value={form.respiratoryRate} onChange={(e) => set('respiratoryRate', e.target.value)}
                  placeholder="18 x/mnt" type="number"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Keluhan Utama</label>
              <textarea
                value={form.chiefComplaint} onChange={(e) => set('chiefComplaint', e.target.value)}
                placeholder="Deskripsikan keluhan pasien (mis: batuk 3 hari, pilek, demam ringan)"
                required rows={3}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Lama Gejala</label>
              <input
                value={form.symptomDuration} onChange={(e) => set('symptomDuration', e.target.value)}
                placeholder="Mis: 3 hari"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>

            <button
              onClick={runTriage}
              disabled={!form.patientName || !form.chiefComplaint}
              className="w-full flex items-center justify-center gap-2.5 bg-clinical-600 hover:bg-clinical-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Zap size={18} />
              Jalankan Mesin Triase Cerdas
            </button>
          </div>
        )}

        {/* Running */}
        {step === 'running' && (
          <div className="p-12 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-clinical-50 border-4 border-clinical-200 flex items-center justify-center">
              <Loader2 className="text-clinical-600 animate-spin" size={28} />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-lg">Memproses Data Klinis...</p>
              <p className="text-slate-400 text-sm mt-1">Mesin Triase sedang mencocokkan gejala dengan PPK Kemenkes & ICD-10</p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-clinical-500 rounded-full animate-[progress_1.8s_ease-in-out_forwards]"
                style={{ animation: 'width 1.8s ease-in-out forwards', width: '100%' }} />
            </div>
          </div>
        )}

        {/* Triage Result */}
        {step === 'result' && triage && (
          <div className="p-6 space-y-5">
            <div className={`rounded-xl border-2 p-5 ${
              triage.disposition === 'faskes'
                ? 'border-emerald-300 bg-emerald-50'
                : triage.disposition === 'tele'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnosis Prediktif</p>
                  <p className="font-bold text-slate-900 text-lg">[{triage.icdCode}] {triage.diagnosisName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-clinical-600">{triage.confidence}%</div>
                  <div className="text-xs text-slate-500">Probabilitas</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-700 bg-white/70 rounded-lg px-3.5 py-3">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <span><strong>Basis Aturan:</strong> PPK Kemenkes Faskes 1 · <strong>Rekomendasi:</strong> {triage.recommendation}</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Otorisasi Keputusan Dokter</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => saveRecord('faskes')}
                disabled={saving}
                className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3.5 rounded-xl transition-all text-sm"
              >
                <CheckCircle size={17} />
                <div className="text-left">
                  <div className="font-bold">Validasi & Generate INA-CBG</div>
                  <div className="text-emerald-200 text-xs">Tuntas di Faskes · Klaim BPJS</div>
                </div>
              </button>

              <button
                onClick={() => saveRecord('tele')}
                disabled={saving}
                className="flex items-center gap-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-3.5 rounded-xl transition-all text-sm"
              >
                <Phone size={17} />
                <div className="text-left">
                  <div className="font-bold">Minta Tele-Expertise</div>
                  <div className="text-amber-100 text-xs">Ping spesialis RSUD Mentawai</div>
                </div>
              </button>

              <button
                onClick={() => saveRecord('rujuk')}
                disabled={saving}
                className="flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3.5 rounded-xl transition-all text-sm"
              >
                <ArrowRightCircle size={17} />
                <div className="text-left">
                  <div className="font-bold">Otorisasi Rujukan Fisik</div>
                  <div className="text-red-200 text-xs">Ping RSUD Tuapejat via FHIR</div>
                </div>
              </button>

              <button
                onClick={() => setStep('manual')}
                className="flex items-center gap-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold px-4 py-3.5 rounded-xl transition-all text-sm"
              >
                <Edit3 size={17} />
                <div className="text-left">
                  <div className="font-bold">Koreksi Diagnosis Manual</div>
                  <div className="text-slate-400 text-xs">Abaikan hasil ML</div>
                </div>
              </button>
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-sm text-clinical-600 py-2">
                <Loader2 size={16} className="animate-spin" />
                Menyimpan rekam medis...
              </div>
            )}
          </div>
        )}

        {/* Manual override */}
        {step === 'manual' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
              <ShieldAlert size={16} className="text-slate-500 shrink-0" />
              Mode koreksi manual: Hasil ML diabaikan. Kendali penuh ada di tangan dokter.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Kode ICD-10 Manual</label>
              <input
                value={manualCode} onChange={(e) => setManualCode(e.target.value)}
                placeholder="Mis: J18.9"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nama Diagnosis</label>
              <input
                value={manualName} onChange={(e) => setManualName(e.target.value)}
                placeholder="Nama diagnosis sesuai ICD-10"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('result')}
                className="flex-1 btn-secondary"
              >
                Kembali
              </button>
              <button
                onClick={() => saveRecord('manual', manualCode, manualName)}
                disabled={!manualCode || !manualName || saving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Diagnosis Manual'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
