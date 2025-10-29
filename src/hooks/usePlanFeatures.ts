import { useState, useEffect } from 'react';
import { supabaseServerless } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface PlanFeatures {
  canViewReports: boolean;
  canViewMap: boolean;
  canGenerateLinks: boolean;
  canRegisterMembers: boolean;
  canRegisterFriends: boolean;
  canExport: boolean; // Pode exportar relatórios (Excel, PDF)
  canViewRecentRegistrations: boolean; // Pode ver apenas cadastros recentes (plano Essencial)
  canViewTopMembers: boolean; // Pode ver Top 5 membros (apenas Avançado)
  canViewColorCards: boolean; // Pode ver cards de cores (apenas Avançado)
  canViewRankingColumns: boolean; // Pode ver colunas de ranking (apenas Avançado)
  maxMembers: number;
  maxFriends: number; // Limite de amigos para plano gratuito
  planName: string;
  planId: string | null;
}

export function usePlanFeatures() {
  const [features, setFeatures] = useState<PlanFeatures>({
    canViewReports: false,
    canViewMap: false,
    canGenerateLinks: true,
    canRegisterMembers: true,
    canRegisterFriends: true,
    canExport: true,
    canViewRecentRegistrations: false,
    canViewTopMembers: false,
    canViewColorCards: false,
    canViewRankingColumns: false,
    maxMembers: 500,
    maxFriends: 999999, // Ilimitado para planos pagos
    planName: 'Profissional',
    planId: null
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlanFeatures = async () => {
      // Usar campaign_id se disponível, caso contrário usar campaign (texto) para compatibilidade
      if (!user?.campaign_id && !user?.campaign) {
        setLoading(false);
        return;
      }

      try {
        // 🚀 OTIMIZAÇÃO: Buscar apenas nome_plano primeiro para renderização rápida
        let campaignData: any = null;
        let campaignError: any = null;
        
        // Tentar buscar por campaign_id primeiro (relacional)
        if (user?.campaign_id) {
          const result = await supabaseServerless
            .from('campaigns')
            .select('nome_plano, plano_id')
            .eq('id', user.campaign_id)
            .single();
          
          campaignData = result.data;
          campaignError = result.error;
        } 
        
        // Se não encontrou por campaign_id ou não tem campaign_id, tentar por código
        if (campaignError && user?.campaign) {
          const result = await supabaseServerless
            .from('campaigns')
            .select('nome_plano, plano_id')
            .eq('code', user.campaign)
            .single();
          
          campaignData = result.data;
          campaignError = result.error;
        }

        if (campaignError) {
          console.error('Erro ao buscar dados da campanha:', campaignError);
          setLoading(false);
          return;
        }

        const planName = campaignData.nome_plano || 'Profissional';
        const planNameLower = planName.toLowerCase();
        const isFreePlan = planNameLower.includes('gratuito');
        const isAdvancedPlan = planNameLower.includes('avançado') || planNameLower.includes('avancado');
        const isEssentialPlan = planNameLower.includes('essencial');
        const isProfessionalPlan = planNameLower.includes('profissional');
        // Plano A e Plano B (que era Plano B Luxo) - mesmas features
        const isPlanA = planNameLower.includes('plano a') || planNameLower === 'a';
        const isPlanB = planNameLower.includes('plano b') || planNameLower.includes('b luxo') || planNameLower.includes('plano b luxo');
        const isSaudePlan = planNameLower.includes('pessoas');
        
        // Plano A e Plano B têm as mesmas features
        const isPlanAOrB = isPlanA || isPlanB;
        
        // 🚀 OTIMIZAÇÃO: Calcular features básicas IMEDIATAMENTE sem esperar plano_id
        const basicFeatures: PlanFeatures = {
          canViewReports: !isFreePlan && !isEssentialPlan,
          canViewMap: isAdvancedPlan,
          canGenerateLinks: true,
          canRegisterMembers: true,
          canRegisterFriends: true,
          canExport: !isFreePlan && !isEssentialPlan,
          canViewRecentRegistrations: !isFreePlan,
          // Plano A e Plano B têm acesso a: Top 100 membros, posição, contratos, status
          canViewTopMembers: isPlanAOrB,
          canViewColorCards: isPlanAOrB,
          canViewRankingColumns: isPlanAOrB,
          // Plano A e Plano B: 1500 membros, 22500 amigos
          maxMembers: isFreePlan ? 25 : (isEssentialPlan ? 1000 : (isProfessionalPlan ? 2500 : (isPlanAOrB ? 1500 : (isSaudePlan ? 999999 : ((isAdvancedPlan) ? 999999 : 500))))),
          maxFriends: isFreePlan ? 25 : (isEssentialPlan ? 1000 : (isProfessionalPlan ? 2500 : (isPlanAOrB ? 22500 : (isSaudePlan ? 999999 : 999999)))),
          planName,
          planId: campaignData.plano_id
        };

        // 🚀 OTIMIZAÇÃO: Setar features básicas IMEDIATAMENTE
        setFeatures(basicFeatures);
        setLoading(false);
        
        // 🚀 OTIMIZAÇÃO: Buscar detalhes do plano em background (se necessário)
        // Isso NÃO bloqueia a renderização
        let planAmount = 500;
        let planMaxMembers = 500;
        
        if (campaignData.plano_id) {
          try {
            const { data: planData, error: planError } = await supabaseServerless
              .from('planos_precos')
              .select('amount, max_members')
              .eq('id', campaignData.plano_id)
              .single();
            
            if (planError) {
              console.warn('Erro ao buscar dados do plano (não crítico):', planError);
            } else if (planData) {
              planAmount = planData.amount || 1500;
              planMaxMembers = planData.max_members || 1500;
            }
          } catch (planError) {
            console.warn('Erro ao buscar dados do plano (não crítico):', planError);
          }
        }
        

      } catch (error) {
        console.error('Erro ao buscar funcionalidades do plano:', error);
        setLoading(false);
      }
    };

    fetchPlanFeatures();
  }, [user?.campaign, user?.campaign_id]);

  return { features, loading };
}
