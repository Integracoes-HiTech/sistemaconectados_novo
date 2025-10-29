// hooks/useSaudePeople.ts
import { useState, useEffect } from 'react';
import { supabaseServerless } from '@/lib/supabase';

export interface SaudePerson {
  id: string;
  lider_nome_completo: string;
  lider_whatsapp: string;
  pessoa_nome_completo: string;
  pessoa_whatsapp: string;
  cep?: string;
  cidade?: string;
  observacoes: string;
  campaign?: string;
  campaign_id?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface NewSaudePerson {
  lider_nome_completo: string;
  lider_whatsapp: string;
  pessoa_nome_completo: string;
  pessoa_whatsapp: string;
  cep?: string;
  cidade?: string;
  observacoes: string;
  campaign?: string;
  campaign_id?: string;
}

export const useSaudePeople = (campaignCode?: string, campaignId?: string | null) => {
  const [people, setPeople] = useState<SaudePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as pessoas da campanha de saúde
  const fetchSaudePeople = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabaseServerless
        .from('people')
        .select('*');

      // IMPORTANTE: Priorizar campaign_id (relacional), mas também filtrar por campaign (texto) para compatibilidade
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      } else if (campaignCode) {
        query = query.eq('campaign', campaignCode);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Filtrar pessoas não excluídas no frontend
      if (Array.isArray(data)) {
        const activePeople = data.filter(person => !person.deleted_at);
        setPeople(activePeople);
      } else {
        setPeople([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar pessoas da saúde:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova pessoa
  const addSaudePerson = async (personData: NewSaudePerson): Promise<SaudePerson | null> => {
    try {

      // OPÇÃO 1: Tentar INSERT direto na tabela
      const { data, error: insertError } = await supabaseServerless
        .from('people')
        .insert([
          {
            lider_nome_completo: personData.lider_nome_completo,
            lider_whatsapp: personData.lider_whatsapp,
            pessoa_nome_completo: personData.pessoa_nome_completo,
            pessoa_whatsapp: personData.pessoa_whatsapp,
            cep: personData.cep || null,
            cidade: personData.cidade || null,
            observacoes: personData.observacoes,
            campaign: personData.campaign || campaignCode,
            campaign_id: personData.campaign_id || campaignId || null
          }
        ])
        .select()
        .single();

      // Se INSERT direto funcionar
      if (!insertError && data) {
        await fetchSaudePeople();
        return data;
      }

      // Se falhar com erro de RLS, tentar usar a function
      if (insertError && insertError.code === '42501') {
        
        // OPÇÃO 2: Usar function que bypassa RLS
        const { data: funcData, error: funcError } = await supabaseServerless
          .rpc('insert_saude_person', {
            p_lider_nome_completo: personData.lider_nome_completo,
            p_lider_whatsapp: personData.lider_whatsapp,
            p_pessoa_nome_completo: personData.pessoa_nome_completo,
            p_pessoa_whatsapp: personData.pessoa_whatsapp,
            p_cep: personData.cep || null,
            p_cidade: personData.cidade || null,
            p_observacoes: personData.observacoes,
          });

        if (funcError) {
          console.error('❌ Erro ao inserir pessoa via function:', funcError);
          throw funcError;
        }

        await fetchSaudePeople();
        return funcData as SaudePerson;
      }

      // Se for outro tipo de erro, lançar
      if (insertError) {
        console.error('❌ Erro ao inserir pessoa:', insertError);
        throw insertError;
      }

      return data;
    } catch (err) {
      console.error('❌ Erro ao adicionar pessoa da saúde:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar pessoa');
      throw err;
    }
  };

  // Verificar se uma pessoa já existe pelo WhatsApp
  const checkPersonExists = async (whatsapp: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('people')
        .select('id')
        .eq('pessoa_whatsapp', whatsapp)
        .is('deleted_at', null)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('❌ Erro ao verificar pessoa existente:', err);
      return false;
    }
  };

  // Verificar se um líder já existe pelo WhatsApp
  const checkLeaderExists = async (whatsapp: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('people')
        .select('id')
        .eq('lider_whatsapp', whatsapp)
        .is('deleted_at', null)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('❌ Erro ao verificar líder existente:', err);
      return false;
    }
  };

  // Soft delete de uma pessoa
  const softDeletePerson = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabaseServerless
        .from('people')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }


      // Atualizar lista local
      await fetchSaudePeople();

      return true;
    } catch (err) {
      console.error('❌ Erro ao deletar pessoa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar pessoa');
      return false;
    }
  };

  // Atualizar uma pessoa
  const updateSaudePerson = async (id: string, updates: Partial<NewSaudePerson>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabaseServerless
        .from('people')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }


      // Atualizar lista local
      await fetchSaudePeople();

      return true;
    } catch (err) {
      console.error('❌ Erro ao atualizar pessoa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pessoa');
      return false;
    }
  };

  // Carregar pessoas ao montar o componente
  useEffect(() => {
    fetchSaudePeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignCode, campaignId]);

  return {
    people,
    loading,
    error,
    addSaudePerson,
    checkPersonExists,
    checkLeaderExists,
    softDeletePerson,
    updateSaudePerson,
    fetchSaudePeople,
  };
};

