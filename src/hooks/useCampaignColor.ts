import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useCampaignColor = (campaignCode?: string) => {
  const [campaignColor, setCampaignColor] = useState('#14446C'); // Cor padrão
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCampaignColor = async () => {
      try {
        setLoading(true);
        
        // Tentar buscar do localStorage primeiro (mais rápido)
        const loggedUser = localStorage.getItem('loggedUser');
        let codeToUse = campaignCode;
        
        if (!codeToUse && loggedUser) {
          try {
            const userData = JSON.parse(loggedUser);
            codeToUse = userData.campaign;
          } catch (err) {
            console.error('Erro ao parsear localStorage:', err);
          }
        }
        
        console.log('🎨 useCampaignColor - Buscando cor para campanha:', codeToUse);
        
        if (codeToUse) {
          const { data: campaignData, error } = await supabase
            .from('campaigns')
            .select('primary_color')
            .eq('code', codeToUse)
            .single();

          console.log('🎨 useCampaignColor - Dados da campanha:', { campaignData, error });

          if (!error && campaignData?.primary_color) {
            console.log('🎨 useCampaignColor - Cor encontrada:', campaignData.primary_color);
            setCampaignColor(campaignData.primary_color);
          } else {
            console.log('🎨 useCampaignColor - Usando cor padrão:', '#14446C');
            setCampaignColor('#14446C');
          }
        } else {
          console.log('🎨 useCampaignColor - Nenhuma campanha encontrada, usando padrão');
          setCampaignColor('#14446C');
        }
      } catch (err) {
        console.error('Erro ao buscar cor da campanha:', err);
        setCampaignColor('#14446C');
      } finally {
        setLoading(false);
      }
    };

    // Executar imediatamente
    fetchCampaignColor();
  }, [campaignCode]);

  // Executar também quando o componente monta (backup)
  useEffect(() => {
    const fetchFromStorage = async () => {
      try {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          const codeToUse = userData.campaign;
          
          if (codeToUse) {
            const { data: campaignData, error } = await supabase
              .from('campaigns')
              .select('primary_color')
              .eq('code', codeToUse)
              .single();

            if (!error && campaignData?.primary_color) {
              console.log('🎨 useCampaignColor - Cor do localStorage:', campaignData.primary_color);
              setCampaignColor(campaignData.primary_color);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar cor do localStorage:', err);
      }
    };

    fetchFromStorage();
  }, []); // Executar apenas uma vez no mount

  console.log('🎨 useCampaignColor - Retornando cor:', campaignColor);

  return { campaignColor, loading };
};
