// hooks/useCredentials.ts
import { useState } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'

export interface Credentials {
  username: string
  password: string
  login_url: string
}

export const useCredentials = () => {
  const [loading, setLoading] = useState(false)

  // Gerar credenciais automáticas baseadas no Instagram e telefone
  const generateCredentials = (userData: { instagram: string; phone: string }): Credentials => {
    // Username baseado no Instagram (sem @)
    const username = userData.instagram.replace('@', '').toLowerCase()
    
    // Senha baseada no Instagram + últimos 4 dígitos do telefone
    const instagramClean = userData.instagram.replace('@', '').toLowerCase()
    const phoneDigits = userData.phone.replace(/\D/g, '') // Remove caracteres não numéricos
    const lastDigits = phoneDigits.slice(-4) // Últimos 4 dígitos
    const password = `${instagramClean}${lastDigits}` // Ex: joaosilva4321
    
    return {
      username,
      password,
      login_url: `${window.location.origin}/login`
    }
  }

  // Criar usuário de autenticação com credenciais geradas
  const createAuthUser = async (userData: { name: string; instagram: string; phone: string; referrer?: string; display_name?: string }, credentials: Credentials) => {
    try {
      setLoading(true)

      // Verificar se a fase de contratos pagos está ativa
      const { data: phaseData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'paid_contracts_phase_active')
        .single();

      const isPaidContractsPhaseActive = phaseData?.setting_value === 'true';

      // Determinar role baseado no referrer e na fase ativa
      let userRole = 'Membro'; // Padrão: sempre Membro
      let fullName = `${userData.name} - Membro`;

      // Se tem referrer, verificar o role do referrer
      if (userData.referrer) {
        // Buscar dados do referrer para determinar role
        const { data: referrerData } = await supabase
          .from('auth_users')
          .select('role, name')
          .eq('full_name', userData.referrer)
          .single();

        if (referrerData) {
          // Se referrer é Administrador, usuário é Membro
          if (referrerData.role === 'Administrador') {
            userRole = 'Membro';
            fullName = `${userData.name} - Membro`;
          }
          // Se referrer é Membro, usuário pode ser Amigo (mas só se a fase estiver ativa)
          else if (referrerData.role === 'Membro') {
            if (isPaidContractsPhaseActive) {
              userRole = 'Amigo';
              fullName = `${userData.name} - Amigo`;
            } else {
              // Fase inativa: membros cadastram membros
              userRole = 'Membro';
              fullName = `${userData.name} - Membro`;
            }
          }
          // Se referrer é Amigo, usuário é Membro (não há mais Convidado)
          else if (referrerData.role === 'Amigo') {
            userRole = 'Membro';
            fullName = `${userData.name} - Membro`;
          }
        }
      }

      const authUserData = {
        username: credentials.username,
        password: credentials.password,
        name: userData.name,
        role: userRole,
        full_name: fullName,
        display_name: userData.display_name || null,
        instagram: userData.instagram,
        phone: userData.phone,
        is_active: false // ← MUDANÇA: Status inativo por padrão
      }

      const { data, error } = await supabase
        .from('auth_users')
        .insert([authUserData])
        .select()

      if (error) throw error

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar usuário de autenticação' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Verificar se username já existe
  const checkUsernameExists = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      
      return { exists: !!data }
    } catch (err) {
      return { 
        exists: false, 
        error: err instanceof Error ? err.message : 'Erro ao verificar username' 
      }
    }
  }

  // Gerar username único
  const generateUniqueUsername = async (baseUsername: string) => {
    let username = baseUsername
    let counter = 1

    while (true) {
      const { exists } = await checkUsernameExists(username)
      if (!exists) break
      
      username = `${baseUsername}${counter}`
      counter++
    }

    return username
  }

  // Processo completo: gerar credenciais únicas e criar usuário
  const createUserWithCredentials = async (userData: { name: string; instagram: string; phone: string; referrer?: string; display_name?: string }): Promise<{
    success: true;
    credentials: Credentials;
    authUser: unknown;
  } | {
    success: false;
    error: string;
  }> => {
    try {
      setLoading(true)

      // Gerar credenciais base
      const baseCredentials = generateCredentials(userData)
      
      // Garantir username único
      const uniqueUsername = await generateUniqueUsername(baseCredentials.username)
      
      const finalCredentials = {
        ...baseCredentials,
        username: uniqueUsername
      }

      // Criar usuário de autenticação
      const authResult = await createAuthUser(userData, finalCredentials)
      
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Erro ao criar usuário de autenticação'
        }
      }

      return { 
        success: true, 
        credentials: finalCredentials,
        authUser: authResult.data
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar usuário com credenciais' 
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    generateCredentials,
    createAuthUser,
    checkUsernameExists,
    generateUniqueUsername,
    createUserWithCredentials
  }
}