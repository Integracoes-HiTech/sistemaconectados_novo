import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import EditMemberModal from "@/components/EditMemberModal";
import EditFriendModal from "@/components/EditFriendModal";
import EditSaudePersonModal from "@/components/EditSaudePersonModal";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  Users, 
  MessageSquare, 
  Link as LinkIcon, 
  TrendingUp, 
  Calendar,
  Share2,
  ChevronRight,
  BarChart3,
  Search,
  Phone,
  Mail,
  Instagram,
  User,
  User as UserIcon,
  MapPin,
  Building,
  Home,
  CalendarDays,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  XCircle,
  CheckCircle,
  FileText,
  Package,
  DollarSign
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useUserLinks } from "@/hooks/useUserLinks";
import { usePlanos } from "@/hooks/usePlanos";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useMembers } from "@/hooks/useMembers";
import type { Member } from "@/hooks/useMembers";
import { useFriendsRanking } from "@/hooks/useFriendsRanking";
import type { FriendRanking } from "@/hooks/useFriendsRanking";
import { useExportReports } from "@/hooks/useExportReports";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useSaudePeople } from "@/hooks/useSaudePeople";
import type { SaudePerson } from "@/hooks/useSaudePeople";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign } from "@/hooks/useCampaigns";
import { useAdmins } from "@/hooks/useAdmins";
import type { AdminUser } from "@/hooks/useAdmins";
import { supabaseServerless } from "@/lib/supabase";

export default function Dashboard() {
  
  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    // Se tem 11 dígitos (55 + DDD + número)
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }
    // Se tem 10 dígitos (DDD + número)
    if (numbers.length === 10) {
      return `(55) ${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    // Retorna como está se não conseguir formatar
    return phone;
  };

  // Função para formatar telefone para exportação Excel (formato: 556293628028)
  const formatPhoneForExport = (phone: string) => {
    if (!phone) return '';
    
    // Remove todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se já começa com 55, remove para processar
    if (cleaned.startsWith('55')) {
      cleaned = cleaned.substring(2);
    }
    
    // Se tem 11 dígitos (DDD + 9 + 8 dígitos), remove o 9
    if (cleaned.length === 11 && cleaned.charAt(2) === '9') {
      cleaned = cleaned.substring(0, 2) + cleaned.substring(3);
    }
    
    // Se tem 10 dígitos (DDD + 8 dígitos), mantém como está
    // Retorna sempre com 55 no início
    return '55' + cleaned;
  };
  
  const [userLink, setUserLink] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneSearchTerm, setPhoneSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReferrer, setFilterReferrer] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterSector, setFilterSector] = useState("");
  
  // Filtros para amigos
  const [friendsSearchTerm, setFriendsSearchTerm] = useState("");
  const [friendsPhoneSearchTerm, setFriendsPhoneSearchTerm] = useState("");
  const [friendsMemberFilter, setFriendsMemberFilter] = useState("");
  const [friendsFilterCity, setFriendsFilterCity] = useState("");
  const [friendsFilterSector, setFriendsFilterSector] = useState("");
  
  // Filtros para pessoas de saúde (admin3)
  const [saudeSearchTerm, setSaudeSearchTerm] = useState("");
  const [saudePhoneSearchTerm, setSaudePhoneSearchTerm] = useState("");
  const [saudeLeaderFilter, setSaudeLeaderFilter] = useState("");
  
  // Estados de paginação
  const [membersCurrentPage, setMembersCurrentPage] = useState(1);
  const [friendsCurrentPage, setFriendsCurrentPage] = useState(1);
  const [saudePeopleCurrentPage, setSaudePeopleCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 50 itens por página para melhor performance com grandes volumes
  
  // Estados para o modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; member: { id: string; name: string } | null }>({
    isOpen: false,
    member: null
  });
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<{ id: string; name: string; [key: string]: unknown } | null>(null);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  
  // Estados para o modal de edição de amigos
  const [isEditFriendModalOpen, setIsEditFriendModalOpen] = useState(false);
  const [selectedFriendForEdit, setSelectedFriendForEdit] = useState<{ id: string; name: string; [key: string]: unknown } | null>(null);
  
  // Estado para o modal de confirmação de exclusão de amigos
  const [deleteFriendConfirmModal, setDeleteFriendConfirmModal] = useState<{ isOpen: boolean; friend: { id: string; name: string } | null }>({
    isOpen: false,
    friend: null
  });

  // Estado para o modal de confirmação de exclusão de pessoas de saúde
  const [deleteSaudePersonConfirmModal, setDeleteSaudePersonConfirmModal] = useState<{ isOpen: boolean; person: { id: string; name: string } | null }>({
    isOpen: false,
    person: null
  });

  // Estados para o modal de edição de pessoas de saúde
  const [isEditSaudePersonModalOpen, setIsEditSaudePersonModalOpen] = useState(false);
  const [selectedSaudePersonForEdit, setSelectedSaudePersonForEdit] = useState<SaudePerson | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAdmin3, isAdmin9, isAdminHitech, isMembro, isAmigo, isConvidado, canViewAllUsers, canViewOwnUsers, canViewStats, canGenerateLinks, canDeleteUsers, canExportReports, isFullAdmin, isFelipeCampaignA, canModifyLinkTypes, loading } = useAuth();
  const { features: planFeatures, loading: planFeaturesLoading } = usePlanFeatures();
  
  // Função para verificar se usuário tem plano Pessoas
  const isSaudePlan = () => {
    return planFeatures.planName && (
      planFeatures.planName.toLowerCase().includes('pessoas')
    );
  };

  // Proteção de rota - redirecionar para login se não estiver autenticado (após carregamento)
  useEffect(() => {
    // Verificar se há dados de usuário no localStorage antes de redirecionar
    const hasUserInStorage = !!localStorage.getItem('loggedUser')
    
    if (!loading && !user && !hasUserInStorage) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Estado para armazenar cores da campanha do banco
  // Função para buscar cor inicial da campanha do localStorage
  const getInitialCampaignColors = (): { background: string; primary: string; secondary: string; } | null => {
    try {
      const loggedUser = localStorage.getItem('loggedUser');
      if (loggedUser) {
        const userData = JSON.parse(loggedUser);
        const campaignCode = userData.campaign;
        
        // Tentar buscar do localStorage se já foi salvo antes
        const savedColors = localStorage.getItem(`campaign_colors_${campaignCode}`);
        if (savedColors) {
          return JSON.parse(savedColors);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar cores iniciais:', err);
    }
    return null;
  };

  const [campaignColors, setCampaignColors] = useState<{
    background: string;
    primary: string;
    secondary: string;
  } | null>(getInitialCampaignColors());

  // Buscar dados do usuário do localStorage para exibição imediata
  const [quickUserData] = useState<{name: string, role: string} | null>(() => {
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

  // Buscar cores da campanha do banco
  useEffect(() => {
    const fetchCampaignColors = async () => {
      if (!user?.campaign) {
        return;
      }
      
      try {
        const { data, error } = await supabaseServerless
          .from('campaigns')
          .select('primary_color, secondary_color')
          .eq('code', user.campaign)
          .single();
        
        if (error) {
          throw error;
        }

        if (data) {
          const colors = {
            background: data.primary_color,
            primary: data.primary_color,
            secondary: data.secondary_color
          };
          // Salvar no localStorage para próxima vez
          localStorage.setItem(`campaign_colors_${user.campaign}`, JSON.stringify(colors));
          setCampaignColors(colors);
        }
      } catch (err) {
        // Silently fail - usar fallback inline
      }
    };
    
    fetchCampaignColors();
  }, [user?.campaign]);

  // Configuração de cores por campanha
  const getCampaignTheme = () => {
    if (user?.campaign === 'B') {
      return {
        primary: 'bg-blue-600',
        primaryHover: 'hover:bg-blue-700',
        primaryLight: 'bg-blue-50',
        primaryBorder: 'border-blue-200',
        primaryText: 'text-blue-800',
        primaryAccent: 'bg-blue-100',
        primaryButton: 'bg-blue-600 hover:bg-blue-700',
        primaryCard: 'border-l-blue-500',
        primaryBadge: 'bg-blue-100 text-blue-800',
        primaryIcon: 'text-blue-600',
        primaryGradient: 'from-blue-500 to-blue-600',
        primaryShadow: 'shadow-blue-200'
      };
    } else {
      // Campanha A (padrão)
      return {
        primary: 'bg-blue-600',
        primaryHover: 'hover:bg-blue-700',
        primaryLight: 'bg-blue-50',
        primaryBorder: 'border-blue-200',
        primaryText: 'text-blue-800',
        primaryAccent: 'bg-blue-100',
        primaryButton: 'bg-blue-600 hover:bg-blue-700',
        primaryCard: 'border-l-blue-500',
        primaryBadge: 'bg-blue-100 text-blue-800',
        primaryIcon: 'text-blue-600',
        primaryGradient: 'from-blue-500 to-blue-600',
        primaryShadow: 'shadow-blue-200'
      };
    }
  };

  const theme = getCampaignTheme();

  // Funções para verificar planos

  // Função para editar membro (disponível para todos os administradores, incluindo Felipe da campanha A)
  const handleEditMember = (member: { id: string; name: string; [key: string]: unknown }) => {
    // Felipe Admin (não da campanha A) não pode editar, mas Felipe da campanha A pode
    if (user?.username?.toLowerCase() === 'felipe' && !isFelipeCampaignA()) {
      toast({
        title: "Acesso negado",
        description: "Felipe Admin não tem permissão para editar membros.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se é administrador ou membro
    if (isAdmin()) {
      // Administrador: usar modal
      setSelectedMemberForEdit(member);
      setIsEditModalOpen(true);
    } else {
      // Membro: usar página PublicRegister (lógica antiga)
      navigate('/cadastro/edit-member', { 
        state: { 
          editMode: true, 
          memberData: member,
          isMember: true,
          loggedUser: user // Passar informações do usuário logado
        } 
      });
    }
  };

  // Função para fechar o modal de edição
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMemberForEdit(null);
  };

  // Função para quando a edição for bem-sucedida
  const handleEditSuccess = async () => {
    try {
      // Recarregar dados dos membros
      await refetchMembers();
      
      // Recarregar estatísticas
      await fetchStats();
      
      // Recarregar relatórios se tiver permissão
      if (planFeatures.canViewReports) {
        await fetchReportData();
      }
      
      // Forçar re-render da tabela
      setTableRefreshKey(prev => prev + 1);
      
      toast({
        title: "Sucesso",
        description: "Membro editado e dados atualizados com sucesso!",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Aviso",
        description: "Membro editado, mas houve erro ao atualizar a tela.",
        variant: "default",
      });
    }
  };

  // Função para editar friend (disponível para todos os administradores, incluindo Felipe da campanha A)
  const handleEditFriend = (friend: { id: string; name: string; [key: string]: unknown }) => {
    // Felipe Admin (não da campanha A) não pode editar, mas Felipe da campanha A pode
    if (user?.username?.toLowerCase() === 'felipe' && !isFelipeCampaignA()) {
      toast({
        title: "Acesso negado",
        description: "Felipe Admin não tem permissão para editar amigos.",
        variant: "destructive",
      });
      return;
    }
    
    // Abrir modal de edição de amigo
    setSelectedFriendForEdit(friend);
    setIsEditFriendModalOpen(true);
  };

  // Função para fechar modal de edição de amigo
  const handleCloseEditFriendModal = () => {
    setIsEditFriendModalOpen(false);
    setSelectedFriendForEdit(null);
  };

  // Função para quando a edição de amigo for bem-sucedida
  const handleEditFriendSuccess = async () => {
    try {
      // Recarregar dados dos amigos
      await fetchFriendsRanking();
      
      // Recarregar estatísticas
      await fetchStats();
      
      // Forçar re-render da tabela
      setTableRefreshKey(prev => prev + 1);
      
      toast({
        title: "Sucesso",
        description: "Amigo editado e dados atualizados com sucesso!",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Aviso",
        description: "Amigo editado, mas houve erro ao atualizar a tela.",
        variant: "default",
      });
    }
  };

  // Função para remover membro (soft delete - apenas administradores completos)
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!canDeleteUsers()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores completos podem remover membros.",
        variant: "destructive",
      });
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      member: { id: memberId, name: memberName }
    });
  };

  const confirmDeleteMember = async () => {
    if (!deleteConfirmModal.member) return;

    try {
      const memberId = deleteConfirmModal.member.id;
      const memberName = deleteConfirmModal.member.name;
      const deletedAt = new Date().toISOString();

      // 1. Buscar dados do membro para obter Instagram
      const { data: memberData, error: fetchError } = await supabaseServerless
        .from('members')
        .select('instagram, is_friend')
        .eq('id', memberId)
        .single();

      if (fetchError) {
        throw new Error('Erro ao buscar dados do membro');
      }

      // 2. Soft delete em todas as tabelas relacionadas
      
      // Atualizar tabela members
      const { error: membersError } = await supabaseServerless
        .from('members')
        .update({ deleted_at: deletedAt })
        .eq('id', memberId)
        .select();

      if (membersError) {
        throw new Error('Erro ao excluir membro');
      }

      // Atualizar tabela users (se existir)
      try {
        await supabaseServerless
          .from('users')
          .update({ deleted_at: deletedAt })
          .eq('instagram', memberData.instagram)
          .select();
      } catch (usersError) {
        // Não é crítico se falhar na tabela users
      }

      // Atualizar tabela auth_users (se existir)
      try {
        await supabaseServerless
          .from('auth_users')
          .update({ deleted_at: deletedAt })
          .eq('instagram', memberData.instagram)
          .select();
      } catch (authUsersError) {
        // Não é crítico se falhar na tabela auth_users
      }

      // Atualizar tabela user_links (se existir)
      try {
        await supabaseServerless
          .from('user_links')
          .update({ deleted_at: deletedAt })
          .eq('user_id', memberId)
          .select();
      } catch (userLinksError) {
        // Não é crítico se falhar na tabela user_links
      }

      // Atualizar tabela friends (se for um amigo)
      if (memberData.is_friend) {
        try {
          await supabaseServerless
            .from('friends')
            .update({ deleted_at: deletedAt })
            .eq('member_id', memberId);
        } catch (friendsError) {
          // Não é crítico se falhar na tabela friends
        }
      }

      // Atualizar ranking após exclusão (para recalcular posições)
      await updateRanking();
      
      // Recarregar dados dos membros
      await refetchMembers();
      
        toast({
          title: "Membro excluído",
        description: `O membro "${memberName}" foi excluído com sucesso. Ranking atualizado.`,
      });
      
      // Refresh automático dos relatórios e estatísticas
      await fetchStats();
      if (planFeatures.canViewReports) {
        await fetchReportData();
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir membro",
        description: "Ocorreu um erro ao tentar excluir o membro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmModal({ isOpen: false, member: null });
    }
  };

  const cancelDeleteMember = () => {
    setDeleteConfirmModal({ isOpen: false, member: null });
  };

  // Função para remover amigo (abre modal de confirmação)
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    if (!canDeleteUsers()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores completos podem remover amigos.",
        variant: "destructive",
      });
      return;
    }

    setDeleteFriendConfirmModal({
      isOpen: true,
      friend: { id: friendId, name: friendName }
    });
  };

  // Função para confirmar exclusão do amigo
  const confirmDeleteFriend = async () => {
    if (!deleteFriendConfirmModal.friend) return;

    try {
      const friendId = deleteFriendConfirmModal.friend.id;
      const friendName = deleteFriendConfirmModal.friend.name;

      // Usar a função do hook que já faz soft delete e atualiza contadores
      const result = await softDeleteFriend(friendId);

      if (result.success) {
        toast({
          title: "Amigo excluído",
          description: `O amigo "${friendName}" foi excluído com sucesso. Contratos e ranking atualizados.`,
        });
        
        // Recarregar dados dos membros para atualizar estatísticas
        await refetchMembers();
        
        // Refresh automático dos relatórios e estatísticas
        await fetchStats();
        
        if (planFeatures.canViewReports) {
          await fetchReportData();
        }
        
        // Recarregar também a lista de amigos
        await fetchFriendsRanking();
      } else {
        console.error('❌ Erro ao excluir amigo:', result.error);
        toast({
          title: "Erro ao excluir amigo",
          description: result.error || "Ocorreu um erro ao tentar excluir o amigo. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro na exclusão de amigo:', error);
      toast({
        title: "Erro ao excluir amigo",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar excluir o amigo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleteFriendConfirmModal({ isOpen: false, friend: null });
    }
  };

  // Função para cancelar exclusão do amigo
  const cancelDeleteFriend = () => {
    setDeleteFriendConfirmModal({ isOpen: false, friend: null });
  };

  // Função para remover pessoa de saúde - abre modal de confirmação
  const handleRemoveSaudePerson = (personId: string, personName: string) => {
    if (!isAdmin3() && !isSaudePlan()) {
      toast({
        title: "Acesso negado",
        description: "Apenas admin3 ou usuários com plano Saúde podem remover pessoas.",
        variant: "destructive",
      });
      return;
    }

    // Abrir modal de confirmação
    setDeleteSaudePersonConfirmModal({
      isOpen: true,
      person: { id: personId, name: personName }
    });
  };

  // Função para confirmar exclusão de pessoa de saúde
  const confirmDeleteSaudePerson = async () => {
    const personId = deleteSaudePersonConfirmModal.person?.id;
    const personName = deleteSaudePersonConfirmModal.person?.name;

    if (!personId || !personName) return;

    try {
      const success = await softDeleteSaudePerson(personId);
      
      if (success) {
        toast({
          title: "✅ Pessoa excluída",
          description: `"${personName}" foi excluído(a) com sucesso.`,
        });
        
        // Fechar modal
        setDeleteSaudePersonConfirmModal({ isOpen: false, person: null });
        
        // Refresh automático dos relatórios e estatísticas
        await fetchStats();
        if (planFeatures.canViewReports) {
          await fetchReportData();
        }
      } else {
        throw new Error("Erro ao excluir pessoa");
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro ao excluir pessoa",
        variant: "destructive",
      });
    }
  };

  // Função para cancelar exclusão de pessoa de saúde
  const cancelDeleteSaudePerson = () => {
    setDeleteSaudePersonConfirmModal({ isOpen: false, person: null });
  };

  // Função para editar pessoa de saúde - abre modal
  const handleEditSaudePerson = (person: SaudePerson) => {
    if (!isAdmin3() && !isSaudePlan()) {
      toast({
        title: "Acesso negado",
        description: "Apenas admin3 ou usuários com plano Saúde podem editar pessoas.",
        variant: "destructive",
      });
      return;
    }

    // Abrir modal de edição
    setSelectedSaudePersonForEdit(person);
    setIsEditSaudePersonModalOpen(true);
  };

  // Função para fechar modal de edição de pessoa de saúde
  const handleCloseEditSaudePersonModal = () => {
    setIsEditSaudePersonModalOpen(false);
    setSelectedSaudePersonForEdit(null);
  };

  // Função chamada quando a edição é bem-sucedida
  const handleEditSaudePersonSuccess = async () => {
    await fetchSaudePeople();
    await fetchStats();
    if (planFeatures.canViewReports) {
      await fetchReportData();
    }
  };

  // Função para exportar pessoas de saúde para Excel
  const exportSaudePeopleToExcel = () => {
    if (!filteredSaudePeople || filteredSaudePeople.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há pessoas cadastradas para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Mapear dados para formato Excel com os campos corretos da tabela saude_people
    const dataToExport = filteredSaudePeople.map(person => ({
      'Líder - Nome Completo': person.lider_nome_completo || '',
      'Líder - WhatsApp': formatPhoneForExport(person.lider_whatsapp || ''),
      'Pessoa - Nome Completo': person.pessoa_nome_completo || '',
      'Pessoa - WhatsApp': formatPhoneForExport(person.pessoa_whatsapp || ''),
      'CEP': person.cep || 'N/A',
      'Cidade': person.cidade || 'N/A',
      'Observações': person.observacoes || '',
      'Data de Cadastro': person.created_at ? new Date(person.created_at).toLocaleDateString('pt-BR') : ''
    }));

    exportToExcel(dataToExport, 'pessoas-saude.xlsx', 'Pessoas Saúde');
    
    toast({
      title: "✅ Exportado!",
      description: "Dados de saúde exportados para Excel com sucesso.",
    });
  };

  // Função para exportar pessoas de saúde para PDF com cards bonitos
  const handleExportSaudePeopleToPDF = () => {
    if (!filteredSaudePeople || filteredSaudePeople.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há pessoas cadastradas para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Usar a função específica de PDF com cards
    exportSaudePeopleToPDF(filteredSaudePeople);
    
    toast({
      title: "✅ PDF Exportado!",
      description: "Relatório de saúde exportado com sucesso.",
    });
  };

  // Funções para AdminHitech - Gerenciar Campanhas
  const handleEditCampaign = (campaign: Campaign) => {
    if (!isAdminHitech()) {
      toast({
        title: "Acesso negado",
        description: "Apenas AdminHitech pode editar campanhas.",
        variant: "destructive",
      });
      return;
    }

    // Navegar para a página de edição de campanha com os dados
    navigate('/cadastro-campanha', { 
      state: { 
        editMode: true, 
        campaignData: campaign 
      } 
    });
  };

  const handleToggleCampaignStatus = async (campaign: Campaign) => {
    if (!isAdminHitech()) {
      toast({
        title: "Acesso negado",
        description: "Apenas AdminHitech pode alterar status de campanhas.",
        variant: "destructive",
      });
      return;
    }

    try {
      
      const result = await toggleCampaignStatus(campaign.code, campaign.is_active);
      
      if (result.success) {
        toast({
          title: campaign.is_active ? "✅ Campanha desativada!" : "✅ Campanha reativada!",
          description: campaign.is_active 
            ? `A campanha "${campaign.name}" e todos seus usuários foram desativados.`
            : `A campanha "${campaign.name}" e todos seus usuários foram reativados.`,
        });
        
        // Refresh automático dos dados
        await fetchCampaigns();
        await fetchAdmins(); // Atualizar administradores também
      } else {
        console.error('❌ Erro no toggle da campanha:', result.error);
        toast({
          title: "Erro ao alterar status",
          description: result.error || "Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Erro geral no toggle da campanha:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!isAdminHitech()) {
      toast({
        title: "Acesso negado",
        description: "Apenas AdminHitech pode excluir campanhas.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a campanha "${campaignName}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      const result = await deleteCampaign(campaignId);
      
      if (result.success) {
        toast({
          title: "✅ Campanha excluída",
          description: `A campanha "${campaignName}" foi excluída com sucesso.`,
        });
      } else {
        throw new Error(result.error || "Erro ao excluir campanha");
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro ao excluir campanha",
        variant: "destructive",
      });
    }
  };

  // Funções para AdminHitech - Gerenciar Admins
  const handleDeleteAdmin = async (adminId: string, adminUsername: string) => {
    if (!isAdminHitech()) {
      toast({
        title: "Acesso negado",
        description: "Apenas AdminHitech pode excluir admins.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o admin "${adminUsername}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      const result = await deleteAdmin(adminId);
      
      if (result.success) {
        toast({
          title: "✅ Admin excluído",
          description: `O admin "${adminUsername}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error(result.error || "Erro ao excluir admin");
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro ao excluir admin",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdminStatus = async (adminId: string, adminUsername: string, currentStatus: boolean) => {
    if (!isAdminHitech()) {
      toast({
        title: "Acesso negado",
        description: "Apenas AdminHitech pode alterar status de admins.",
        variant: "destructive",
      });
      return;
    }

    try {
      
      const result = await toggleAdminStatus(adminId, currentStatus);
      
      if (result.success) {
        toast({
          title: "✅ Status atualizado",
          description: `O admin "${adminUsername}" foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
        });
        
        // Refresh automático dos dados
        await fetchAdmins();
        await fetchCampaigns(); // Atualizar campanhas também
      } else {
        console.error('❌ Erro no toggle do admin:', result.error);
        throw new Error(result.error || "Erro ao atualizar status");
      }
    } catch (error) {
      console.error('💥 Erro geral no toggle do admin:', error);
      toast({
        title: "❌ Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  // Lógica de filtro por referrer:
  // Admin veem todos os usuários (sem filtro)
  // - Outros roles: vê apenas usuários que eles indicaram (filtro por user.name para membros)
  const isAdminUser = isAdmin();
  
  // Extrair nome simples para filtrar (remover sufixos como "- Membro", "- Amigo", etc.)
  const extractSimpleName = (fullName?: string): string | undefined => {
    if (!fullName) return undefined;
    const cleanName = fullName.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
    return cleanName;
  };
  
  const referrerFilter = isAdminUser ? undefined : extractSimpleName(user?.name);
  const userIdFilter = isAdminUser ? undefined : user?.id;
  
  // Usar campaign_id quando disponível, caso contrário usar campaign (texto) para compatibilidade
  // Para admin, usar campaign_id da campanha dele para filtrar os dados
  const campaignFilter = user?.campaign_id || user?.campaign || null;
  
  const { users: allUsers, loading: usersLoading } = useUsers(referrerFilter, campaignFilter, user?.campaign_id);
  const { stats, loading: statsLoading, fetchStats } = useStats(referrerFilter, campaignFilter, user?.campaign_id);
  const { reportData, loading: reportsLoading, fetchReportData } = useReports(
    (isAdminUser || planFeatures.canViewReports || planFeatures.canViewRecentRegistrations) ? referrerFilter : null, 
    (isAdminUser || planFeatures.canViewReports || planFeatures.canViewRecentRegistrations) ? campaignFilter : null,
    (isAdminUser || planFeatures.canViewReports || planFeatures.canViewRecentRegistrations) ? user?.campaign_id : null
  );
  
  const { userLinks, createLink, loading: linksLoading } = useUserLinks(userIdFilter, campaignFilter, user?.campaign_id);
  
  // Novos hooks para o sistema de membros
  const { 
    members, 
    memberStats, 
    systemSettings, 
    loading: membersLoading,
    getRankingStatusColor,
    getRankingStatusIcon,
    getTopMembers,
    getMembersByStatus,
    getMemberRole,
    softDeleteMember,
    updateRanking,
    refetch: refetchMembers
  } = useMembers(referrerFilter, campaignFilter, planFeatures.maxMembers, user?.campaign_id);

  // Hook para ranking de amigos
  const { 
    friends, 
    loading: friendsLoading,
    error: friendsError,
    getFriendsStats,
    softDeleteFriend,
    fetchFriendsRanking
  } = useFriendsRanking(campaignFilter, user?.campaign_id);

  
  
  const { 
    exportToPDF, 
    exportToExcel,
    exportMembersToExcel, 
    exportContractsToExcel, 
    exportReportDataToPDF,
    exportFriendsToExcel,
    exportMembersToPDF,
    exportFriendsToPDF,
    exportSaudePeopleToPDF
  } = useExportReports();
  
  const { 
    settings, 
    phases, 
    loading: settingsLoading,
    shouldShowMemberLimitAlert,
    getMemberLimitStatus,
    canActivatePaidContracts,
    activatePaidContractsPhase,
    updateMemberLinksType
  } = useSystemSettings();

  // Hook para pessoas da campanha de saúde (sempre chamar, mas só usar se admin3 ou plano Saúde)
  const { 
    people: saudePeople, 
    loading: saudePeopleLoading,
    softDeletePerson: softDeleteSaudePerson,
    updateSaudePerson,
    fetchSaudePeople
  } = useSaudePeople(user?.campaign, user?.campaign_id);

  // Hooks para AdminHitech - Campanhas e Admins
  const {
    campaigns,
    loading: campaignsLoading,
    deleteCampaign,
    toggleCampaignStatus,
    fetchCampaigns
  } = useCampaigns();

  const {
    admins,
    loading: adminsLoading,
    deleteAdmin,
    toggleAdminStatus,
    fetchAdmins
  } = useAdmins();

  const {
    planos,
    loading: planosLoading,
    togglePlanoStatus,
    fetchPlanos
  } = usePlanos();

  // Verificar o que está sendo passado para os hooks
  // Verificar dados carregados

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-institutional-blue">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const generateLink = async () => {
    if (!user?.id || !user?.full_name) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
    const result = await createLink(user.id, user.full_name);
    
    if (result.success && result.data) {
      const newLink = `${window.location.origin}/cadastro/${result.data.link_id}`;
      setUserLink(newLink);
      
      // Copiar para área de transferência
      navigator.clipboard.writeText(newLink);
      
      toast({
        title: "Link gerado e copiado!",
        description: `Link específico para ${user.name} foi copiado para a área de transferência.`,
        });
      } else {
        // Verificar se é erro de limite atingido
        if ('error' in result && result.error === 'LIMIT_REACHED') {
          const limitResult = result as {
            error: string;
            limitType?: string;
            current?: number;
            max?: number;
            planName?: string;
          };
          
          const limitTypeText = limitResult.limitType === 'members' ? 'membros' : 'amigos';
          const current = limitResult.current || 0;
          const max = limitResult.max || 0;
          const planName = limitResult.planName || 'atual';
          
          toast({
            title: "⚠️ Limite Atingido",
            description: `Limite de ${limitTypeText} atingido (${current}/${max}). Faça upgrade do plano ${planName} para continuar cadastrando.`,
            variant: "destructive",
            duration: 7000, // Exibir por 7 segundos
      });
    } else {
      toast({
        title: "Erro ao gerar link",
        description: 'error' in result ? result.error : "Tente novamente.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };




  // Filtrar membros baseado na pesquisa e filtros específicos (apenas membros, não amigos)
  const filteredMembers = members.filter(member => {
    // Filtrar por campanha primeiro
    if (member.campaign !== user?.campaign) return false;
    
    // Se for membro (não admin), mostrar apenas membros vinculados a ele
    if (isMembro() && !isAdmin()) {
      // Verificar se o membro foi cadastrado através do link do usuário atual
      // Extrair nome simples do referrer para comparação
      const extractSimpleName = (fullName: string): string => {
        const cleanName = fullName.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
        return cleanName;
      };

      const simpleReferrerName = extractSimpleName(member.referrer);
      const simpleUserName = extractSimpleName(user?.name || '');
      
      // Comparar nome simples do referrer com nome simples do usuário
      const isMatch = simpleReferrerName === simpleUserName;
      
      // Debug temporário
      console.log("🔍 Debug Members Filter:", {
        memberName: member.name,
        memberReferrer: member.referrer,
        simpleReferrerName,
        userName: user?.name,
        simpleUserName,
        isMatch
      });
      
      if (!isMatch) {
        return false;
      }
    }
    
    // Filtrar apenas membros (não amigos)
    if (member.is_friend) return false;
    
    const matchesSearch = searchTerm === "" || 
      // Campos da primeira pessoa
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.referrer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Campos do parceiro
      member.couple_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Campos adicionais
      member.contracts_completed.toString().includes(searchTerm) ||
      member.ranking_position?.toString().includes(searchTerm) ||
      member.ranking_status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPhone = phoneSearchTerm === "" || 
      member.phone.includes(phoneSearchTerm) ||
      member.couple_phone.includes(phoneSearchTerm);

    const matchesStatus = filterStatus === "" || member.ranking_status === filterStatus;
    
    const matchesReferrer = filterReferrer === "" || member.referrer.toLowerCase().includes(filterReferrer.toLowerCase());
    
    const matchesCity = filterCity === "" || member.city.toLowerCase().includes(filterCity.toLowerCase());
    
    const matchesSector = filterSector === "" || member.sector.toLowerCase().includes(filterSector.toLowerCase());

    return matchesSearch && matchesPhone && matchesStatus && matchesReferrer && matchesCity && matchesSector;
  }).sort((a, b) => {
    // Ordenar por ranking_position (menor número = melhor posição = mais contratos)
    // Se ranking_position for null, colocar no final
    if (a.ranking_position === null && b.ranking_position === null) return 0;
    if (a.ranking_position === null) return 1;
    if (b.ranking_position === null) return -1;
    return a.ranking_position - b.ranking_position;
  });

  // Filtrar amigos baseado na pesquisa e filtros específicos
  const filteredFriends = friends.filter(friend => {
    // Filtrar por campanha primeiro
    if (friend.campaign !== user?.campaign) return false;
    
    // Se for membro (não admin), mostrar apenas amigos vinculados a ele
    if (isMembro() && !isAdmin()) {
      // Verificar se o amigo foi cadastrado através do link do usuário atual
      // Extrair nome simples do referrer para comparação
      const extractSimpleName = (fullName: string): string => {
        const cleanName = fullName.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
        return cleanName;
      };

      const simpleReferrerName = extractSimpleName(friend.referrer);
      const simpleUserName = extractSimpleName(user?.name || '');
      
      // Comparar nome simples do referrer com nome simples do usuário
      const isMatch = simpleReferrerName === simpleUserName;
      
      if (!isMatch) {
        return false;
      }
    }
    
    const matchesSearch = friendsSearchTerm === "" || 
      // Campos da primeira pessoa
      friend.name.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.instagram.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.city.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.sector.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.referrer.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      // Campos do parceiro
      friend.couple_name.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_instagram.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_city.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_sector.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      // Campos adicionais
      friend.contracts_completed.toString().includes(friendsSearchTerm);

    const matchesPhone = friendsPhoneSearchTerm === "" || 
      friend.phone.includes(friendsPhoneSearchTerm) ||
      friend.couple_phone.includes(friendsPhoneSearchTerm);

    const matchesMember = friendsMemberFilter === "" || friend.member_name.toLowerCase().includes(friendsMemberFilter.toLowerCase());
    
    const matchesCity = friendsFilterCity === "" || 
      friend.city.toLowerCase().includes(friendsFilterCity.toLowerCase()) ||
      friend.couple_city.toLowerCase().includes(friendsFilterCity.toLowerCase());
    
    const matchesSector = friendsFilterSector === "" || 
      friend.sector.toLowerCase().includes(friendsFilterSector.toLowerCase()) ||
      friend.couple_sector.toLowerCase().includes(friendsFilterSector.toLowerCase());

    return matchesSearch && matchesPhone && matchesMember && matchesCity && matchesSector;
  }).sort((a, b) => {
    // Ordenar por contracts_completed (mais usuários cadastrados = melhor posição)
    if (a.contracts_completed !== b.contracts_completed) {
      return b.contracts_completed - a.contracts_completed;
    }
    // Se contracts_completed for igual, ordenar por data de criação
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Funções de paginação
  const getTotalPages = (totalItems: number) => Math.ceil(totalItems / itemsPerPage);
  
  const getPaginatedData = (data: Member[] | FriendRanking[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Filtrar pessoas de saúde (admin3)
  const filteredSaudePeople = saudePeople.filter(person => {
    // Filtrar por campaign_id do usuário logado (IMPORTANTE: isolamento entre campanhas)
    const matchesCampaign = !user?.campaign_id || person.campaign_id === user.campaign_id;
    
    const matchesSearch = saudeSearchTerm === "" || 
      person.lider_nome_completo.toLowerCase().includes(saudeSearchTerm.toLowerCase()) ||
      person.lider_whatsapp.includes(saudeSearchTerm.toLowerCase()) ||
      person.pessoa_nome_completo.toLowerCase().includes(saudeSearchTerm.toLowerCase()) ||
      person.pessoa_whatsapp.includes(saudeSearchTerm.toLowerCase()) ||
      person.cidade?.toLowerCase().includes(saudeSearchTerm.toLowerCase()) ||
      person.observacoes.toLowerCase().includes(saudeSearchTerm.toLowerCase());

    const matchesPhone = saudePhoneSearchTerm === "" || 
      person.lider_whatsapp.includes(saudePhoneSearchTerm) ||
      person.pessoa_whatsapp.includes(saudePhoneSearchTerm);

    const matchesLeader = saudeLeaderFilter === "" || 
      person.lider_nome_completo.toLowerCase().includes(saudeLeaderFilter.toLowerCase());

    return matchesCampaign && matchesSearch && matchesPhone && matchesLeader;
  }).sort((a, b) => {
    // Ordenar por data de criação (mais recente primeiro)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Dados paginados
  const paginatedMembers = getPaginatedData(filteredMembers, membersCurrentPage);
  const paginatedFriends = getPaginatedData(filteredFriends, friendsCurrentPage);
  const paginatedSaudePeople = filteredSaudePeople.slice(
    (saudePeopleCurrentPage - 1) * itemsPerPage,
    saudePeopleCurrentPage * itemsPerPage
  );

  
  // Total de páginas
  const totalMembersPages = getTotalPages(filteredMembers.length);
  const totalFriendsPages = getTotalPages(filteredFriends.length);
  const totalSaudePeoplePages = getTotalPages(filteredSaudePeople.length);

  // Funções para navegar entre páginas
  const goToMembersPage = (page: number) => {
    setMembersCurrentPage(Math.max(1, Math.min(page, totalMembersPages)));
  };

  const goToFriendsPage = (page: number) => {
    setFriendsCurrentPage(Math.max(1, Math.min(page, totalFriendsPages)));
  };

  const goToSaudePeoplePage = (page: number) => {
    setSaudePeopleCurrentPage(Math.max(1, Math.min(page, totalSaudePeoplePages)));
  };

  // Resetar paginação quando filtros mudarem
  const resetMembersPagination = () => {
    setMembersCurrentPage(1);
  };

  const resetFriendsPagination = () => {
    setFriendsCurrentPage(1);
  };

  const resetSaudePeoplePagination = () => {
    setSaudePeopleCurrentPage(1);
  };


  // Loading state
  if (usersLoading || statsLoading || reportsLoading || linksLoading || membersLoading || settingsLoading || planFeaturesLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ backgroundColor: campaignColors?.background || '#14446C' }}
      >
        <div className="text-center">
          <div className={`w-8 h-8 border-2 ${user?.campaign === 'B' ? 'border-institutional-gold' : 'border-institutional-gold'} border-t-transparent rounded-full animate-spin mx-auto mb-4`} />
          <p className="text-white">Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: campaignColors?.background || '#14446C' }}
    >
      {/* Header Personalizado */}
      <header className={`bg-white shadow-md border-b-2 ${user?.campaign === 'B' ? 'border-institutional-gold' : 'border-institutional-gold'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className={`${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'} font-medium`}>Bem-vindo, {user?.name || quickUserData?.name || 'Usuário'}</span>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground">{user?.role || quickUserData?.role || 'Membro'}</span>
                  {/* Botão de editar para membros (não administradores) - do lado esquerdo do role */}
                  {!isAdmin() && (isMembro() || isAmigo() || isConvidado()) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Estratégia 1: Busca por username na tabela auth_users e depois no members
                          let currentMember = null;
                          
                          if (user?.username) {
                            // Buscar na tabela auth_users primeiro para obter dados completos
                            const { data: authUserData, error: authError } = await supabaseServerless
                              .from('auth_users')
                              .select('*')
                              .eq('username', user.username)
                              .single();
                            
                            if (authUserData && !authError) {
                              // Agora buscar na tabela members usando os dados do auth_users
                              const { data: memberData, error: memberError } = await supabaseServerless
                                .from('members')
                                .select('*')
                                .eq('name', authUserData.name)
                                .eq('status', 'Ativo')
                                .is('deleted_at', null)
                                .single();
                              
                              if (memberData && !memberError) {
                                currentMember = memberData;
                              } else {
                                // Tentar busca alternativa por nome limpo
                                const cleanAuthName = authUserData.name.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
                                
                                const { data: memberDataClean, error: memberErrorClean } = await supabaseServerless
                                  .from('members')
                                  .select('*')
                                  .eq('name', cleanAuthName)
                                  .eq('status', 'Ativo')
                                  .is('deleted_at', null)
                                  .single();
                                
                                if (memberDataClean && !memberErrorClean) {
                                  currentMember = memberDataClean;
                                }
                              }
                            }
                          }
                          
                          // Estratégia 2: Se não encontrou, tentar busca local nos dados já carregados
                          if (!currentMember) {
                            currentMember = members.find(m => {
                              // 1. Comparação exata de nomes
                              if (m.name === user?.name) {
                                return true;
                              }
                              
                              // 2. Comparação sem sufixos
                              const cleanAuthUserName = (user?.name || '').replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
                              const cleanMemberName = m.name.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
                              
                              if (cleanAuthUserName === cleanMemberName) {
                                return true;
                              }
                              
                              // 3. Comparação por contém
                              if (m.name.toLowerCase().includes(cleanAuthUserName.toLowerCase()) || 
                                  cleanAuthUserName.toLowerCase().includes(cleanMemberName.toLowerCase())) {
                                return true;
                              }
                              
                              // 4. Comparação por username
                              if (user?.username && m.name.toLowerCase().includes(user.username.toLowerCase())) {
                                return true;
                              }
                              
                              return false;
                            });
                          }
                          
                          // Estratégia 3: Busca direta no banco se ainda não encontrou
                          if (!currentMember && user?.name) {
                            const { data: directMemberData, error: directError } = await supabaseServerless
                              .from('members')
                              .select('*')
                              .ilike('name', `%${user.name}%`)
                              .eq('status', 'Ativo')
                              .is('deleted_at', null)
                              .limit(1);
                            
                            if (directMemberData && directMemberData.length > 0 && !directError) {
                              currentMember = directMemberData[0];
                            }
                          }
                          
                          if (currentMember) {
                            handleEditMember(currentMember as unknown as { id: string; name: string; [key: string]: unknown });
                          } else {
                            toast({
                              title: "Erro",
                              description: "Não foi possível encontrar seus dados para edição. Verifique se você está cadastrado como membro.",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Ocorreu um erro ao buscar seus dados. Tente novamente.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-white border-0 text-xs px-2 py-1 h-6"
                      style={{ backgroundColor: '#16A34A' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803D'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16A34A'}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  )}
                </div>
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
      <main className="container mx-auto px-4 py-8">
        {/* Aviso de Plano Gratuito */}
        {planFeatures.planName.toLowerCase().includes('gratuito') && (
          <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Plano Gratuito Ativo</h3>
                    <p className="text-sm text-orange-700">
                      Você está usando o plano gratuito. Funcionalidades limitadas: sem relatórios, sem exportação PDF/EXCEL, sem mapa. Limite: {planFeatures.maxMembers + planFeatures.maxFriends} usuários totais.
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium px-4 py-2 rounded-lg"
                  onClick={() => window.open('https://conectadosdigital.com.br/comece-agora.html#planos', '_blank')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Header Fixed */}
      <div className={`bg-white shadow-[var(--shadow-card)] rounded-lg p-6 mb-4 border ${user?.campaign === 'B' ? 'border-institutional-light' : 'border-institutional-light'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`}>
              {isAdminHitech() 
                ? 'Hitech - Sistema de Gestão Conectados' 
                : (isAdmin3() || isSaudePlan())
                ? 'Dashboard - Sistema Conectados' 
                : 'Dashboard - Sistema de Gestão Conectados'}
                {isAdmin() && (
                <span className={`ml-2 text-sm px-2 py-1 rounded-full ${user?.campaign === 'B' ? 'bg-red-100 text-red-800' : 'bg-red-100 text-red-800'}`}>
                    {user?.username === 'wegneycosta' ? 'VEREADOR' : 
                     user?.username === 'felipe' ? 'FELIPE' : 
                     user?.role === 'Membro' ? 'MEMBRO' : 'ADMIN'}
                </span>
                )}
            </h1>
            <p className="text-muted-foreground mt-1">
                {isAdminHitech()
                ? "Gerencie o sistema e suas funcionalidades"
                : (isAdmin3() || isSaudePlan())
                ? "Gerencie sua rede de pessoas"
                : isAdminUser
                ? "Visão geral completa do sistema - Todos os usuários e dados consolidados"
                : "Gerencie sua rede de membros e acompanhe resultados"
              }
            </p>
          </div>
          

            {(isAdmin3() || isSaudePlan()) && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/cadastro-saude', { state: { campaign: user?.campaign } })}
              className="text-white font-medium"
              style={{ backgroundColor: '#CFBA7F' }}
            >
              <User className="w-4 h-4 mr-2" />
              Cadastrar Nova Pessoa
            </Button>
          </div>
            )}
            
            {(canGenerateLinks() || isFullAdmin()) && !isAdmin3() && !isAdminHitech() && !isSaudePlan() && (
          <div className="flex flex-col sm:flex-row gap-3">
            {canGenerateLinks() && (
            <Button
              onClick={generateLink}
                className={`${user?.campaign === 'B' ? 'bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue' : 'bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue'} font-medium`}
            >
              <Share2 className="w-4 h-4 mr-2" />
                Link
            </Button>
            )}
            
            
          </div>
          )}
        </div>

        {/* Botão de Exportar Dados do Relatório - Separado do botão de gerar link */}
        {isAdmin() && planFeatures.canExport && !isSaudePlan() && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <Button
                onClick={() => {
                  try {
                    // Verificar se há dados para exportar
                  if (!memberStats || !reportData) {
                    toast({
                      title: "⚠️ Dados não carregados",
                      description: "Aguarde o carregamento dos dados antes de exportar",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Verificar se há dados nos relatórios
                  const hasReportData = reportData && (
                    Object.keys(reportData.usersByLocation || {}).length > 0 ||
                    Object.keys(reportData.usersByCity || {}).length > 0 ||
                    Object.keys(reportData.sectorsGroupedByCity || {}).length > 0 ||
                    (reportData.registrationsByDay || []).length > 0 ||
                    (reportData.usersByStatus || []).length > 0 ||
                    (reportData.recentActivity || []).length > 0
                  );

                  if (!hasReportData) {
                      toast({
                        title: "⚠️ Nenhum dado para exportar",
                      description: "Não há dados nos relatórios para exportar. Cadastre membros primeiro.",
                        variant: "destructive",
                      });
                      return;
                    }

                  // Verificar se há membros cadastrados
                  if (!memberStats || !memberStats.total_members || memberStats.total_members === 0) {
                    toast({
                      title: "⚠️ Nenhum membro cadastrado",
                      description: "Não é possível gerar um relatório sem membros cadastrados",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Preparar dados dos top membros para o PDF
                  const topMembersData = members
                    .filter(member => 
                      member.status === 'Ativo' && 
                      !member.deleted_at && 
                      member.name.toLowerCase() !== 'admin'
                    )
                    .sort((a, b) => {
                      // Primeiro: mais contratos
                      if (b.contracts_completed !== a.contracts_completed) {
                        return b.contracts_completed - a.contracts_completed;
                      }
                      // Empate: membro mais antigo primeiro
                      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    })
                        .slice(0, 5)
                    .map((member, index) => ({ 
                          position: index + 1, 
                      member: member.name, 
                      count: member.contracts_completed 
                        }));

                  exportReportDataToPDF(reportData as unknown as Record<string, unknown>, (memberStats || {}) as unknown as Record<string, unknown>, topMembersData);
                    toast({
                      title: "✅ PDF exportado",
                      description: "Arquivo PDF com dados do relatório foi baixado com sucesso!",
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Erro na exportação",
                      description: error instanceof Error ? error.message : "Erro ao exportar PDF",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Dados do Relatório
              </Button>
          </div>
          )}

        {userLink && !isSaudePlan() && (
          <div className="mt-4 p-3 bg-institutional-light rounded-lg border border-institutional-gold/30">
            <p className="text-sm text-institutional-blue font-medium mb-1">
              {isFullAdmin() ? 'Link para cadastro de Membro:' : 'Seu link único:'}
            </p>
            <code className="text-xs break-all text-muted-foreground">{userLink}</code>
          </div>
        )}
      </div>

        {/* Controle de Tipo de Links - Apenas Administradores (exceto plano Saúde e Felipe) */}
        {canModifyLinkTypes() && !isSaudePlan() && (
          <Card className={`shadow-[var(--shadow-card)] border-l-4 ${user?.campaign === 'B' ? 'border-l-blue-500' : 'border-l-blue-500'} mb-6`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`}>
                <Settings className="w-5 h-5" />
                Tipo de Links de Cadastro 
              </CardTitle>
              <CardDescription>
                Mudar para cadastrar novos membros ou amigos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informação sobre Configurações */}
                <div className={`p-4 rounded-lg border ${user?.campaign === 'B' ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#14446C' }}>
                    <Settings className="w-4 h-4" style={{ color: '#14446C' }} />
                    Configurações do Sistema
                  </h4>
                  <p className="text-sm mb-3" style={{ color: '#14446C' }}>
                    Tipo de links atual: <strong>
                      {settings?.member_links_type === 'members' 
                        ? 'Novos Membros (duplas)'
                        : 'Amigos'
                      }
                    </strong>
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
                  >
                    Gerenciar Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Cobranças - Apenas para planos Essencial, Profissional e Avançado */}
        {isAdmin() && planFeatures.planName && (
          planFeatures.planName.toLowerCase().includes('essencial') || 
          planFeatures.planName.toLowerCase().includes('profissional') || 
          planFeatures.planName.toLowerCase().includes('avançado') || 
          planFeatures.planName.toLowerCase().includes('avancado')
        ) && (
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-green-500 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <CalendarDays className="w-5 h-5" />
                Histórico de Cobranças
              </CardTitle>
              <CardDescription>
                Visualize o histórico de pagamentos e cobranças do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#14446C' }}>
                    <CalendarDays className="w-4 h-4" style={{ color: '#14446C' }} />
                    Contratos Pagos
                  </h4>
                  <p className="text-sm mb-3" style={{ color: '#14446C' }}>
                    Acesse o histórico completo de suas cobranças, pagamentos e faturas.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar funcionalidade do histórico de cobranças
                      toast({
                        title: "Em desenvolvimento",
                        description: "Funcionalidade de histórico de cobranças será implementada em breve.",
                        variant: "default",
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm"
                  >
                    Ver Histórico de Cobranças
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapa Interativo - Apenas Administradores com Plano Avançado */}
        {isAdmin() && planFeatures.canViewMap && (
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500 mb-6 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                Mapa Interativo
              </CardTitle>
              <CardDescription>
                Visualização geográfica dos membros cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[600px]">
                <iframe
                  src={`/mapas/mapa.html?campaign=${user?.campaign}`}
                  title="Mapa Interativo"
                  className="w-full h-full border-0"
                />
              </div>
            </CardContent>
          </Card>
        )}


      {/* Alerta de Limite de Membros */}
      {shouldShowMemberLimitAlert() && (() => {
        const limitStatus = getMemberLimitStatus();
        const isExceeded = limitStatus.status === 'exceeded';
        const isReached = limitStatus.status === 'reached';
        const isNear = limitStatus.status === 'near';
        
        let bgColor, textColor, iconColor, icon;
        
        if (isExceeded) {
          bgColor = 'bg-red-50 border-red-200';
          textColor = 'text-red-800';
          iconColor = 'text-red-600';
          icon = '🚨';
        } else if (isReached) {
          bgColor = 'bg-green-50 border-green-200';
          textColor = 'text-green-800';
          iconColor = 'text-green-600';
          icon = '🎯';
        } else {
          bgColor = 'bg-yellow-50 border-yellow-200';
          textColor = 'text-yellow-800';
          iconColor = 'text-yellow-600';
          icon = '⚠️';
        }
        
        return (
          <div className={`mb-8 p-4 ${bgColor} border rounded-lg`}>
            <div className="flex items-center gap-3">
              <div className={`${iconColor} text-2xl`}>{icon}</div>
              <div>
                <h3 className={`font-semibold ${textColor}`}>Alerta: {limitStatus.message}</h3>
                <p className={`${textColor.replace('800', '700')} text-sm`}>
                  {isExceeded ? (
                    <>
                      O sistema excedeu o limite de {planFeatures.maxMembers} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos ou ajustar o limite."}
                    </>
                  ) : isReached ? (
                    <>
                      O sistema atingiu o limite de {planFeatures.maxMembers} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos."}
                    </>
                  ) : (
                    <>
                      O sistema está próximo do limite de {planFeatures.maxMembers} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos ou ajustar o limite."}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

  

        {/* Gráficos de Estatísticas - Primeira Linha (Apenas Administradores, exceto plano Saúde) */}
        {isAdmin() && !isSaudePlan() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* Gráfico de Barras - Usuários por Localização */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                  Setor por cidade
              </CardTitle>
              <CardDescription>
                {isAdminUser 
                  ? 'Distribuição por setor - Todos os membros' 
                  : ''
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(reportData?.usersByLocation || {}).map(([location, count]) => ({ location, quantidade: count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Setores Agrupados por Cidade - MOVIDO AQUI */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                Setores por Cidade
              </CardTitle>
              <CardDescription>
                Setores disponíveis em cada cidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(reportData?.sectorsGroupedByCity || {})
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([city, data]) => (
                    <div key={city} className="border-l-4 border-institutional-gold pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-institutional-blue text-lg">
                          {city}
                        </h4>
                        <div className="text-sm text-gray-600">
                          <span className="bg-institutional-gold text-white px-2 py-1 rounded-full text-xs mr-2">
                            {data.totalSectors} setores
                          </span>
                          <span className="bg-institutional-blue text-white px-2 py-1 rounded-full text-xs">
                            {data.count} membros
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.sectors.map((sector, index) => (
                          <span
                            key={index}
                            className="inline-block bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 hover:bg-institutional-light transition-colors"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(reportData?.sectorsGroupedByCity || {}).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum dado de setores por cidade encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Gráficos de Estatísticas - Segunda Linha (Apenas Administradores, exceto plano Saúde) */}
        {isAdmin() && !isSaudePlan() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* Gráfico de Barras - Pessoas Cadastradas por Cidade */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Membros por Cidade
              </CardTitle>
              <CardDescription>
                Total de membros cadastradas em cada cidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(reportData?.usersByCity || {}).map(([city, count]) => ({ city, quantidade: count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cidades e Quantidade de Membros */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Cidades e Membros
              </CardTitle>
              <CardDescription>
                Quantidade de membros cadastrados por cidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(reportData?.usersByCity || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-institutional-light transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-institutional-blue text-white text-sm font-bold">
                          {city.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {city}
                          </div>
                          <div className="text-sm text-gray-500">
                            {count} {count === 1 ? 'membro cadastrado' : 'membros cadastrados'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-institutional-blue">
                          {count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {memberStats?.total_members ? ((count / memberStats.total_members) * 100).toFixed(1) : '0'}%
                        </div>
                      </div>
                    </div>
                  ))}
                {Object.keys(reportData?.usersByCity || {}).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum dado de membros por cidade encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Relatórios Combinados - Cadastros Recentes e Top 5 Membros (exceto plano Saúde) */}
        {isAdmin() && (planFeatures.canViewRecentRegistrations || planFeatures.canViewTopMembers) && !isSaudePlan() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            {/* Gráfico de Cadastros Recentes - Apenas para planos não gratuitos */}
            {planFeatures.canViewRecentRegistrations && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <TrendingUp className="w-5 h-5" />
                Cadastros Recentes de Membros
              </CardTitle>
              <CardDescription>
                Últimos 7 dias - {stats.recent_registrations} novos cadastros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData?.registrationsByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                      <Bar dataKey="quantidade" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            )}

            {/* Top 100 Membros */}
            {planFeatures.canViewTopMembers && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                    Top 100 - Membros
              </CardTitle>
              <CardDescription>
                Ranking dos membros que mais cadastraram amigos
              </CardDescription>
            </CardHeader>
            <CardContent>
                  {members.length > 0 ? (
                (() => {
                      // Usar dados reais da tabela members (não amigos órfãos)
                      const activeMembers = members
                        .filter(member => 
                          member.status === 'Ativo' && 
                          !member.deleted_at && 
                          member.name.toLowerCase() !== 'admin' &&
                          member.contracts_completed > 0
                        )
                        .sort((a, b) => {
                          // Primeiro: mais contratos
                          if (b.contracts_completed !== a.contracts_completed) {
                            return b.contracts_completed - a.contracts_completed;
                          }
                          // Empate: membro mais antigo primeiro
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                        })
                    .slice(0, 100)
                        .map((member, index) => ({ 
                      position: index + 1, 
                          member: member.name, 
                          count: member.contracts_completed 
                    }));

                      if (activeMembers.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>Nenhum membro com amigos cadastrados</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={tableRefreshKey} className="space-y-3 max-h-[300px] overflow-y-auto">
                          {activeMembers.map((item) => (
                        <div 
                          key={item.member} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-institutional-light transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold
                              ${item.position === 1 ? 'bg-yellow-500' : 
                                item.position === 2 ? 'bg-gray-400' : 
                                item.position === 3 ? 'bg-amber-600' : 
                                'bg-institutional-blue'}
                            `}>
                              {item.position}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {item.member}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.count} amigos cadastrados
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-institutional-blue">
                              {item.count}
                            </div>
                            {item.position === 1 && (
                              <div className="text-xs text-yellow-600 font-medium">
                                🏆 Líder
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhum amigo cadastrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            )}
          </div>
        )}


        {/* Novos Reports - Engagement Rate e Registration Count (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          </div>
        )}

        {/* Seção para Membros Não-Administradores (exceto admin3, AdminHitech e plano Saúde) */}
        {!isAdmin() && !isAdmin3() && !isAdminHitech() && !isSaudePlan() && (
          <div className="mb-8">
            {/* Seu Link Atual */}
            {userLink ? (
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-green-500 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-institutional-blue">
                    <LinkIcon className="w-5 h-5" />
                    Seu Link de Cadastro
                  </CardTitle>
                  <CardDescription>
                    {settings?.member_links_type === 'members' 
                      ? 'Use este link para cadastrar novos membros'
                      : 'Use este link para cadastrar amigos'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">
                        {settings?.member_links_type === 'members' ? '👥 Cadastrar Membros' : 'Cadastrar Amigos'}
                      </h4>
                      <p className="text-green-700 text-sm mb-3">
                        {settings?.member_links_type === 'members' 
                          ? 'Compartilhe este link para que outras pessoas se cadastrem como membros através de você.'
                          : 'Compartilhe este link para que outras pessoas se cadastrem como amigos através de você.'
                        }
                      </p>
                      <div className="bg-white p-3 rounded border border-green-300">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-800 mb-2">Status Atual</h4>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              {settings?.member_links_type === 'members' 
                                ? 'Links servem para cadastrar membros'
                                : 'Links servem para cadastrar amigos'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-yellow-500 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-institutional-blue">
                    <LinkIcon className="w-5 h-5" />
                    Seu Link de Cadastro
                  </CardTitle>
                  <CardDescription>
                    Nenhum link foi gerado ainda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Nenhum Link Disponível
                      </h4>
                      <p className="text-yellow-700 text-sm mb-3">
                        Você ainda não possui um link de cadastro. Clique no botão "Gerar e Copiar Link" acima para criar seu link único.
                      </p>
                      <div className="bg-white p-3 rounded border border-yellow-300">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-800 mb-2">Status Atual</h4>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              Aguardando geração de link
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações sobre Amigos - apenas quando tipo de link for members */}
            {settings?.member_links_type === 'members' && (
            <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-institutional-blue">
                  <CalendarDays className="w-5 h-5" />
                  Amigos
                </CardTitle>
                <CardDescription>
                  Informações sobre a fase de amigos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📅 Fase de Amigos</h4>
                    {settings?.member_links_type === 'members' ? (
                      // Mensagem para quando o tipo de link é "members"
                      <>
                    <p className="text-blue-700 text-sm mb-2">
                          A fase de amigos é liberada pelo Administrador. 
                          O membro poderá cadastrar duplas de amigos quando ativada.
                        </p>
                        <div className="flex items-center gap-2 text-blue-600">
                         
                          <span className="text-sm font-medium">Controlado pelo Administrador</span>
                        </div>
                      </>
                    ) : (
                      // Mensagem original para quando o tipo de link é "friends"
                      <>
                        <p className="text-blue-700 text-sm mb-2">
                          A fase de amigos será liberada em Breve. 
                          Cada membro poderá cadastrar 15 duplas de amigos quando ativada.
                    </p>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarDays className="w-4 h-4" />
                          <span className="text-sm font-medium">Disponível em Breve</span>
                    </div>
                      </>
                    )}
                  </div>
                  
               
                </div>
              </CardContent>
            </Card>
            )}

            {/* Tabela dos Seus Amigos */}
            {settings?.paid_contracts_phase_active && (
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-institutional-blue">
                    <UserCheck className="w-5 h-5" />
                    Seus Amigos
                  </CardTitle>
                  <CardDescription>
                    Amigos que você cadastrou
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Dupla</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-500">
                            <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Sistema unificado - Use a tabela de amigos abaixo</p>
                            <p className="text-sm">Amigos são exibidos na seção de ranking de amigos.</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      
        {/* Cards de Resumo - Sistema de Membros (exceto plano Saúde) */}
        {isAdmin() && !isSaudePlan() && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
                  <p className="text-2xl font-bold text-institutional-blue">
                    {filteredMembers.filter(m => !m.quemindicou && !m.telefonequemindicou).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                        {filteredMembers.filter(m => !m.quemindicou && !m.telefonequemindicou).length} / {planFeatures.maxMembers < 999999 ? planFeatures.maxMembers : '∞'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-institutional-light">
                  <Users className="w-6 h-6 text-institutional-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.username?.toLowerCase() !== 'admin_b' && (
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Membros sem Indicação</p>
                  <p className="text-2xl font-bold text-orange-600">{memberStats?.members_with_referrer_name || 0}</p>
                  <p className="text-xs text-muted-foreground">
                  
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          )}
            </div>

            {/* Cards adicionais para plano Avançado (exceto plano Saúde) */}
            {planFeatures.canViewColorCards && !isSaudePlan() && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Verdes</p>
                  <p className="text-2xl font-bold text-green-600">{memberStats?.green_members || 0}</p>
                  <p className="text-xs text-green-600">15 contratos completos</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <div className="text-2xl">🟢</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Amarelos</p>
                  <p className="text-2xl font-bold text-yellow-600">{memberStats?.yellow_members || 0}</p>
                  <p className="text-xs text-yellow-600">1-14 contratos</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <div className="text-2xl">🟡</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Vermelhos</p>
                  <p className="text-2xl font-bold text-red-600">{memberStats?.red_members || 0}</p>
                  <p className="text-xs text-red-600">0 contratos</p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <div className="text-2xl">🔴</div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
            )}
          </div>
        )}


        {/* Cards de Amigos (se a fase estiver ativa) - Apenas Administradores (exceto plano Saúde) */}
        {isAdmin() && settings?.paid_contracts_phase_active && !isSaudePlan() && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Contratos</p>
                    <p className="text-2xl font-bold text-blue-600">{filteredFriends.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Seção de Ranking de Membros (Administradores e Membros, exceto plano Saúde) */}
        {(isAdmin() || isMembro()) && !isSaudePlan() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <Users className="w-5 h-5" />
              {isAdminUser ? 'Membros' : 'Meus Membros Cadastrados'}
            </CardTitle>
            <CardDescription>
              {isAdminUser
                ? "Lista completa de todos os membros cadastrados no sistema"
                : "Membros que você cadastrou através do seu link"
              }
            </CardDescription>
            {isAdmin() && planFeatures.canExport && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      // Verificar se há dados para exportar
                      if (!filteredMembers || filteredMembers.length === 0) {
                        toast({
                          title: "⚠️ Nenhum dado para exportar",
                          description: "Não é possível gerar um relatório sem dados",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Exportar TODOS os membros filtrados, não apenas os da página atual
                      await exportMembersToExcel(filteredMembers as unknown as Record<string, unknown>[]);
                      toast({
                        title: "✅ Excel exportado",
                        description: `Arquivo Excel com ${filteredMembers.length} membros foi baixado com sucesso!`,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Erro na exportação",
                        description: error instanceof Error ? error.message : "Erro ao exportar Excel",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      // Verificar se há dados para exportar
                      if (!filteredMembers || filteredMembers.length === 0) {
                        toast({
                          title: "⚠️ Nenhum dado para exportar",
                          description: "Não é possível gerar um relatório sem dados",
                          variant: "destructive",
                        });
                        return;
                      }

                      await exportMembersToPDF(filteredMembers as unknown as Record<string, unknown>[]);
                      toast({
                        title: "✅ PDF exportado",
                        description: `Arquivo PDF estruturado com ${filteredMembers.length} membros foi baixado com sucesso!`,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Erro na exportação",
                        description: error instanceof Error ? error.message : "Erro ao exportar PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            )}
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por qualquer campo (nome, Instagram, cidade, setor, parceiro, contratos, ranking)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por telefone..."
                value={phoneSearchTerm}
                onChange={(e) => {
                  setPhoneSearchTerm(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por indicador..."
                value={filterReferrer}
                onChange={(e) => {
                  setFilterReferrer(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>


            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por cidade..."
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por setor..."
                value={filterSector}
                onChange={(e) => {
                  setFilterSector(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            {/* Filtro de Status */}
            {planFeatures.canViewRankingColumns && (
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  resetMembersPagination();
                }}
                className="w-full pl-10 pr-4 py-2 border border-institutional-light rounded-md focus:border-institutional-gold focus:ring-institutional-gold bg-white"
              >
                <option value="">Todos os Status</option>
                <option value="Verde">🟢 Verde (15+ contratos)</option>
                <option value="Amarelo">🟡 Amarelo (1-14 contratos)</option>
                <option value="Vermelho">🔴 Vermelho (0 contratos)</option>
              </select>
            </div>
            )}
          </div>

          {/* Tabela de Membros */}
          <div className="overflow-x-auto" id="members-table">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-institutional-light">
                  {planFeatures.canViewRankingColumns && (
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Posição</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Membro e Parceiro</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Total de Membros</th>
                  {planFeatures.canViewRankingColumns && (
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Contratos/Status</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                    {planFeatures.canViewRankingColumns && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional-blue">
                          {member.ranking_position || 'N/A'}
                        </span>
                        {member.is_top_1500 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            TOP 1500
                          </span>
                        )}
                      </div>
                    </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-institutional-gold" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-institutional-blue">{member.name}</span>
                            {isAdmin() && (user?.username?.toLowerCase() !== 'felipe' || isFelipeCampaignA()) && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditMember(member)}
                                  className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                  title="Editar membro"
                                >
                                  ✏️
                                </button>
                                {canDeleteUsers() && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                                    title="Excluir membro"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getMemberRole(member)}
                          </div>
                          {member.couple_name && (
                            <div className="text-xs text-gray-400 mt-1">
                              {member.couple_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-pink-600">{member.instagram}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.sector}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                        <span className="font-bold text-institutional-blue">
                        {members.filter(m => {
                          // Função para extrair nome simples (remove sufixos como "- Membro", "- Amigo", etc.)
                          const extractSimpleName = (fullName: string): string => {
                            const cleanName = fullName.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
                            return cleanName.toLowerCase();
                          };
                          
                          const simpleReferrerName = extractSimpleName(m.referrer);
                          const simpleMemberName = extractSimpleName(member.name);
                          
                          // Conta quantos membros têm este membro como referrer (comparação flexível)
                          return (simpleReferrerName === simpleMemberName || m.referrer === member.name) && 
                                 m.id !== member.id && // Evita auto-referência
                                 !m.is_friend && 
                                 m.campaign === member.campaign &&
                                 m.status === 'Ativo' && 
                                 !m.deleted_at;
                        }).length}
                        </span>
                    </td>
                    {planFeatures.canViewRankingColumns && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional-blue">
                          {member.contracts_completed}/15
                        </span>
                        <span className="text-lg">{getRankingStatusIcon(member.ranking_status)}</span>
                        {member.can_be_replaced && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            SUBSTITUÍVEL
                          </span>
                        )}
                      </div>
                    </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-institutional-gold font-medium">{member.referrer}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum membro encontrado com os critérios de pesquisa.</p>
              </div>
            )}
          </div>

          {/* Paginação para Membros */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((membersCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(membersCurrentPage * itemsPerPage, filteredMembers.length)} de {filteredMembers.length} membros
                <span className="ml-2 text-blue-600 font-medium">(Limite máximo: {planFeatures.maxMembers})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(1)}
                  disabled={membersCurrentPage === 1}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(membersCurrentPage - 1)}
                  disabled={membersCurrentPage === 1}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalMembersPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalMembersPages - 4, membersCurrentPage - 2)) + i;
                    if (pageNum > totalMembersPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === membersCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToMembersPage(pageNum)}
                        className={pageNum === membersCurrentPage 
                          ? "bg-institutional-gold text-institutional-blue hover:bg-institutional-gold/90" 
                          : "border-institutional-light hover:bg-institutional-light"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(membersCurrentPage + 1)}
                  disabled={membersCurrentPage === totalMembersPages}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(totalMembersPages)}
                  disabled={membersCurrentPage === totalMembersPages}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="mt-6 p-4 bg-institutional-light rounded-lg">
            <div className="flex items-center justify-between">
              <div>
             
        
              </div>
            
           
            </div>
          </div>
        </CardContent>
      </Card>
        )}

        {/* Card de Total de Amigos (exceto plano Saúde) */}
        {isAdmin() && !isSaudePlan() && (
          <div className="mb-6 mt-8">
           
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Amigos</p>
                      <p className="text-2xl font-bold text-institutional-blue">{friends.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {friends.length} / {planFeatures.maxFriends < 999999 ? planFeatures.maxFriends : '∞'}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-institutional-light">
                      <Users className="w-6 h-6 text-institutional-blue" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Seção de Ranking de Amigos (Administradores e Membros, exceto plano Saúde) */}
        {(isAdmin() || isMembro()) && !isSaudePlan() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <Users className="w-5 h-5" />
              {isAdminUser ? 'Amigos' : 'Meus Amigos Cadastrados'}
            </CardTitle>
            <CardDescription>
              {isAdminUser 
                ? "Lista Completa de todos os amigos cadastrados no sistema"
                : "Amigos que você cadastrou através do seu link"
              }
            </CardDescription>
            {isAdmin() && planFeatures.canExport && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    // Verificar se há dados para exportar
                    if (!filteredFriends || filteredFriends.length === 0) {
                      toast({
                        title: "⚠️ Nenhum dado para exportar",
                        description: "Não é possível gerar um relatório sem dados",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Exportar TODOS os amigos filtrados, não apenas os da página atual
                    await exportFriendsToExcel(filteredFriends);
                    toast({
                      title: "✅ Excel exportado",
                      description: `Arquivo Excel com ${filteredFriends.length} amigos foi baixado com sucesso!`,
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Erro na exportação",
                      description: error instanceof Error ? error.message : "Erro ao exportar Excel",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    // Verificar se há dados para exportar
                    if (!filteredFriends || filteredFriends.length === 0) {
                      toast({
                        title: "⚠️ Nenhum dado para exportar",
                        description: "Não é possível gerar um relatório sem dados",
                        variant: "destructive",
                      });
                      return;
                    }

                    await exportFriendsToPDF(filteredFriends);
                    toast({
                      title: "✅ PDF exportado",
                      description: `Arquivo PDF estruturado com ${filteredFriends.length} amigos foi baixado com sucesso!`,
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Erro na exportação",
                      description: error instanceof Error ? error.message : "Erro ao exportar PDF",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Filtros para Amigos */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar amigos por qualquer campo..."
                  value={friendsSearchTerm}
                  onChange={(e) => {
                    setFriendsSearchTerm(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar por telefone..."
                  value={friendsPhoneSearchTerm}
                  onChange={(e) => {
                    setFriendsPhoneSearchTerm(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por membro responsável..."
                  value={friendsMemberFilter}
                  onChange={(e) => {
                    setFriendsMemberFilter(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por cidade..."
                  value={friendsFilterCity}
                  onChange={(e) => {
                    setFriendsFilterCity(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por setor..."
                  value={friendsFilterSector}
                  onChange={(e) => {
                    setFriendsFilterSector(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>
            </div>

            {/* Tabela de Ranking dos Amigos */}
            <div className="overflow-x-auto" id="friends-ranking-table">
              <table id="friends-table" className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-institutional-light">
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Amigo e Parceiro</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFriends.map((friend) => (
                    <tr key={friend.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-institutional-gold" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-institutional-blue">{friend.name}</span>
                              {isAdmin() && user?.username?.toLowerCase() !== 'felipe' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditFriend(friend)}
                                    className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                    title="Editar amigo"
                                  >
                                    ✏️
                                  </button>
                                  {canDeleteUsers() && (
                                    <button
                                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                                      title="Excluir amigo"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Amigo
                            </div>
                            {friend.couple_name && (
                              <div className="text-xs text-gray-400 mt-1">
                                {friend.couple_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-pink-600">{friend.instagram}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.sector || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">{friend.member_name}</span>
                            <div className="text-xs text-gray-500">Membro</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredFriends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum amigo encontrado com os critérios de pesquisa.</p>
                </div>
              )}
            </div>

            {/* Paginação para Amigos */}
            {filteredFriends.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((friendsCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(friendsCurrentPage * itemsPerPage, filteredFriends.length)} de {filteredFriends.length} amigos
                  <span className="ml-2 text-blue-600 font-medium">(Limite máximo: {planFeatures.maxFriends < 999999 ? planFeatures.maxFriends : '∞'})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(1)}
                    disabled={friendsCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(friendsCurrentPage - 1)}
                    disabled={friendsCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalFriendsPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalFriendsPages - 4, friendsCurrentPage - 2)) + i;
                      if (pageNum > totalFriendsPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === friendsCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToFriendsPage(pageNum)}
                          className={pageNum === friendsCurrentPage 
                            ? "bg-institutional-gold text-institutional-blue hover:bg-institutional-gold/90" 
                            : "border-institutional-light hover:bg-institutional-light"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(friendsCurrentPage + 1)}
                    disabled={friendsCurrentPage === totalFriendsPages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(totalFriendsPages)}
                    disabled={friendsCurrentPage === totalFriendsPages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
        )}

        {/* Seção de Pessoas de Saúde - Admin3 */}
        {(isAdmin3() || isSaudePlan()) && (
        <Card className="shadow-[var(--shadow-card)] mt-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <User className="w-5 h-5" />
              Pessoas Cadastradas
            </CardTitle>
            <CardDescription>
              Lista completa de todas as pessoas cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros para Pessoas de Saúde */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar por qualquer campo..."
                  value={saudeSearchTerm}
                  onChange={(e) => {
                    setSaudeSearchTerm(e.target.value);
                    resetSaudePeoplePagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar por telefone..."
                  value={saudePhoneSearchTerm}
                  onChange={(e) => {
                    setSaudePhoneSearchTerm(e.target.value);
                    resetSaudePeoplePagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por líder..."
                  value={saudeLeaderFilter}
                  onChange={(e) => {
                    setSaudeLeaderFilter(e.target.value);
                    resetSaudePeoplePagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>
            </div>

            {/* Botões de Exportação */}
            {(isAdmin() || isSaudePlan()) && planFeatures.canViewReports && planFeatures.canExport && (
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => exportSaudePeopleToExcel()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                onClick={() => handleExportSaudePeopleToPDF()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
            )}

            {/* Tabela de Pessoas de Saúde */}
            <div className="overflow-x-auto" id="saude-people-table">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-institutional-light">
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-40">Líder</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-44">WhatsApp Líder</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-40">Pessoa</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-44">WhatsApp Pessoa</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-28">CEP</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-48">Cidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-56">Observações</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue w-28">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSaudePeople.map((person) => (
                    <tr key={person.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-institutional-gold" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-institutional-blue">{person.lider_nome_completo}</span>
                            {isAdmin() && user?.username?.toLowerCase() !== 'felipe' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditSaudePerson(person)}
                                  className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                  title="Editar pessoa"
                                >
                                  ✏️
                                </button>
                                {canDeleteUsers() && (
                                  <button
                                    onClick={() => handleRemoveSaudePerson(person.id, person.pessoa_nome_completo)}
                                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                                    title="Excluir pessoa"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{person.lider_whatsapp}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-blue-600">{person.pessoa_nome_completo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{person.pessoa_whatsapp}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{person.cep || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{person.cidade || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 w-56">
                        <div className="w-56">
                          <span className="text-sm text-gray-600 break-words whitespace-normal" title={person.observacoes}>
                            {person.observacoes}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(person.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSaudePeople.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhuma pessoa encontrada com os critérios de pesquisa.</p>
                </div>
              )}
            </div>

            {/* Paginação para Pessoas de Saúde */}
            {filteredSaudePeople.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((saudePeopleCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(saudePeopleCurrentPage * itemsPerPage, filteredSaudePeople.length)} de {filteredSaudePeople.length} pessoas
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToSaudePeoplePage(1)}
                    disabled={saudePeopleCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToSaudePeoplePage(saudePeopleCurrentPage - 1)}
                    disabled={saudePeopleCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalSaudePeoplePages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalSaudePeoplePages - 4, saudePeopleCurrentPage - 2)) + i;
                      if (pageNum > totalSaudePeoplePages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === saudePeopleCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToSaudePeoplePage(pageNum)}
                          className={pageNum === saudePeopleCurrentPage 
                            ? "bg-institutional-gold text-institutional-blue hover:bg-institutional-gold/90" 
                            : "border-institutional-light hover:bg-institutional-light"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToSaudePeoplePage(saudePeopleCurrentPage + 1)}
                    disabled={saudePeopleCurrentPage === totalSaudePeoplePages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToSaudePeoplePage(totalSaudePeoplePages)}
                    disabled={saudePeopleCurrentPage === totalSaudePeoplePages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
        )}

        {/* ========================================= */}
        {/* SEÇÃO ADMINHITECH - TABELAS DE GERENCIAMENTO */}
        {/* ========================================= */}
        
        {/* Tabela de Campanhas - AdminHitech */}
        {isAdminHitech() && (
          <Card className="shadow-[var(--shadow-card)] mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-institutional-blue">
                    <Tag className="w-5 h-5" />
                    Campanhas Cadastradas
                  </CardTitle>
                  <CardDescription>
                    Lista de todas as campanhas do sistema
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate('/cadastro-campanha')}
                  className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
                >
                  Nova Campanha
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando campanhas...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-institutional-light">
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Plano</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor principal</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor Secundária</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Data de Criação</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr 
                          key={campaign.id} 
                          className={`border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors ${
                            !campaign.is_active ? 'opacity-50 bg-gray-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`font-medium text-institutional-blue ${
                              !campaign.is_active ? 'line-through text-gray-400' : ''
                            }`}>
                              {campaign.name}
                            </span>
                            {!campaign.is_active && (
                              <span className="ml-2 text-xs text-red-500 font-semibold">
                                (DESATIVADA)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {campaign.nome_plano ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-institutional-blue">
                                  {campaign.nome_plano}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Sem plano</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: campaign.primary_color }}
                              />
                              <span className="text-xs text-gray-600">{campaign.primary_color}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: campaign.secondary_color }}
                              />
                              <span className="text-xs text-gray-600">{campaign.secondary_color}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaign.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {campaign.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleCampaignStatus(campaign)}
                                className={`border ${
                                  campaign.is_active 
                                    ? 'border-red-500 text-white hover:bg-red-600 bg-red-500' 
                                    : 'border-green-500 text-white hover:bg-green-600 bg-green-500'
                                }`}
                              >
                                {campaign.is_active ? 'Desativar' : 'Ativar'}
                              </Button>
                              {campaign.is_active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditCampaign(campaign)}
                                  className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
                                >
                                  Editar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {campaigns.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Nenhuma campanha cadastrada ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabela de Admins - AdminHitech */}
        {isAdminHitech() && (
          <Card className="shadow-[var(--shadow-card)] mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-institutional-blue">
                  <UserCheck className="w-5 h-5" />
                  Administradores do Sistema
                </CardTitle>
                <CardDescription>
                  Lista de todos os administradores cadastrados
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/cadastro-admin')}
                className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Novo Administrador
              </Button>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando administradores...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-institutional-light">
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Campanha</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Data de Criação</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => {
                        // Buscar nome da campanha
                        const campanha = campaigns.find(c => c.code === admin.campaign);
                        const campanhaName = campanha?.name || admin.campaign;
                        
                        return (
                          <tr 
                            key={admin.id} 
                            className={`border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors ${
                              !admin.is_active || admin.deleted_at ? 'opacity-50 bg-gray-50' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <span className={`font-medium text-institutional-blue ${
                                !admin.is_active || admin.deleted_at ? 'line-through text-gray-400' : ''
                              }`}>
                                {admin.name}
                              </span>
                              {(!admin.is_active || admin.deleted_at) && (
                                <span className="ml-2 text-xs text-red-500 font-semibold">
                                  (DESATIVADO)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {admin.role || 'Administrador'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-institutional-gold/20 text-institutional-blue">
                                {campanhaName}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                admin.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {admin.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">
                                {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {admin.is_active && (
                                <Button
                                  onClick={() => navigate('/cadastro-admin', { 
                                    state: { 
                                      editMode: true, 
                                      adminData: admin 
                                    } 
                                  })}
                                  className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
                                >
                                  Editar
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {admins.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Nenhum administrador cadastrado ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabela de Planos - AdminHitech */}
        {isAdminHitech() && (
          <Card className="shadow-[var(--shadow-card)] mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-institutional-blue">
                  <Package className="w-5 h-5" />
                  Planos e Preços
                </CardTitle>
                <CardDescription>
                  Gerencie os planos disponíveis no sistema
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate('/cadastro-plano')}
                className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
              >
                <Package className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            </CardHeader>
            <CardContent>
              {planosLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando planos...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-institutional-light">
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Valor</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Recorrência</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Máx. Usuários</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planos.map((plano) => (
                        <tr 
                          key={plano.id} 
                          className={`border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors ${
                            !plano.is_active ? 'opacity-50 bg-gray-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className={`font-medium text-institutional-blue ${
                                !plano.is_active ? 'line-through text-gray-400' : ''
                              }`}>
                                {plano.nome_plano}
                              </span>
                              {plano.descricao && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {plano.descricao}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                R$ {plano.amount.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {plano.recorrencia === 'MONTHLY' ? 'Mensal' : 
                               plano.recorrencia === 'QUARTERLY' ? 'Trimestral' :
                               plano.recorrencia === 'SEMIANNUAL' ? 'Semestral' :
                               plano.recorrencia === 'YEARLY' ? 'Anual' : plano.recorrencia}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {plano.max_users === 999999 ? 'Ilimitado' : plano.max_users?.toLocaleString('pt-BR') || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={async () => {
                                try {
                                  
                                  const result = await togglePlanoStatus(plano.id, plano.is_active);
                                  
                                  if (result.success) {
                                    toast({
                                      title: result.newStatus ? "Plano ativado" : "Plano desativado",
                                      description: `O plano "${plano.nome_plano}" foi ${result.newStatus ? 'ativado' : 'desativado'} com sucesso.`,
                                    });
                                    
                                    // Refresh automático dos dados
                                    await fetchPlanos();
                                    await fetchCampaigns(); // Atualizar campanhas também
                                  } else {
                                    console.error('❌ Erro no toggle:', result.error);
                                    toast({
                                      title: "Erro ao alterar status",
                                      description: result.error || "Não foi possível alterar o status do plano.",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  console.error('💥 Erro geral no toggle:', error);
                                  toast({
                                    title: "Erro ao alterar status",
                                    description: "Ocorreu um erro inesperado.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                plano.is_active 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {plano.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              onClick={() => navigate('/cadastro-plano', { 
                                state: { 
                                  editMode: true, 
                                  planoData: plano 
                                } 
                              })}
                              className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium text-sm"
                            >
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {planos.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Nenhum plano cadastrado ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </main>
      
      {/* Botão flutuante WhatsApp - Apenas para membros */}
      {!isAdmin() && (isMembro() || isAmigo() || isConvidado()) && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Texto do lado do botão */}
          <div className="bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Chame o Agente para dúvidas!!
            </p>
          </div>
          
          {/* Botão WhatsApp */}
          <Button
            onClick={() => {
              // Número do WhatsApp do agente
              const whatsappNumber = "556281261293";
              const message = encodeURIComponent("Olá! Preciso de ajuda com o sistema.");
              const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: user?.campaign === 'B' ? '#CFBA7F' : '#16A34A',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = user?.campaign === 'B' ? '#B8A366' : '#15803D';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = user?.campaign === 'B' ? '#CFBA7F' : '#16A34A';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg 
              className="w-8 h-8 text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
            </svg>
          </Button>
        </div>
      )}

      {/* Modal de Edição */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        memberData={selectedMemberForEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Modal de Edição de Amigo */}
      <EditFriendModal
        isOpen={isEditFriendModalOpen}
        onClose={handleCloseEditFriendModal}
        friendData={selectedFriendForEdit}
        onSuccess={handleEditFriendSuccess}
      />

      {/* Modal de Edição de Pessoa de Saúde */}
      <EditSaudePersonModal
        isOpen={isEditSaudePersonModalOpen}
        onClose={handleCloseEditSaudePersonModal}
        person={selectedSaudePersonForEdit}
        onSuccess={handleEditSaudePersonSuccess}
      />

      {/* Modal de Confirmação de Exclusão de Pessoa de Saúde */}
      <Dialog open={deleteSaudePersonConfirmModal.isOpen} onOpenChange={cancelDeleteSaudePerson}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir a pessoa <strong>"{deleteSaudePersonConfirmModal.person?.name}"</strong>?
            </p>
            <p className="text-sm text-red-600 mb-4">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelDeleteSaudePerson}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSaudePerson}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Membro */}
      <Dialog open={deleteConfirmModal.isOpen} onOpenChange={cancelDeleteMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir o membro <strong>"{deleteConfirmModal.member?.name}"</strong>?
            </p>
            <p className="text-sm text-red-600 mb-4">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelDeleteMember}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Amigo */}
      <Dialog open={deleteFriendConfirmModal.isOpen} onOpenChange={cancelDeleteFriend}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Confirmar Exclusão de Amigo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir o amigo <strong>"{deleteFriendConfirmModal.friend?.name}"</strong>?
            </p>
            <p className="text-sm text-orange-600 mb-4">
              ⚠️ .
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelDeleteFriend}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteFriend}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Amigo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}