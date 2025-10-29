import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabaseServerless } from '@/lib/supabase';

// Função para buscar cor inicial da campanha ANTES de renderizar
const getInitialCampaignColor = (): string => {
  try {
    const loggedUser = localStorage.getItem('loggedUser');
    if (loggedUser) {
      const userData = JSON.parse(loggedUser);
      const campaignCode = userData.campaign;
      
      // Tentar buscar do localStorage se já foi salvo antes
      const savedColor = localStorage.getItem(`campaign_color_${campaignCode}`);
      if (savedColor) {
        return savedColor;
      }
    }
  } catch (err) {
    console.error('Erro ao buscar cor inicial:', err);
  }
  return '#14446C'; // Cor padrão
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, canModifyLinkTypes, loading: authLoading } = useAuth();
  const { features: planFeatures } = usePlanFeatures();
  const [campaignColor, setCampaignColor] = useState(getInitialCampaignColor());
  const [quickPlanInfo, setQuickPlanInfo] = useState<{planName: string, maxMembers: number, maxFriends: number} | null>(null);
  
  // Buscar dados do usuário do localStorage para exibição imediata
  const [quickUserData, setQuickUserData] = useState<{name: string, role: string} | null>(() => {
    try {
      const loggedUser = localStorage.getItem('loggedUser');
      if (loggedUser) {
        const userData = JSON.parse(loggedUser);
        return {
          name: userData.name || userData.display_name || 'Usuário',
          role: userData.role || 'Membro'
        };
      }
    } catch (err) {
      console.error('Erro ao buscar dados rápidos do usuário:', err);
    }
    return null;
  });

  // Buscar cor da campanha imediatamente do localStorage
  useEffect(() => {
    
    const fetchCampaignColorFromStorage = async () => {
      try {
        
        // Tentar buscar do localStorage primeiro
        const loggedUser = localStorage.getItem('loggedUser');
        
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          const campaignCode = userData.campaign;
          
          if (campaignCode) {
            const { data: campaignData, error } = await supabaseServerless
              .from('campaigns')
              .select('primary_color')
              .eq('code', campaignCode)
              .single();

            if (!error && campaignData?.primary_color) {
              // Salvar no localStorage para próxima vez
              localStorage.setItem(`campaign_color_${campaignCode}`, campaignData.primary_color);
              setCampaignColor(campaignData.primary_color);
              return;
            }
          }
        }
      } catch (err) {
        console.error('🎨 Settings - Erro ao buscar cor do localStorage:', err);
      }
      
      // Se não conseguir do localStorage, manter cor padrão
      setCampaignColor('#14446C');
    };

    // Executar imediatamente
    fetchCampaignColorFromStorage();
  }, []); // Executar apenas uma vez no mount

  // Log da cor atual

  // Buscar informações do plano rapidamente
  useEffect(() => {
    const fetchQuickPlanInfo = async () => {
      try {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser) {
          const userData = JSON.parse(loggedUser);
          const campaignCode = userData.campaign;
          
          if (campaignCode) {
            const { data: campaignData, error } = await supabaseServerless
              .from('campaigns')
              .select('nome_plano')
              .eq('code', campaignCode)
              .single();

            if (!error && campaignData?.nome_plano) {
              const planName = campaignData.nome_plano;
              const planNameLower = planName.toLowerCase();
              
              // Definir limites baseado no plano
              let maxMembers = 500;
              let maxFriends = 999999;
              
              if (planNameLower.includes('gratuito')) {
                maxMembers = 25;
                maxFriends = 25;
              } else if (planNameLower.includes('essencial')) {
                maxMembers = 100;
                maxFriends = 100;
              } else if (planNameLower.includes('profissional')) {
                maxMembers = 250;
                maxFriends = 250;
              }
              
              setQuickPlanInfo({
                planName,
                maxMembers,
                maxFriends
              });
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar quick plan info:', err);
      }
    };

    fetchQuickPlanInfo();
  }, []);

  // Forçar aplicação da cor no DOM
  useEffect(() => {
    
    // Aplicar imediatamente
    const applyColor = () => {
      // Aplicar em todos os elementos com a classe
      const elements = document.querySelectorAll('.settings-background');
      elements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.backgroundColor = campaignColor;
        htmlElement.style.setProperty('background-color', campaignColor, 'important');
      });
      
      // Aplicar também no body se necessário
      document.body.style.backgroundColor = campaignColor;
      document.body.style.setProperty('background-color', campaignColor, 'important');
      
      // Forçar também no html
      document.documentElement.style.backgroundColor = campaignColor;
      document.documentElement.style.setProperty('background-color', campaignColor, 'important');
    };
    
    // Aplicar imediatamente
    applyColor();
  }, [campaignColor]);


  // Proteção de rota - redirecionar para login se não estiver autenticado (após carregamento)
  useEffect(() => {
    // Verificar se há dados de usuário no localStorage antes de redirecionar
    const hasUserInStorage = !!localStorage.getItem('loggedUser')
    
    if (!authLoading && !user && !hasUserInStorage) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  const { 
    settings, 
    phases,
    loading, 
    error, 
    refetch, 
    updateMemberLinksType,
    updateSettingsLocal
  } = useSystemSettings();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Garantir configuração inicial quando o componente carregar
  useEffect(() => {
    const ensureInitialSettings = async () => {
      try {
        const { data: existingSettings, error: fetchError } = await supabaseServerless
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'member_links_type');

        if (fetchError) throw fetchError;

        if (!existingSettings || existingSettings.length === 0) {
          // Criando configuração inicial
          
          const { error: insertError } = await supabaseServerless
            .from('system_settings')
            .insert([{
              setting_key: 'member_links_type',
              setting_value: 'members',
              description: 'Tipo de links gerados pelos membros: members (novos membros) ou friends (amigos)'
            }]);

          if (insertError) throw insertError;
          
        
          await refetch();
        }
      } catch (err) {
        console.error('', err);
      }
    };

    if (!loading && !error) {
      ensureInitialSettings();
    }
  }, [loading, error, refetch]);

  const handleUpdateLinkType = async (linkType: 'members' | 'friends') => {
    if (!canModifyLinkTypes()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores completos podem alterar tipos de links.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      const result = await updateMemberLinksType(linkType, user?.campaign);
      
      // Forçar atualização da interface
      if (result.success) {
        // Atualizar estado local imediatamente para feedback visual
        updateSettingsLocal({ member_links_type: linkType });
        
        toast({
          title: "Configuração atualizada!",
          description: `Tipo de links alterado para: ${linkType === 'members' ? 'Novos Membros' : 'Amigos'}. Links existentes também foram atualizados`,
        });
     
      } else {
        toast({
          title: "Problema ao atualizar links",
          description: result.error || "Não foi possível alterar o tipo de links",
          variant: "destructive",
        });
     
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    
    } finally {
      setIsUpdating(false);
    }
  };

  // Removido loading state completo - agora renderiza direto

  if (error) {
    return (
      <div 
        className="min-h-screen settings-background" 
        style={{ 
          backgroundColor: campaignColor
        }}
      >
        {/* Header */}
        <header className="bg-white shadow-md border-b-2 border-institutional-gold">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-institutional-blue font-medium">Bem-vindo, {user?.display_name || user?.name || quickUserData?.name || 'Usuário'}</span>
                  <div className="text-sm text-muted-foreground">{user?.role || quickUserData?.role || 'Membro'}</div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo de erro */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => refetch()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen settings-background" 
      style={{ 
        backgroundColor: campaignColor
      }}
    >
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-institutional-gold">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer"
            >
              <Logo size="md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-institutional-blue font-medium">Bem-vindo, {user?.name || quickUserData?.name || 'Usuário'}</span>
                <div className="text-sm text-muted-foreground">{user?.role || quickUserData?.role || 'Membro'}</div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título da Página */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
            >
              Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-institutional-blue">
            
          </h1>
        </div>

        {/* Controle de Tipo de Links */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#14446C' }}>
              <Users className="w-5 h-5" style={{ color: '#14446C' }} />
              Controle de Tipo de Links
            </CardTitle>
            <CardDescription>
              Configure se os links gerados pelos membros servem para cadastrar novos membros ou amigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Atual */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2">Status Atual</h4>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-500">Carregando configurações...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">
                    {settings?.member_links_type === 'members' 
                      ? 'Links servem para cadastrar novos membros (duplas)'
                      : 'Links servem para cadastrar amigos'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Botões de Controle */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Alterar Tipo de Links</h4>
              {!canModifyLinkTypes() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Apenas administradores completos podem alterar os tipos de links.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleUpdateLinkType('members')}
                  disabled={isUpdating || !canModifyLinkTypes()}
                  className={`h-16 text-left justify-start ${
                    settings?.member_links_type === 'members' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } ${!canModifyLinkTypes() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    <div>
                      <div className="font-semibold">Novos Membros</div>
                      <div className="text-sm opacity-90">
                        Links cadastram duplas que se tornam membros da rede
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleUpdateLinkType('friends')}
                  disabled={isUpdating || !canModifyLinkTypes()}
                  className={`h-16 text-left justify-start ${
                    settings?.member_links_type === 'friends' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } ${!canModifyLinkTypes() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-6 h-6" />
                    <div>
                      <div className="font-semibold">Amigos</div>
                      <div className="text-sm opacity-90">
                        Links cadastram duplas que se tornam amigos
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>


            {/* Informações Importantes - Apenas para Plano A e Plano B */}
            {planFeatures.planName && (
              (planFeatures.planName.toLowerCase().includes('plano a') || 
               planFeatures.planName.toLowerCase() === 'a' ||
               planFeatures.planName.toLowerCase().includes('plano b') || 
               planFeatures.planName.toLowerCase().includes('b luxo')) && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Informações Importantes</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• <strong>Novos Membros:</strong> Cadastram duplas que se tornam membros da rede</li>
                    <li>• <strong>Amigos:</strong> Cadastram duplas que se tornam amigos</li>
                    <li>• A mudança afeta todos os links gerados pelos membros</li>
                    <li>• Links já gerados continuam funcionando com o tipo atual</li>
                  </ul>
                </div>
              )
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}