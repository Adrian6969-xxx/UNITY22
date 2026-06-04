import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DiseaseHotspot {
  id: string;
  island_name: string;
  location_name: string;
  lat: number;
  lng: number;
  disease_code: string;
  disease_name: string;
  case_count: number;
  severity: Severity;
  recorded_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_name: string;
  patient_nik: string;
  age: number;
  gender: 'L' | 'P';
  blood_pressure: string;
  temperature: number;
  respiratory_rate: number;
  chief_complaint: string;
  symptom_duration: string;
  attending_staff_id: string;
  ml_diagnosis_code: string;
  ml_diagnosis_name: string;
  ml_confidence: number;
  ml_recommendation: string;
  final_diagnosis_code: string;
  final_diagnosis_name: string;
  disposition: 'pending' | 'faskes' | 'tele' | 'rujuk' | 'manual';
  clinician_note: string;
  ina_cbg_claimed: boolean;
  referred_to: string;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  disease_name: string;
  disease_code: string;
  message: string;
  severity: Severity;
  is_active: boolean;
  created_at: string;
}

export interface LiteracyContent {
  id: string;
  slug: string;
  title: string;
  category: string;
  body_html: string;
  thumbnail_url: string;
  disease_tag: string;
  is_featured: boolean;
  created_at: string;
}
