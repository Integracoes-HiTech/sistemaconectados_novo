// lib/supabase.ts
// Usar cliente serverless para maior segurança

export { supabase, supabaseServerless } from './k9m7x2'

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
  campaign?: string
  campaign_id?: string | null
  plano_id?: string | null
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
