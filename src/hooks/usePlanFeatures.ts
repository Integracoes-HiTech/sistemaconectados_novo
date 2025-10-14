import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
      if (!user?.campaign) {
        setLoading(false);
        return;
      }

      try {
        // 🚀 OTIMIZAÇÃO: Buscar apenas nome_plano primeiro para renderização rápida
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('nome_plano, plano_id')
          .eq('code', user.campaign)
          .single();

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
        const isBLuxoPlan = planNameLower.includes('b luxo') || planNameLower.includes('plano b luxo');
        const isValterPlan = planNameLower.includes('valter');
        const isSaudePlan = planNameLower.includes('saúde') || planNameLower.includes('saude');
        
        // 🚀 OTIMIZAÇÃO: Calcular features básicas IMEDIATAMENTE sem esperar plano_id
        const basicFeatures: PlanFeatures = {
          canViewReports: !isFreePlan && !isEssentialPlan,
          canViewMap: isAdvancedPlan,
          canGenerateLinks: true,
          canRegisterMembers: true,
          canRegisterFriends: true,
          canExport: !isFreePlan && !isEssentialPlan,
          canViewRecentRegistrations: !isFreePlan,
          canViewTopMembers: isValterPlan || isBLuxoPlan,
          canViewColorCards: isBLuxoPlan || isValterPlan,
          canViewRankingColumns: isBLuxoPlan || isValterPlan,
          maxMembers: isFreePlan ? 25 : (isEssentialPlan ? 100 : (isProfessionalPlan ? 250 : (isValterPlan ? 1500 : (isSaudePlan ? 999999 : (isBLuxoPlan ? 1500 : ((isAdvancedPlan) ? 999999 : 500)))))),
          maxFriends: isFreePlan ? 25 : (isEssentialPlan ? 100 : (isProfessionalPlan ? 250 : (isValterPlan ? 22500 : (isSaudePlan ? 999999 : (isBLuxoPlan ? 22500 : 999999))))),
          planName,
          planId: campaignData.plano_id
        };

        // 🚀 OTIMIZAÇÃO: Setar features básicas IMEDIATAMENTE
        setFeatures(basicFeatures);
        setLoading(false);
        
        console.log('🔍 Debug Plan Features:', {
          campaignCode: user.campaign,
          planName,
          planNameLower,
          isFreePlan,
          isEssentialPlan,
          isProfessionalPlan,
          isAdvancedPlan,
          isBLuxoPlan,
          isValterPlan,
          isSaudePlan
        });
        
        // 🚀 OTIMIZAÇÃO: Buscar detalhes do plano em background (se necessário)
        // Isso NÃO bloqueia a renderização
        let planAmount = 500;
        let planMaxMembers = 500;
        
        if (campaignData.plano_id) {
          try {
            const { data: planData } = await supabase
              .from('planos_precos')
              .select('amount, max_members')
              .eq('id', campaignData.plano_id)
              .single();
            
            if (planData) {
              planAmount = planData.amount || 1500;
              planMaxMembers = planData.max_members || 1500;
            }
          } catch (planError) {
            console.log('Plano não encontrado, usando valores padrão');
          }
        }
        
        console.log('🎯 Plan Features Calculated:', {
          maxMembers: basicFeatures.maxMembers,
          maxFriends: basicFeatures.maxFriends,
          canRegisterMembers: basicFeatures.canRegisterMembers,
          canRegisterFriends: basicFeatures.canRegisterFriends,
          planName: basicFeatures.planName
        });

      } catch (error) {
        console.error('Erro ao buscar funcionalidades do plano:', error);
        setLoading(false);
      }
    };

    fetchPlanFeatures();
  }, [user?.campaign]);

  return { features, loading };
}
