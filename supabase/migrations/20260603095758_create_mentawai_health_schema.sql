/*
  # MentawaiCare — Database Schema

  ## Overview
  Core tables for the integrated health portal serving Mentawai Islands.

  ## Tables

  ### 1. disease_hotspots
  Real-time epidemiological data per island/location for heatmap display.
  - id, island_name, location_name, lat, lng, disease_code, disease_name, case_count, severity (low/medium/high/critical), recorded_at

  ### 2. medical_records
  Electronic Medical Records (EMR) per patient visit.
  - id, patient_name, patient_nik, age, gender, blood_pressure, temperature, respiratory_rate, chief_complaint, symptom_duration, attending_staff_id
  - ml_diagnosis_code, ml_diagnosis_name, ml_confidence, ml_recommendation
  - final_diagnosis_code, final_diagnosis_name, disposition (faskes/tele/rujuk), clinician_decision
  - icd10_code, ina_cbg_claimed, referred_to, created_at

  ### 3. triage_logs
  Audit trail for every ML triage event.
  - id, record_id, action (validate/tele/refer/manual), actor_id, note, created_at

  ### 4. system_alerts
  Priority broadcast from Command Center to Literacy Portal.
  - id, disease_name, disease_code, message, severity, is_active, activated_by, created_at

  ### 5. literacy_content
  Educational articles and first-aid content.
  - id, slug, title, category, body_html, thumbnail_url, disease_tag, is_featured, created_at

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read public data; medical staff can insert records
*/

-- ============================================================
-- disease_hotspots
-- ============================================================
CREATE TABLE IF NOT EXISTS disease_hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  island_name text NOT NULL,
  location_name text NOT NULL,
  lat numeric(9,6),
  lng numeric(9,6),
  disease_code text NOT NULL,
  disease_name text NOT NULL,
  case_count integer NOT NULL DEFAULT 0,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disease_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hotspots"
  ON disease_hotspots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hotspots"
  ON disease_hotspots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hotspots"
  ON disease_hotspots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- medical_records
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  patient_nik text,
  age integer,
  gender text CHECK (gender IN ('L', 'P')),
  blood_pressure text,
  temperature numeric(4,1),
  respiratory_rate integer,
  chief_complaint text NOT NULL,
  symptom_duration text,
  attending_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ml_diagnosis_code text,
  ml_diagnosis_name text,
  ml_confidence numeric(5,2),
  ml_recommendation text,
  final_diagnosis_code text,
  final_diagnosis_name text,
  disposition text DEFAULT 'pending' CHECK (disposition IN ('pending', 'faskes', 'tele', 'rujuk', 'manual')),
  clinician_note text,
  ina_cbg_claimed boolean DEFAULT false,
  referred_to text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view records"
  ON medical_records FOR SELECT
  TO authenticated
  USING (auth.uid() = attending_staff_id);

CREATE POLICY "Authenticated can insert records"
  ON medical_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = attending_staff_id);

CREATE POLICY "Authenticated can update own records"
  ON medical_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = attending_staff_id)
  WITH CHECK (auth.uid() = attending_staff_id);

-- ============================================================
-- triage_logs (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS triage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('validate', 'tele', 'refer', 'manual', 'ml_run')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE triage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view triage logs"
  ON triage_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert triage logs"
  ON triage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- ============================================================
-- system_alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name text NOT NULL,
  disease_code text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active boolean DEFAULT true,
  activated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active alerts"
  ON system_alerts FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated can manage alerts"
  ON system_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = activated_by);

CREATE POLICY "Authenticated can update alerts"
  ON system_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- literacy_content
-- ============================================================
CREATE TABLE IF NOT EXISTS literacy_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'umum',
  body_html text DEFAULT '',
  thumbnail_url text DEFAULT '',
  disease_tag text DEFAULT '',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE literacy_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view literacy content"
  ON literacy_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can manage literacy content"
  ON literacy_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update literacy content"
  ON literacy_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed data: disease hotspots
-- ============================================================
INSERT INTO disease_hotspots (island_name, location_name, lat, lng, disease_code, disease_name, case_count, severity) VALUES
  ('Siberut', 'Muara Siberut', -1.5570, 99.1610, 'A09', 'Diare', 47, 'critical'),
  ('Siberut', 'Sikabaluan', -1.0800, 99.0800, 'J06.9', 'ISPA', 23, 'medium'),
  ('Siberut', 'Taileleu', -1.8200, 99.2600, 'B54', 'Malaria', 12, 'high'),
  ('Sipora', 'Sioban', -2.2010, 99.5360, 'A09', 'Diare', 31, 'high'),
  ('Sipora', 'Tua Pejat', -2.1960, 99.5610, 'J06.9', 'ISPA', 18, 'medium'),
  ('Pagai Utara', 'Sikakap', -2.8610, 100.0090, 'B54', 'Malaria', 8, 'medium'),
  ('Pagai Selatan', 'Bulasat', -3.1200, 100.2300, 'A09', 'Diare', 15, 'high'),
  ('Pagai Selatan', 'Malakopa', -3.2500, 100.3100, 'J06.9', 'ISPA', 9, 'low')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed data: literacy content
-- ============================================================
INSERT INTO literacy_content (slug, title, category, disease_tag, is_featured, body_html) VALUES
  ('cara-buat-oralit', 'Cara Membuat Oralit di Rumah', 'pertolongan-pertama', 'Diare', true, '<p>Campurkan 1 sendok teh garam dan 8 sendok teh gula ke dalam 1 liter air matang. Minum sedikit-sedikit setiap 5 menit.</p>'),
  ('kapan-ke-puskesmas', 'Kapan Harus ke Puskesmas?', 'panduan', 'Umum', true, '<p>Segera ke puskesmas jika demam >38.5°C lebih dari 3 hari, sesak napas, tidak bisa minum, atau ada darah pada tinja/urin.</p>'),
  ('pencegahan-ispa', 'Pencegahan ISPA di Musim Hujan', 'edukasi', 'ISPA', false, '<p>Gunakan masker, cuci tangan rutin, hindari tempat ramai, dan pastikan ventilasi rumah baik.</p>'),
  ('mengenal-malaria', 'Mengenal Malaria dan Cara Mencegahnya', 'edukasi', 'Malaria', false, '<p>Tidur menggunakan kelambu, pakai losion anti nyamuk, dan segera periksa jika demam menggigil setelah bepergian ke hutan.</p>'),
  ('alur-berobat-digital', 'Cara Pakai Puskesmas Digital', 'tutorial', 'Umum', true, '<p>Datang ke puskesmas, serahkan KTP/KIS, tunggu antrian digital, dan dokter akan memasukkan data ke sistem. Anda akan mendapat resume digital.</p>'),
  ('diare-anak', 'Penanganan Diare pada Anak', 'pertolongan-pertama', 'Diare', false, '<p>Tetap beri ASI, berikan oralit setiap habis BAB, pantau tanda dehidrasi (mata cekung, menangis tanpa air mata), dan bawa ke puskesmas jika tidak membaik dalam 24 jam.</p>'),
  ('demam-berdarah', 'Waspada Demam Berdarah', 'edukasi', 'DBD', false, '<p>3M Plus: Menguras bak air, Menutup tempat penampungan air, Mendaur ulang barang bekas. Gunakan lotion anti nyamuk dan pasang kawat kasa.</p>'),
  ('luka-ringan', 'Pertolongan Pertama Luka Ringan', 'pertolongan-pertama', 'Trauma', false, '<p>Bersihkan luka dengan air bersih mengalir, tutup dengan plester steril, hindari menekan luka kotor, dan ganti perban setiap hari.</p>')
ON CONFLICT DO NOTHING;
