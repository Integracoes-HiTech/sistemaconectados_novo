// hooks/useCredentials.ts
import { useState } from 'react'
import { supabaseServerless, AuthUser } from '@/lib/supabase'

export interface Credentials {
  username: string
  password: string
  login_url: string
}

export const useCredentials = () => {
  const [loading, setLoading] = useState(false)

  // Gerar credenciais automáticas baseadas no Instagram e telefone
  const generateCredentials = (userData: { instagram: string; phone: string }): Credentials => {
    // Username: sempre o Instagram (sem @)
    const username = userData.instagram.replace('@', '')
    
    // Senha: telefone sem DDD e sem o primeiro 9
    let phoneNumber = userData.phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if (phoneNumber.length >= 11) {
      // Remove DDD (primeiros 2 dígitos) e o primeiro 9
      phoneNumber = phoneNumber.substring(2); // Remove DDD
      if (phoneNumber.startsWith('9')) {
        phoneNumber = phoneNumber.substring(1); // Remove o primeiro 9
      }
    }
    const password = phoneNumber;
    
    return {
      username,
      password,
      login_url: `${window.location.origin}/login`
    }
  }

  // Criar usuário de autenticação com credenciais geradas
  const createAuthUser = async (userData: { name: string; instagram: string; phone: string; referrer?: string; display_name?: string; campaign?: string }, credentials: Credentials) => {
    try {
      setLoading(true)

      // Verificar se a fase de contratos pagos está ativa
      const { data: phaseData } = await supabaseServerless
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
        const { data: referrerData } = await supabaseServerless
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
        instagram: userData.instagram,
        phone: userData.phone,
        is_active: true, // Usuários criados ficam ativos por padrão
        campaign: userData.campaign || 'A' // Usar campanha do usuário ou padrão A
      }

      const { data, error } = await supabaseServerless
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
      const { data, error } = await supabaseServerless
        .from('auth_users')
        .select('username')
        .eq('username', username)

      if (error) {
        return { exists: false, error: error.message }
      }
      
      const exists = data && Array.isArray(data) && data.length > 0;
      
      return { exists }
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
  const createUserWithCredentials = async (userData: { name: string; instagram: string; phone: string; referrer?: string; display_name?: string; campaign?: string }): Promise<{
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