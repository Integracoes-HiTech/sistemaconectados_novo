// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hihvewjyfjcwhjoerule.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaHZld2p5Zmpjd2hqb2VydWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU1MTAyMCwiZXhwIjoyMDczMTI3MDIwfQ.VupFTs1imopXgiIfuWFjRAq2KutaLmpuNOGX9NqCER8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  name: string
  phone: string
  instagram: string
  city: string
  sector: string
  referrer: string
  registration_date: string
  status: 'Ativo' | 'Inativo'
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  full_name: string
  display_name?: string
  created_at: string
  updated_at: string
}

export interface Stats {
  total_users: number
  active_users: number
  recent_registrations: number
  engagement_rate: number
  today_registrations: number
}
