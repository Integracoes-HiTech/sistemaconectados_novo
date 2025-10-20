import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Instagram, UserPlus, MapPin, Building, AlertCircle, LogIn, ExternalLink, CheckCircle } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserLinks, UserLink } from "@/hooks/useUserLinks";

// Interface estendida para incluir link_type
interface ExtendedUserLink extends UserLink {
  link_type: 'members' | 'friends';
}
import { useCredentials } from "@/hooks/useCredentials";
import { useMembers } from "@/hooks/useMembers";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useFriends } from "@/hooks/useFriends";
import { emailService, generateCredentials } from "@/services/emailService";
import { buscarCep, validarFormatoCep, formatarCep, limparCep, CepData } from "@/services/cepService";
// COMENTADO: Validação do Instagram (não está pronta)
// import { validateInstagramAccount } from "@/services/instagramValidation";
import { AuthUser, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { getTextColor, getOverlayColors } from "@/lib/colorUtils";

// Função para buscar cores iniciais da campanha do localStorage
const getInitialCampaignColors = (linkId?: string): { bgColor: string; accentColor: string } => {
  try {
    // Tentar buscar cores salvas para este link específico
    if (linkId) {
      const savedColors = localStorage.getItem(`link_colors_${linkId}`);
      if (savedColors) {
        return JSON.parse(savedColors);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar cores iniciais do link:', err);
  }
  return { bgColor: '#14446C', accentColor: '#D4AF37' }; // Cores padrão
};

export default function PublicRegister() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  
  // Verificar se está em modo de edição
  const { editMode, memberData, isMember } = (location.state as { 
    editMode?: boolean; 
    memberData?: any; 
    isMember?: boolean 
  }) || {};
  
  // Se for um linkId de edição, não buscar dados do link
  const isEditMode = editMode || linkId?.startsWith('edit-');
  const [formData, setFormData] = useState({
    name: editMode && memberData ? memberData.name || "" : "",
    phone: editMode && memberData ? memberData.phone || "" : "",
    instagram: editMode && memberData ? memberData.instagram || "" : "",
    cep: editMode && memberData ? memberData.cep || "" : "",
    city: editMode && memberData ? memberData.city || "" : "",
    sector: editMode && memberData ? memberData.sector || "" : "",
    referrer: editMode && memberData ? memberData.referrer || "" : "",
    // Dados do parceiro (obrigatório)
    couple_name: editMode && memberData ? memberData.couple_name || "" : "",
    couple_phone: editMode && memberData ? memberData.couple_phone || "" : "",
    couple_instagram: editMode && memberData ? memberData.couple_instagram || "" : "",
    couple_cep: editMode && memberData ? memberData.couple_cep || "" : "",
    couple_city: editMode && memberData ? memberData.couple_city || "" : "",
    couple_sector: editMode && memberData ? memberData.couple_sector || "" : ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerData, setReferrerData] = useState<AuthUser | null>(null);
  const [linkData, setLinkData] = useState<ExtendedUserLink | null>(null);
  const [userCredentials, setUserCredentials] = useState<{ username: string; password: string } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [coupleCepLoading, setCoupleCepLoading] = useState(false);
  
  // Estados para dados do CEP (cidade e setor)
  const [cepData, setCepData] = useState<CepData | null>(null);
  const [coupleCepData, setCoupleCepData] = useState<CepData | null>(null);
  const hasFetchedData = useRef(false);
  
  // Estados para nome de exibição (sempre primeiro nome)
  const [displayName, setDisplayName] = useState("");
  
  
  // Estados de validação do Instagram
  const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  const [instagramValidationError, setInstagramValidationError] = useState<string | null>(null);
  const [isInstagramValid, setIsInstagramValid] = useState(false);
  
  // Estados de validação do Instagram do parceiro
  const [isValidatingCoupleInstagram, setIsValidatingCoupleInstagram] = useState(false);
  const [coupleInstagramValidationError, setCoupleInstagramValidationError] = useState<string | null>(null);
  const [isCoupleInstagramValid, setIsCoupleInstagramValid] = useState(false);
  
  // Estado para link desativado
  const [isLinkDeactivated, setIsLinkDeactivated] = useState(false);
  const [linkDeactivationMessage, setLinkDeactivationMessage] = useState<string>("");
  
  const { addUser, checkUserExists } = useUsers();
  const { getUserByLinkId, incrementClickCount } = useUserLinks();
  const { createUserWithCredentials } = useCredentials();
  const { addMember } = useMembers();
  const { shouldShowMemberLimitAlert } = useSystemSettings();
  const { addFriend } = useFriends();
  const { toast } = useToast();
  const { getCampaignByCode, loading: campaignsLoading } = useCampaigns();
  const { features: planFeatures } = usePlanFeatures();
  
  // Estado inicial das cores (do localStorage)
  const [initialColors] = useState(() => getInitialCampaignColors(linkId));
  
  // Função para verificar limite de membros baseado no plano
  const checkPlanMemberLimit = async () => {
    try {
      const campaignCode = linkData?.campaign || referrerData?.campaign || 'A';
      
      console.log('🔍 Checking member limit for campaign:', campaignCode);
      console.log('📊 Plan features:', {
        maxMembers: planFeatures.maxMembers,
        planName: planFeatures.planName
      });
      
      // Contar membros atuais da campanha
      const { data: membersData, error } = await supabase
        .from('members')
        .select('id')
        .eq('campaign', campaignCode)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (error) throw error;

      const currentCount = membersData?.length || 0;
      const maxLimit = planFeatures.maxMembers;

      console.log('📈 Member count result:', {
        currentCount,
        maxLimit,
        canRegister: currentCount < maxLimit,
        percentage: (currentCount / maxLimit) * 100
      });

      return {
        current: currentCount,
        max: maxLimit,
        canRegister: currentCount < maxLimit,
        percentage: (currentCount / maxLimit) * 100
      };
    } catch (err) {
      console.error('❌ Error checking member limit:', err);
      return {
        current: 0,
        max: planFeatures.maxMembers,
        canRegister: true,
        percentage: 0
      };
    }
  };

  // Buscar cores da campanha baseado no link/referrer com memoização
  const { bgColor, accentColor, textColor, overlayColors } = useMemo(() => {
    const campaignCode = linkData?.campaign || referrerData?.campaign || 'A';
    const campaign = getCampaignByCode(campaignCode);
    
    // Se tiver campanha do banco, usar essas cores
    if (campaign?.primary_color) {
      const bg = campaign.primary_color;
      const accent = campaign.secondary_color || '#D4AF37';
      
      // Salvar no localStorage para próxima vez
      if (linkId) {
        localStorage.setItem(`link_colors_${linkId}`, JSON.stringify({ bgColor: bg, accentColor: accent }));
      }
      
      return {
        bgColor: bg,
        accentColor: accent,
        textColor: getTextColor(bg),
        overlayColors: getOverlayColors(bg)
      };
    }
    
    // Se ainda não carregou, usar cores iniciais do localStorage
    return {
      bgColor: initialColors.bgColor,
      accentColor: initialColors.accentColor,
      textColor: getTextColor(initialColors.bgColor),
      overlayColors: getOverlayColors(initialColors.bgColor)
    };
  }, [linkData?.campaign, referrerData?.campaign, getCampaignByCode, linkId, initialColors]);



  // Funções de validação
  const validateEmail = (email: string) => {
    // Validação mais rigorosa de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.trim().length > 0;
  };

  const validateName = (name: string) => {
    // Deve conter apenas letras e ter pelo menos duas palavras separadas por espaço
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    const words = name.trim().split(/\s+/);
    return nameRegex.test(name) && words.length >= 2 && words.every(word => word.length > 0);
  };

  const validatePhone = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Deve ter exatamente 11 dígitos (DDD + 9 dígitos)
    if (cleanPhone.length !== 11) {
      return false;
    }
    
    // Validar DDD (11 a 99)
    const ddd = parseInt(cleanPhone.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return false;
    }
    
    // Validar se o primeiro dígito após DDD é 9 (celular)
    const firstDigit = parseInt(cleanPhone.substring(2, 3));
    if (firstDigit !== 9) {
      return false;
    }
    
    // Validar se não são todos os dígitos iguais
    const allSameDigits = /^(\d)\1{10}$/.test(cleanPhone);
    if (allSameDigits) {
      return false;
    }
    
    return true;
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (62) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validateInstagram = async (instagram: string) => {
    if (!instagram.trim()) {
      return { isValid: false, error: 'Instagram é obrigatório' };
    }

    // Remove @ se o usuário digitou e limpa espaços
    const cleanInstagram = instagram.replace('@', '').trim();
    
    // Validação: não pode ter espaços no início ou fim
    if (instagram !== instagram.trim()) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode ter espaços no início ou fim' };
    }

    // Validação: não pode ter espaços (já removidos automaticamente, mas verificamos por segurança)
    if (cleanInstagram.includes(' ')) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode conter espaços' };
    }
    
    // Validação de comprimento mínimo
    if (cleanInstagram.length < 3) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve ter pelo menos 3 caracteres' };
    }

    // Validação de comprimento máximo (limite do Instagram)
    if (cleanInstagram.length > 30) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve ter no máximo 30 caracteres' };
    }

    // Validação de caracteres permitidos (letras, números, pontos e underscores)
    const instagramRegex = /^[a-zA-Z0-9._]+$/;
    if (!instagramRegex.test(cleanInstagram)) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve conter apenas letras, números, pontos (.) e underscores (_). Não são permitidos espaços ou símbolos especiais' };
    }

    // Validação adicional: não pode começar ou terminar com ponto ou underscore
    if (cleanInstagram.startsWith('.') || cleanInstagram.endsWith('.') || 
        cleanInstagram.startsWith('_') || cleanInstagram.endsWith('_')) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode começar ou terminar com ponto (.) ou underscore (_)' };
    }

    // Validação adicional: não pode ter pontos ou underscores consecutivos (apenas pontos duplos são inválidos)
    if (cleanInstagram.includes('..') || cleanInstagram.includes('__')) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode ter pontos (..) ou underscores (__) consecutivos' };
    }

    // COMENTADO: Validação via API do Instagram (não está pronta)
    /*
    setIsValidatingInstagram(true);
    setInstagramValidationError(null);

    try {
      const result = await validateInstagramAccount(cleanInstagram);
      
      if (result.status) {
        return { isValid: true, error: null };
      } else {
        return { isValid: false, error: result.message };
      }
    } catch (error) {
      return { isValid: false, error: 'Erro ao validar conta do Instagram' };
    } finally {
      setIsValidatingInstagram(false);
    }
    */

    // Validação básica passou
    return { isValid: true, error: null, username: cleanInstagram };
  };

  // Função para validar Instagram ao sair do campo
  const handleInstagramBlur = async () => {
    if (!formData.instagram.trim()) {
      setIsInstagramValid(false);
      return;
    }
    
    // Primeiro verificar com a nova validação
    const instagramError = validateInstagramBasic(formData.instagram);
    if (instagramError) {
      setInstagramValidationError(instagramError);
      setIsInstagramValid(false);
      return;
    }
    
    // Se passou na validação básica, fazer validação adicional
    const validation = await validateInstagram(formData.instagram);
    if (validation.isValid) {
      setInstagramValidationError(null);
      setIsInstagramValid(true);
    } else {
      setInstagramValidationError(validation.error || 'Instagram inválido');
      setIsInstagramValid(false);
    }
  };

  // Função para validar duplicatas entre membros e amigos
  // Função para buscar CEP e preencher campos automaticamente
  const buscarCepEPreencher = async (cep: string, isCouple: boolean = false) => {
    try {
      if (isCouple) {
        setCoupleCepLoading(true);
      } else {
        setCepLoading(true);
      }

      // Limpar erros anteriores
      setFormErrors(prev => ({
        ...prev,
        [isCouple ? 'couple_cep' : 'cep']: ''
      }));

      const dadosCep = await buscarCep(cep);
      
      // Armazenar dados do CEP
      if (isCouple) {
        setCoupleCepData(dadosCep);
      } else {
        setCepData(dadosCep);
      }

      // Limpar campos primeiro e depois preencher com novos dados
      setFormData(prev => ({
        ...prev,
        [isCouple ? 'couple_city' : 'city']: dadosCep.cidade,
        [isCouple ? 'couple_sector' : 'sector']: dadosCep.bairro
      }));

      // CEP encontrado e campos preenchidos

    } catch (error) {
      // Erro ao buscar CEP
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar CEP';
      
      setFormErrors(prev => ({
        ...prev,
        [isCouple ? 'couple_cep' : 'cep']: errorMessage
      }));

      // Limpar dados do CEP em caso de erro
      if (isCouple) {
        setCoupleCepData(null);
      } else {
        setCepData(null);
      }

      toast({
        title: "Erro ao buscar CEP",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (isCouple) {
        setCoupleCepLoading(false);
      } else {
        setCepLoading(false);
      }
    }
  };

  // Função para atualizar contadores do membro após cadastro de amigo
  const updateMemberCountersAfterRegistration = async (referrerName: string) => {
    try {
      // Atualizando contadores do membro após cadastro
      
      // Buscar o membro referrer
      const { data: referrerMembers, error: referrerError } = await supabase
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const referrerMember = referrerMembers?.[0];

      if (referrerError) {
        // Erro ao buscar referrer
        return;
      }

      if (!referrerMember) {
        // Referrer não encontrado
        return;
      }

      // Contar amigos ativos cadastrados por este membro
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('id')
        .eq('referrer', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (friendsError) {
        // Erro ao contar amigos
        return;
      }

      const friendsCount = friendsData?.length || 0;
      const currentContracts = referrerMember.contracts_completed;

      // Contratos atuais e amigos cadastrados

      // Atualizar contracts_completed
      // Atualizando contratos após cadastro
      
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          contracts_completed: friendsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerMember.id);

      if (updateError) {
        // Erro ao atualizar contratos do membro
        return;
      }

      // Atualizar ranking e status
      await updateMemberRankingAndStatus(referrerMember.id, friendsCount);
      
      // Contadores do membro atualizados após cadastro

    } catch (err) {
      // Erro ao atualizar contadores após cadastro
    }
  }

  // Função para atualizar ranking e status do membro
  const updateMemberRankingAndStatus = async (memberId: string, contractsCount: number) => {
    try {
      // Atualizando ranking e status do membro
      
      // Calcular status baseado no número de contratos
      let rankingStatus = 'Vermelho';
      if (contractsCount >= 15) {
        rankingStatus = 'Verde';
      } else if (contractsCount >= 1) {
        rankingStatus = 'Amarelo';
      }

      // Atualizar status do membro
      const { error: statusError } = await supabase
        .from('members')
        .update({ 
          ranking_status: rankingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (statusError) {
        // Erro ao atualizar status do membro
      }

      // Atualizar ranking de todos os membros
      await updateRankingAutomatically();

    } catch (err) {
      // Erro ao atualizar ranking e status
    }
  }

  // Função para atualizar ranking usando sistema automático do banco
  const updateRankingAutomatically = async () => {
    try {
      // Usar função RPC do banco que já tem sistema automático por campanha
      const { error } = await supabase.rpc('update_complete_ranking');
      
      if (error) {
        console.warn('Erro ao executar ranking automático:', error);
      }
    } catch (err) {
      console.warn('Erro ao executar ranking automático:', err);
    }
  }

  // Função de validação do Instagram do parceiro
  const handleCoupleInstagramBlur = async () => {
    if (!formData.couple_instagram.trim()) {
      setIsCoupleInstagramValid(false);
      setCoupleInstagramValidationError(null);
      return;
    }

    // Primeiro verificar com a nova validação
    const coupleInstagramError = validateInstagramBasic(formData.couple_instagram);
    if (coupleInstagramError) {
      setCoupleInstagramValidationError(coupleInstagramError);
      setIsCoupleInstagramValid(false);
      return;
    }

    setIsValidatingCoupleInstagram(true);
    setCoupleInstagramValidationError(null);

    try {
      // Se passou na validação básica, fazer validação adicional
      const validation = await validateInstagram(formData.couple_instagram);
      if (validation.isValid) {
        setIsCoupleInstagramValid(true);
        setCoupleInstagramValidationError(null);
      } else {
        setIsCoupleInstagramValid(false);
        setCoupleInstagramValidationError(validation.error || 'Instagram inválido');
      }
    } catch (error) {
      setIsCoupleInstagramValid(false);
      setCoupleInstagramValidationError('Erro ao validar Instagram');
    } finally {
      setIsValidatingCoupleInstagram(false);
    }
  };

  const validateDuplicates = async () => {
    const errors: Record<string, string> = {};
    
    try {
      // Normalizar telefones para comparação
      const normalizedPhone = formData.phone.replace(/\D/g, '');
      const normalizedCouplePhone = formData.couple_phone.replace(/\D/g, '');
      
      // Verificar duplicatas dentro da mesma dupla
      if (normalizedPhone === normalizedCouplePhone) {
        errors.couple_phone = 'O telefone do parceiro não pode ser igual ao seu telefone';
      }
      
      if (formData.instagram.toLowerCase() === formData.couple_instagram.toLowerCase()) {
        errors.couple_instagram = 'O Instagram do parceiro não pode ser igual ao seu Instagram';
      }

      // Verificar duplicatas com membros existentes
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('name, phone, instagram, couple_name, couple_phone, couple_instagram, campaign')
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (membersError) {
        // Erro ao verificar membros
        return errors;
      }

      // Verificar duplicatas com amigos existentes
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('name, phone, instagram, couple_name, couple_phone, couple_instagram, campaign')
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (friendsError) {
        // Erro ao verificar amigos
        return errors;
      }

      // Combinar dados de membros e amigos - VERIFICAR TODAS AS CAMPANHAS

      const allUsers = [...(membersData || []), ...(friendsData || [])];


      // Verificar duplicatas
      for (const user of allUsers) {
        const userPhone = user.phone?.replace(/\D/g, '') || '';
        const userCouplePhone = user.couple_phone?.replace(/\D/g, '') || '';
        const userInstagram = user.instagram?.toLowerCase() || '';
        const userCoupleInstagram = user.couple_instagram?.toLowerCase() || '';

        // Verificar se é uma duplicata completa (mesmo telefone E mesmo Instagram)
        if (userPhone === normalizedPhone && userInstagram === formData.instagram.toLowerCase()) {
          errors.phone = `Usuário já cadastrado com este telefone e Instagram`;
          errors.instagram = `Usuário já cadastrado com este telefone e Instagram`;
          break; // Parar já que encontrou duplicata completa
        }

        // Verificar se é uma duplicata completa da segunda pessoa
        if (userCouplePhone === normalizedCouplePhone && userCoupleInstagram === formData.couple_instagram.toLowerCase()) {
          errors.couple_phone = `Usuário já cadastrado com este telefone e Instagram`;
          errors.couple_instagram = `Usuário já cadastrado com este telefone e Instagram`;
          break; // Parar já que encontrou duplicata completa
        }

        // Verificar telefone principal independente (apenas se não for duplicata completa)
        if (userPhone === normalizedPhone && !errors.phone) {
          errors.phone = `Este telefone já está cadastrado`;
        }

        // Verificar telefone do parceiro (apenas se não for duplicata completa)
        if (userPhone === normalizedCouplePhone && !errors.couple_phone) {
          errors.couple_phone = `Este telefone já está cadastrado`;
        }
        if (userCouplePhone === normalizedCouplePhone && !errors.couple_phone) {
          errors.couple_phone = `Este telefone já está cadastrado`;
        }

        // Verificar Instagram principal (apenas se não for duplicata completa)
        if (userInstagram === formData.instagram.toLowerCase() && !errors.instagram) {
          errors.instagram = `Este Instagram já está cadastrado`;
        }

        // Verificar Instagram do parceiro (apenas se não for duplicata completa)
        if (userInstagram === formData.couple_instagram.toLowerCase() && !errors.couple_instagram) {
          errors.couple_instagram = `Este Instagram já está cadastrado`;
        }
        if (userCoupleInstagram === formData.couple_instagram.toLowerCase() && !errors.couple_instagram) {
          errors.couple_instagram = `Este Instagram já está cadastrado`;
        }
        if (userCoupleInstagram === formData.instagram.toLowerCase() && !errors.instagram) {
          errors.instagram = `Este Instagram já está cadastrado`;
        }
      }

    } catch (error) {
      // Erro na validação de duplicatas
    }

    return errors;
  };

  // Função para validar Instagram (validação básica)
  const validateInstagramBasic = (instagram: string): string | null => {
    if (!instagram) return null;
    
    const instagramClean = instagram.replace('@', '').toLowerCase();
    
    // Lista de nomes genéricos/fake que devem ser bloqueados
    const blockedNames = [
      'insta', 'instagram', 'seminsta', 'ainstao', 'naotem', 'seminsta', 'aaaaaaa', 
      'instanao', 'naotenhoinsta', 'nãotenhoinstragram', 'instanaotem', 'asdadd', 
      'aaaa', 'bbbbb', 'nao', 'tem', 'insta', 'sem', 'não', 'tenho', 'aaaaa', 
      'bbbb', 'cccc', 'dddd', 'eeee', 'ffff', 'gggg', 'hhhh', 'iiii', 'jjjj',
      'kkkk', 'llll', 'mmmm', 'nnnn', 'oooo', 'pppp', 'qqqq', 'rrrr', 'ssss',
      'tttt', 'uuuu', 'vvvv', 'wwww', 'xxxx', 'yyyy', 'zzzz', 'teste', 'test',
      'usuario', 'user', 'nome', 'name', 'exemplo', 'example', 'fake', 'falso'
    ];
    
    // Verificar se é um nome bloqueado
    if (blockedNames.includes(instagramClean)) {
      return 'Por favor, insira um Instagram válido e real.';
    }
    
    // Verificar se tem pelo menos 3 caracteres
    if (instagramClean.length < 3) {
      return 'Instagram deve ter pelo menos 3 caracteres.';
    }
    
    // Verificar se não é apenas números
    if (/^\d+$/.test(instagramClean)) {
      return 'Instagram deve conter letras.';
    }
    
    // Verificar se não é apenas caracteres repetidos
    if (/(.)\1{4,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitos caracteres repetidos.';
    }
    
    return null;
  };

  const validateRequiredFields = async () => {
    const errors: Record<string, string> = {};
    
    // Validação da primeira pessoa
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (!validateName(formData.name)) {
      errors.name = 'Deve conter nome e sobrenome';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'WhatsApp é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        errors.phone = 'WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)';
      } else {
        const ddd = parseInt(cleanPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          errors.phone = 'DDD inválido. Use um DDD válido (11-99)';
        } else if (parseInt(cleanPhone.substring(2, 3)) !== 9) {
          errors.phone = 'Número deve começar com 9 (celular)';
        } else {
          errors.phone = 'Número de telefone inválido';
        }
      }
    }
    
    if (!formData.instagram.trim()) {
      errors.instagram = 'Instagram é obrigatório';
    } else {
      // Usar a nova validação de Instagram
      const instagramError = validateInstagramBasic(formData.instagram);
      if (instagramError) {
        errors.instagram = instagramError;
      } else {
        // Validação adicional (formato, etc.)
        const instagramValidation = await validateInstagram(formData.instagram);
        if (!instagramValidation.isValid) {
          errors.instagram = instagramValidation.error || 'Instagram inválido';
        }
      }
    }
    
    if (!formData.cep.trim()) {
      errors.cep = 'CEP é obrigatório';
    } else if (!validarFormatoCep(formData.cep)) {
      errors.cep = 'CEP deve ter 8 dígitos (ex: 12345-678)';
    } else if (!cepData) {
      errors.cep = 'CEP não encontrado - verifique se o CEP está correto';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }
    
    if (!formData.sector.trim()) {
      errors.sector = 'Setor é obrigatório';
    }

    // Validação do parceiro (obrigatório)
    if (!formData.couple_name.trim()) {
      errors.couple_name = 'Nome do parceiro é obrigatório';
    } else if (!validateName(formData.couple_name)) {
      errors.couple_name = 'Deve conter nome e sobrenome';
    }
    
    if (!formData.couple_phone.trim()) {
      errors.couple_phone = 'WhatsApp do parceiro é obrigatório';
    } else if (!validatePhone(formData.couple_phone)) {
      const cleanPhone = formData.couple_phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        errors.couple_phone = 'WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)';
      } else {
        const ddd = parseInt(cleanPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          errors.couple_phone = 'DDD inválido. Use um DDD válido (11-99)';
        } else if (parseInt(cleanPhone.substring(2, 3)) !== 9) {
          errors.couple_phone = 'Número deve começar com 9 (celular)';
        } else {
          errors.couple_phone = 'Número de telefone inválido';
        }
      }
    }
    
    if (!formData.couple_instagram.trim()) {
      errors.couple_instagram = 'Instagram do parceiro é obrigatório';
    } else {
      // Usar a nova validação de Instagram
      const coupleInstagramError = validateInstagramBasic(formData.couple_instagram);
      if (coupleInstagramError) {
        errors.couple_instagram = coupleInstagramError;
      } else {
        // Validação adicional (formato, etc.)
        const coupleInstagramValidation = await validateInstagram(formData.couple_instagram);
        if (!coupleInstagramValidation.isValid) {
          errors.couple_instagram = coupleInstagramValidation.error || 'Instagram inválido';
        }
      }
    }
    
    if (!formData.couple_cep.trim()) {
      errors.couple_cep = 'CEP do parceiro é obrigatório';
    } else if (!validarFormatoCep(formData.couple_cep)) {
      errors.couple_cep = 'CEP deve ter 8 dígitos (ex: 12345-678)';
    } else if (!coupleCepData) {
      errors.couple_cep = 'CEP não encontrado - verifique se o CEP está correto';
    }
    
    if (!formData.couple_city.trim()) {
      errors.couple_city = 'Cidade do parceiro é obrigatória';
    }
    
    if (!formData.couple_sector.trim()) {
      errors.couple_sector = 'Setor do parceiro é obrigatório';
    }
    
    // Validar duplicatas
    const duplicateErrors = await validateDuplicates();
    Object.assign(errors, duplicateErrors);
    
    setFormErrors(errors);
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'phone' || field === 'couple_phone') {
      processedValue = formatPhone(value);
    } else if (field === 'instagram' || field === 'couple_instagram') {
      // Remove espaços completamente
      processedValue = value.replace(/\s/g, '');
      
      // Se não começar com @, adiciona
      if (processedValue && !processedValue.startsWith('@')) {
        processedValue = '@' + processedValue;
      }
      
      // Converte primeira letra (após o @) para minúscula se necessário
      if (processedValue.length > 1 && processedValue[1] !== processedValue[1].toLowerCase()) {
        processedValue = processedValue[0] + processedValue[1].toLowerCase() + processedValue.slice(2);
      }
    } else if (field === 'name' || field === 'couple_name') {
      // Permite apenas letras e espaços
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'city' || field === 'couple_city') {
      // Permite apenas letras e espaços para cidade
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'sector' || field === 'couple_sector') {
      // Permite apenas letras e espaços para setor
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'cep' || field === 'couple_cep') {
      // Formatar CEP e buscar automaticamente quando completo
      processedValue = formatarCep(value);
      
      // Limpar campos relacionados quando CEP for apagado
      if (value.trim() === '') {
        if (field === 'cep') {
          setFormData(prev => ({ ...prev, city: '', sector: '' }));
          setCepData(null);
        } else {
          setFormData(prev => ({ ...prev, couple_city: '', couple_sector: '' }));
          setCoupleCepData(null);
        }
      } else {
        // Buscar CEP automaticamente quando tiver 8 dígitos
        const cepLimpo = limparCep(value);
        if (cepLimpo.length === 8 && validarFormatoCep(cepLimpo)) {
          buscarCepEPreencher(cepLimpo, field === 'couple_cep');
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpa o erro do campo quando o usuário começa a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  // Função memoizada para buscar dados do referrer
  const fetchReferrerData = useCallback(async () => {
    if (!linkId || hasFetchedData.current || isEditMode) return;
    
    hasFetchedData.current = true;
      
      try {
        const result = await getUserByLinkId(linkId);
        
        if (result.success && result.data) {
          setLinkData(result.data);
          setReferrerData(result.data.user_data);
          setFormData(prev => ({ 
            ...prev, 
            referrer: result.data.user_data?.name || 'Usuário do Sistema' 
          }));
          
          // Link normal - continuar com o fluxo padrão
          
          // Incrementar contador de cliques quando o link for acessado
          await incrementClickCount(linkId);
        } else {
          // VERIFICAR SE TEM ERRO DE DESATIVAÇÃO OU LINK NÃO ENCONTRADO
          if (result.error) {
            const errorMessage = result.error;
            
            if (errorMessage.includes('desativado') || 
                errorMessage.includes('inativo') || 
                errorMessage.includes('não encontrado') ||
                errorMessage.includes('não está mais disponível')) {
              setIsLinkDeactivated(true);
              setLinkDeactivationMessage(
                errorMessage.includes('não encontrado') 
                  ? 'Este link não foi encontrado ou não está mais disponível.' 
                  : errorMessage
              );
              return; // NÃO fazer fallback
            }
          }
          
          // Fallback se não encontrar no banco
          setFormData(prev => ({ ...prev, referrer: 'Usuário do Sistema' }));
        }
      } catch (error) {
        // VERIFICAR SE O ERRO É POR LINK DESATIVADO
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        if (errorMessage.includes('desativado') || 
            errorMessage.includes('inativo') ||
            errorMessage.includes('não encontrado') ||
            errorMessage.includes('não está mais disponível')) {
          setIsLinkDeactivated(true);
          setLinkDeactivationMessage(
            errorMessage.includes('não encontrado') 
              ? 'Este link não foi encontrado ou não está mais disponível.' 
              : errorMessage
          );
          return; // NÃO fazer fallback
        } else {
          // Outro tipo de erro - fallback normal
          setFormData(prev => ({ ...prev, referrer: 'Usuário do Sistema' }));
        }
      }
  }, [linkId, getUserByLinkId, incrementClickCount, navigate]);

  // Buscar dados do referrer quando o componente carregar
  useEffect(() => {
    if (linkId && !isEditMode) {
      fetchReferrerData();
    }
  }, [linkId, fetchReferrerData, isEditMode]);

  // Aguardar carregar campanhas antes de renderizar para evitar flash de cores (exceto em modo de edição)
  if (campaignsLoading && !isEditMode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Função para atualizar membro/friend
  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      
      // Determinar qual tabela atualizar
      const tableName = isMember ? 'members' : 'friends';
      
      // Preparar dados para update
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        instagram: formData.instagram,
        cep: formData.cep,
        city: formData.city,
        sector: formData.sector,
        referrer: formData.referrer,
        couple_name: formData.couple_name,
        couple_phone: formData.couple_phone,
        couple_instagram: formData.couple_instagram,
        couple_cep: formData.couple_cep,
        couple_city: formData.couple_city,
        couple_sector: formData.couple_sector,
        updated_at: new Date().toISOString()
      };
      
      // Fazer update no banco
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', memberData.id);
      
      if (error) throw error;
      
      // Atualizar auth_users se existir
      let newCredentials = null;
      
      console.log('🔍 Buscando auth_user para:', {
        name: memberData.name,
        phone: memberData.phone,
        instagram: memberData.instagram
      });
      
      // Buscar auth_users pelo nome original, telefone ou Instagram
      let authUserData = null;
      
      // Tentar buscar pelo nome primeiro
      try {
        const { data: nameData, error: nameError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('name', memberData.name)
          .single();
        
        if (nameData && !nameError) {
          authUserData = nameData;
          console.log('✅ Encontrado pelo nome:', nameData);
        } else {
          // Se não encontrar pelo nome, tentar pelo telefone
          const { data: phoneData, error: phoneError } = await supabase
            .from('auth_users')
            .select('*')
            .eq('phone', memberData.phone)
            .single();
          
          if (phoneData && !phoneError) {
            authUserData = phoneData;
            console.log('✅ Encontrado pelo telefone:', phoneData);
          } else {
            // Se não encontrar pelo telefone, tentar pelo Instagram
            const { data: instagramData, error: instagramError } = await supabase
              .from('auth_users')
              .select('*')
              .eq('instagram', memberData.instagram)
              .single();
            
            if (instagramData && !instagramError) {
              authUserData = instagramData;
              console.log('✅ Encontrado pelo Instagram:', instagramData);
            }
          }
        }
      } catch (searchError) {
        console.error('❌ Erro na busca do auth_user:', searchError);
      }
      
      if (authUserData) {
        console.log('🔍 Auth user encontrado:', authUserData);
        
        // Gerar credenciais baseadas na lógica correta
        // Username: sempre o Instagram (sem @)
        const newUsername = formData.instagram.replace('@', '');
        
        // Senha: telefone sem DDD e sem o primeiro 9
        let phoneNumber = formData.phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
        console.log('📱 Telefone original:', formData.phone);
        console.log('📱 Telefone limpo:', phoneNumber);
        
        if (phoneNumber.length >= 11) {
          // Remove DDD (primeiros 2 dígitos) e o primeiro 9
          phoneNumber = phoneNumber.substring(2); // Remove DDD
          console.log('📱 Após remover DDD:', phoneNumber);
          
          if (phoneNumber.startsWith('9')) {
            phoneNumber = phoneNumber.substring(1); // Remove o primeiro 9
            console.log('📱 Após remover primeiro 9:', phoneNumber);
          }
        }
        const newPassword = phoneNumber;
        console.log('🔐 Senha final:', newPassword);
        
        console.log('🔐 Novas credenciais geradas:', { newUsername, newPassword });
        
        // Preparar dados para atualização
        const updateData = {
          username: newUsername,
          password: newPassword,
          name: formData.name,
          phone: formData.phone,
          instagram: formData.instagram,
          display_name: formData.name.toLowerCase(),
          full_name: `${formData.name} - ${isMember ? 'Membro' : 'Amigo'}`,
          updated_at: new Date().toISOString()
        };
        
        console.log('🔄 Dados para atualização auth_users:', updateData);
        
        // Atualizar auth_users
        const { error: authError } = await supabase
          .from('auth_users')
          .update(updateData)
          .eq('id', authUserData.id);
        
        if (authError) {
          console.error('❌ Erro ao atualizar auth_users:', authError);
          throw authError;
        }
        
        console.log('✅ Auth user atualizado com sucesso');
        
        newCredentials = {
          username: newUsername,
          password: newPassword
        };
      } else {
        console.log('⚠️ Nenhum auth user encontrado para:', memberData.name);
      }
      
      // Mostrar tela de sucesso com novas credenciais
      setIsSuccess(true);
      setUserCredentials(newCredentials);
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro ao atualizar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se estiver em modo de edição, fazer update
    if (editMode && memberData) {
      await handleUpdate();
      return;
    }
    
    // Valida todos os campos obrigatórios
    const validationErrors = await validateRequiredFields();
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }

    // VALIDAÇÃO FINAL: Verificar se cidade e setor estão exatos no banco
    try {
      setIsLoading(true);
      
      // Validação de CEP já foi feita na função validateRequiredFields
      // Os dados de cidade e setor vêm da consulta do CEP

      // Validação de CEP concluída

    } catch (error) {
      // Erro na validação/criação
      toast({
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Erro ao validar cidade e setor. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Continuar com o cadastro do membro
    try {

      // IDENTIFICAR TIPO DE LINK - Verificar se é para cadastrar membro ou amigo
      const isFriendRegistration = linkData?.link_type === 'friends';
      
      // Dados do link
      // Tipo de link identificado
      // É cadastro de amigo?
      
      // Verificar configuração atual do sistema
      const { data: currentSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single();
      
      // Configuração atual do sistema
      
      // Se for cadastro de amigo, não verificar limite de membros
      if (!isFriendRegistration) {
        // Verificar limite de membros apenas para novos membros
        const limitCheck = await checkPlanMemberLimit();
        if (!limitCheck.canRegister) {
          toast({
            title: "Limite de membros atingido",
            description: `O sistema atingiu o limite de ${limitCheck.max} membros. Não é possível cadastrar novos membros no momento.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      if (isFriendRegistration) {
        // CADASTRO DE AMIGO (CADASTRO ESPECIAL) - Usar tabela friends
        // Cadastrando amigo (cadastro especial)
        
        // Preparar dados do amigo para tabela friends
        const friendData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          cep: formData.cep ? limparCep(formData.cep) : null, // ← Adicionar CEP limpo (somente números)
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const,
          campaign: linkData?.campaign || referrerData?.campaign || 'A', // Usar campanha do link primeiro, depois referrer, depois padrão A
          // Dados do parceiro (obrigatório)
          couple_name: formData.couple_name.trim(),
          couple_phone: formData.couple_phone,
          couple_instagram: formData.couple_instagram.trim(),
          couple_cep: formData.couple_cep ? limparCep(formData.couple_cep) : null, // ← Adicionar CEP do parceiro
          couple_city: formData.couple_city.trim(),
          couple_sector: formData.couple_sector.trim(),
          // Campos obrigatórios para tabela friends
          member_id: '', // Será preenchido pelo hook
          deleted_at: null
        };

        // Dados do amigo a serem salvos

        // Salvar amigo na tabela friends
        const friendResult = await addFriend(friendData);
        
        if (!friendResult.success) {
          throw new Error(friendResult.error || "Erro ao salvar amigo");
        }

        // Sucesso - Amigo cadastrado
        setIsSuccess(true);
        
        // Atualizar contadores do membro referrer após cadastro bem-sucedido
        if (formData.referrer) {
          // Atualizando contadores do membro após cadastro
          await updateMemberCountersAfterRegistration(formData.referrer);
        }
        
        toast({
          title: "Amigo dupla cadastrado com sucesso!",
          description: `Você foi cadastrado como amigo dupla por ${formData.referrer}. Este é um cadastro especial.`,
        });

      } else {
        // CADASTRO DE MEMBRO (NORMAL)
        // Cadastrando membro
        
        // Preparar dados para salvar no banco
        const memberData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          cep: formData.cep ? limparCep(formData.cep) : null, // ← Adicionar CEP limpo (somente números)
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const,
          campaign: linkData?.campaign || referrerData?.campaign || 'A', // Usar campanha do link primeiro, depois referrer, depois padrão A
          // Dados do parceiro (obrigatório)
          couple_name: formData.couple_name.trim(),
          couple_phone: formData.couple_phone,
          couple_instagram: formData.couple_instagram.trim(),
          couple_cep: formData.couple_cep ? limparCep(formData.couple_cep) : null, // ← Adicionar CEP do parceiro
          couple_city: formData.couple_city.trim(),
          couple_sector: formData.couple_sector.trim()
        };

        // Dados do membro a serem salvos

        // 1. Salvar membro na tabela members
        const memberResult = await addMember(memberData);
        
        if (!memberResult.success) {
          throw new Error(memberResult.error || "Erro ao salvar membro");
        }

        // 2. Salvar também na tabela users (para compatibilidade)
        const userData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const,
          campaign: linkData?.campaign || referrerData?.campaign || 'A' // Usar campanha do link primeiro, depois referrer, depois padrão A
        };

        const userResult = await addUser(userData);
        
        if (!userResult.success) {
          // Aviso: Erro ao salvar na tabela users
        }

        // 3. Criar credenciais compartilhadas para a dupla
        const userDataForCouple = {
          ...userData,
          full_name: `${formData.name} e ${formData.couple_name} - Dupla`,
          display_name: `${formData.name} & ${formData.couple_name}`,
          role: 'Membro',
          campaign: linkData?.campaign || referrerData?.campaign || 'A' // Usar campanha do link primeiro, depois referrer, depois padrão A
        };
        
        const credentialsResult = await createUserWithCredentials(userDataForCouple);
        
        if (!credentialsResult.success) {
          throw new Error((credentialsResult as { error: string }).error);
        }

        // Armazenar as credenciais reais criadas
        setUserCredentials({
          username: credentialsResult.credentials.username,
          password: credentialsResult.credentials.password
        });

        // 4. Sucesso - Membro cadastrado
        setIsSuccess(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Dupla cadastrada e vinculada a ${formData.referrer}. Uma conta compartilhada foi criada para ambos.`,
        });
      }

    } catch (error) {
      // Erro no cadastro
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir página de login em nova aba
  const handleOpenLogin = () => {
    // Abrir página de login em nova aba
    const loginUrl = `${window.location.origin}/login`;
    window.open(loginUrl, '_blank');
    
    toast({
      title: "Página de login aberta!",
      description: "Use suas credenciais acima para fazer login no sistema.",
    });
  };


  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        {/* Logo no topo */}
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>

        {/* Tela de Sucesso */}
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <UserPlus className="w-16 h-16 mx-auto mb-4" style={{ color: '#CFBA7F' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#14446C' }}>
              {editMode ? 'Atualização Realizada!' : 'Cadastro Realizado!'}
            </h2>
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: overlayColors.bgMedium }}>
              <p className="text-sm mb-2 text-gray-700">
                {editMode 
                  ? `${isMember ? 'Membro' : 'Amigo'} atualizado com sucesso!`
                  : 'Dupla cadastrada e vinculada com sucesso!'
                }
              </p>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg border" style={{ backgroundColor: overlayColors.bgLight, borderColor: overlayColors.border }}>
                  <p className="font-medium mb-2" style={{ color: '#14446C' }}>
                    {editMode ? 'Novas Credenciais' : 'Conta Compartilhada'}
                  </p>
                  <p className="text-gray-700"><strong>Usuário:</strong> {userCredentials?.username || formData.instagram.replace('@', '')}</p>
                  <p className="text-gray-700"><strong>Senha:</strong> {userCredentials?.password || `${formData.instagram.replace('@', '')}${formData.phone.slice(-4)}`}</p>
                  <p className="text-xs mt-2 text-gray-600">
                    Esta conta é compartilhada entre <strong>{formData.name}</strong> e <strong>{formData.couple_name}</strong>
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: overlayColors.bgMedium }}>
              <p className="text-sm text-gray-700">
                <strong>Cadastro vinculado a:</strong><br />
                {formData.referrer}
              </p>
              {linkData?.link_type === 'friends' && (
                <p className="text-sm mt-2 text-green-600">
                 Você foi cadastrado como amigo dupla por um membro com cadastro especial.
                </p>
              )}
            </div>
            <p className="text-sm p-3 rounded-lg mb-4 text-gray-700" style={{ backgroundColor: overlayColors.bgMedium }}>
              <strong>Como acessar:</strong> {linkData?.link_type === 'friends' 
                ? 'Este é um cadastro de amigo  O membro responsável receberá as informações de acesso.'
                : 'Ambos podem usar a mesma conta compartilhada para fazer login no sistema. A dupla compartilha o mesmo usuário, senha e link de cadastro. Clique no botão abaixo para entrar.'
              }
            </p>
            
            {/* Botão para Entrar no Sistema ou Voltar ao Dashboard */}
            {editMode ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full h-12 bg-[#CFBA7F] hover:bg-[#B8A570] text-white font-semibold text-lg rounded-lg transition-all duration-200 mb-4"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Voltar ao Dashboard
              </Button>
            ) : linkData?.link_type !== 'friends' && (
              <Button
                onClick={async () => {
                  try {
                    // Usar sempre o primeiro nome da pessoa
                    const firstName = formData.name.split(' ')[0];
                    setDisplayName(firstName);
                    
                    // Usar credenciais reais para login
                    const username = userCredentials?.username || formData.instagram.replace('@', '');
                    const password = userCredentials?.password || `${formData.instagram.replace('@', '')}${formData.phone.slice(-4)}`;
                    
                    // Fazer login direto
                    const result = await login(username, password);
                    if (result.success && result.user) {
                      // Atualizar display_name com o primeiro nome se for diferente
                      if (result.user.display_name !== firstName) {
                        try {
                          await supabase
                            .from('auth_users')
                            .update({ display_name: firstName })
                            .eq('username', username);
                        } catch (error) {
                          console.warn('Tivemos um problema ao atualizar display_name:', error);
                        }
                      }

                      toast({
                        title: "Login realizado com sucesso!",
                        description: `Bem-vindo, ${firstName}! Redirecionando...`,
                      });
                      
                      setTimeout(() => {
                        navigate('/dashboard');
                      }, 1500);
                    }
                  } catch (error) {
                    toast({
                      title: "Não foi possível entrar no sistema",
                      description: "Verifique suas credenciais e tente novamente.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full h-12 font-semibold text-lg rounded-lg transition-all duration-200 text-white"
                style={{ backgroundColor: '#CFBA7F' }}
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Confirmar e Entrar no Sistema
                </div>
              </Button>
            )}
          </div>
        </div>


        {/* Rodapé */}
        
      </div>
    );
  }

  // TELA DE LINK DESATIVADO
  if (isLinkDeactivated && !isEditMode) {
    return (
      <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
        {/* Logo no topo */}
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>

        {/* Card de Link Desativado */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
            {/* Ícone de Bloqueio */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#14446C' }}>
              Link Desativado
            </h1>

            {/* Mensagem */}
            <p className="text-gray-600 mb-6">
              {linkDeactivationMessage || 'Este link de cadastro foi desativado e não está mais disponível.'}
            </p>

            {/* Informações adicionais */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Possíveis razões:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 text-left list-disc list-inside">
                <li>O proprietário do link foi desativado</li>
                <li>A campanha foi encerrada</li>
                <li>O link expirou ou foi removido</li>
              </ul>
            </div>

            {/* Botão para voltar */}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-institutional-blue text-white py-3 px-4 rounded-lg font-semibold hover:bg-institutional-blue/90 transition-colors"
            >
              Voltar para a Página Inicial
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-white text-sm">
              Entre em contato com o administrador para mais informações.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
      {/* Logo no topo */}
      <div className="mb-8">
        <Logo size="lg" showText={true} layout="vertical" textColor="white" />
      </div>

      {/* Informação do Link */}
      <div className="mb-6 text-center">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <p className="text-white text-sm">
            <strong>Link gerado por:</strong>
          </p>
          {referrerData ? (
            <>
              <p className="font-bold text-institutional-gold">{referrerData.name}</p>
              <p className="text-gray-300 text-xs mt-1">{referrerData.role}</p>
            </>
          ) : (
            <p className="font-bold text-institutional-gold">{formData.referrer}</p>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {editMode 
            ? `Editar ${isMember ? 'Membro' : 'Amigo'}`
            : linkData?.link_type === 'friends' 
              ? 'Membro Cadastrando Amigo' 
              : 'Cadastre-se como Membro Conectado'
          }
        </h1>
        <p className="text-gray-300">
          {linkData?.link_type === 'friends' ? (
            <>
               Você está sendo cadastrado por um membro como amigo. Preencha os dados de ambos (você e sua parceira/parceiro) abaixo.
            </>
          ) : (
            <>
              
            </>
          )}
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        {/* Campo Nome */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo (ex: João Silva)"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.name ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.name && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.name}</span>
            </div>
          )}
        </div>

        {/* Campo CEP */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="CEP (12345-678)"
              value={formData.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.cep ? 'border-red-500' : ''}`}
              maxLength={9}
              required
              autoComplete="off"
            />
            {cepLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {formErrors.cep && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.cep}</span>
            </div>
          )}
        </div>


        {/* Campo Cidade */}
        <div className="space-y-1">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cidade (preenchida automaticamente pelo CEP)"
            value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.city ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.city && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.city}</span>
            </div>
          )}
        </div>

        {/* Campo Setor */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Setor (preenchido automaticamente pelo CEP)"
            value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.sector ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.sector && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.sector}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp (62) 99999-9999"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.phone ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.phone && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.phone}</span>
            </div>
          )}
        </div>

        {/* Campo Instagram */}
        <div className="space-y-1">
          <div className="relative">
            <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Instagram (@seuusuario)"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              onBlur={handleInstagramBlur}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.instagram ? 'border-red-500' : ''} ${instagramValidationError ? 'border-red-500' : ''}`}
              required
              disabled={isValidatingInstagram}
            />
            {/* Indicador de carregamento da validação */}
            {isValidatingInstagram && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Indicador de validação bem-sucedida */}
            {isInstagramValid && !isValidatingInstagram && !instagramValidationError && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          {(formErrors.instagram || instagramValidationError) && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.instagram || instagramValidationError}</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm font-medium">Dados da Segunda Pessoa</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* Campo Nome da Segunda Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo do Parceiro (ex: Maria Silva)"
              value={formData.couple_name}
              onChange={(e) => handleInputChange('couple_name', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_name ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.couple_name && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_name}</span>
            </div>
          )}
        </div>

        {/* Campo CEP do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="CEP do Parceiro (12345-678)"
              value={formData.couple_cep}
              onChange={(e) => handleInputChange('couple_cep', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_cep ? 'border-red-500' : ''}`}
              maxLength={9}
              required
              autoComplete="off"
            />
            {coupleCepLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
          </div>
            )}
          </div>
          {formErrors.couple_cep && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_cep}</span>
            </div>
          )}
        </div>


        {/* Campo Cidade do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cidade do Parceiro (preenchida automaticamente pelo CEP)"
            value={formData.couple_city}
              onChange={(e) => handleInputChange('couple_city', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.couple_city ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.couple_city && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_city}</span>
            </div>
          )}
        </div>

        {/* Campo Setor do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Setor do Parceiro (preenchido automaticamente pelo CEP)"
            value={formData.couple_sector}
              onChange={(e) => handleInputChange('couple_sector', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.couple_sector ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.couple_sector && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_sector}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp do Parceiro (62) 99999-9999"
              value={formData.couple_phone}
              onChange={(e) => handleInputChange('couple_phone', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_phone ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.couple_phone && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_phone}</span>
            </div>
          )}
        </div>

        {/* Campo Instagram da Segunda Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Instagram da Segunda Pessoa (@seuusuario)"
              value={formData.couple_instagram}
              onChange={(e) => handleInputChange('couple_instagram', e.target.value)}
              onBlur={handleCoupleInstagramBlur}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_instagram ? 'border-red-500' : ''} ${coupleInstagramValidationError ? 'border-red-500' : ''}`}
              required
              disabled={isValidatingCoupleInstagram}
            />
            {/* Indicador de carregamento da validação */}
            {isValidatingCoupleInstagram && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Indicador de validação bem-sucedida */}
            {isCoupleInstagramValid && !isValidatingCoupleInstagram && !coupleInstagramValidationError && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
          {(formErrors.couple_instagram || coupleInstagramValidationError) && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_instagram || coupleInstagramValidationError}</span>
            </div>
          )}
        </div>

        {/* Campo Nome da pessoa que indicou (readonly) */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Nome da pessoa que indicou"
            value={formData.referrer}
            readOnly
            className="pl-12 h-12 bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-400 rounded-lg cursor-not-allowed"
          />
        </div>

        {/* Botão Cadastrar/Atualizar */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-[#CFBA7F] hover:bg-[#B8A570] text-white font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {editMode ? 'Atualizando...' : 'Cadastrando...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {editMode ? 'Atualizar' : 'Finalizar Cadastro'}
            </div>
          )}
        </Button>

        {/* Informação adicional */}
       
      </div>



    </div>
  );
}
