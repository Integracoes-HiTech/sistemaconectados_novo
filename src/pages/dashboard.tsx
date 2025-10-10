import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
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
  FileText
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useUserLinks } from "@/hooks/useUserLinks";
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
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAdmin3, isAdminHitech, isMembro, isAmigo, isConvidado, canViewAllUsers, canViewOwnUsers, canViewStats, canGenerateLinks, canDeleteUsers, canExportReports } = useAuth();

  // Estado para armazenar cores da campanha do banco
  const [campaignColors, setCampaignColors] = useState<{
    background: string;
    primary: string;
    secondary: string;
  } | null>(null);

  // Buscar cores da campanha do banco
  useEffect(() => {
    const fetchCampaignColors = async () => {
      if (!user?.campaign) {
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('background_color, primary_color, secondary_color')
          .eq('code', user.campaign)
          .single();
        
        if (error) {
          throw error;
        }

        if (data) {
          setCampaignColors({
            background: data.background_color,
            primary: data.primary_color,
            secondary: data.secondary_color
          });
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

  // Função para remover membro (soft delete - apenas administradores completos)
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!canDeleteUsers()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores completos podem remover membros.",
        variant: "destructive",
      });
      return;
    }

    const confirmRemove = window.confirm(
      `Tem certeza que deseja excluir o membro "${memberName}"?`
    );

    if (!confirmRemove) return;

    try {
      // Usar a função de soft delete do hook useMembers
      const result = await softDeleteMember(memberId);
      
      if (result.success) {
        toast({
          title: "Membro excluído",
          description: `O membro "${memberName}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir membro",
        description: "Ocorreu um erro ao tentar excluir o membro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para remover amigo (soft delete - apenas administradores completos)
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!canDeleteUsers()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores completos podem remover amigos.",
        variant: "destructive",
      });
      return;
    }

    const confirmRemove = window.confirm(
      `Tem certeza que deseja excluir o amigo "${friendName}"?`
    );

    if (!confirmRemove) return;

    try {
      const result = await softDeleteFriend(friendId);
      
      if (result.success) {
        toast({
          title: "✅ Amigo excluído",
          description: `O amigo "${friendName}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error) {
      // Erro ao excluir amigo
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro ao excluir amigo",
        variant: "destructive",
      });
    }
  };

  // Função para remover pessoa de saúde (soft delete - admin3)
  const handleRemoveSaudePerson = async (personId: string, personName: string) => {
    if (!isAdmin3()) {
      toast({
        title: "Acesso negado",
        description: "Apenas admin3 pode remover pessoas.",
        variant: "destructive",
      });
      return;
    }

    const confirmRemove = window.confirm(
      `Tem certeza que deseja excluir "${personName}"?`
    );

    if (!confirmRemove) return;

    try {
      const success = await softDeleteSaudePerson(personId);
      
      if (success) {
        toast({
          title: "✅ Pessoa excluída",
          description: `"${personName}" foi excluído(a) com sucesso.`,
        });
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

  // Função para editar pessoa de saúde - navega para PublicRegisterSaude com dados
  const handleEditSaudePerson = (person: SaudePerson) => {
    if (!isAdmin3()) {
      toast({
        title: "Acesso negado",
        description: "Apenas admin3 pode editar pessoas.",
        variant: "destructive",
      });
      return;
    }

    // Navegar para a página de cadastro com os dados da pessoa para edição
    navigate('/cadastro-saude', { 
      state: { 
        editMode: true, 
        personData: person 
      } 
    });
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

    // Adaptar dados para formato de exportação
    const dataToExport = filteredSaudePeople.map(person => ({
      id: person.id,
      name: person.lider_nome_completo,
      couple_name: person.pessoa_nome_completo,
      phone: person.lider_whatsapp,
      couple_phone: person.pessoa_whatsapp,
      city: person.cidade || 'N/A',
      cep: person.cep || 'N/A',
      instagram: '',
      couple_instagram: '',
      sector: person.observacoes,
      couple_sector: '',
      status: 'Ativo',
      campaign: 'SAUDE',
      created_at: person.created_at
    }));

    exportMembersToExcel(dataToExport);
    
    toast({
      title: "✅ Exportado!",
      description: "Dados de saúde exportados para Excel com sucesso.",
    });
  };

  // Função para exportar pessoas de saúde para PDF
  const exportSaudePeopleToPDF = () => {
    if (!filteredSaudePeople || filteredSaudePeople.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há pessoas cadastradas para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Adaptar dados para formato de exportação
    const dataToExport = filteredSaudePeople.map(person => ({
      id: person.id,
      name: person.lider_nome_completo,
      couple_name: person.pessoa_nome_completo,
      phone: person.lider_whatsapp,
      couple_phone: person.pessoa_whatsapp,
      city: person.cidade || 'N/A',
      cep: person.cep || 'N/A',
      instagram: '',
      couple_instagram: '',
      sector: person.observacoes,
      couple_sector: '',
      status: 'Ativo',
      campaign: 'SAUDE',
      created_at: person.created_at
    }));

    exportMembersToPDF(dataToExport, 'Relatório de Pessoas - Campanha Saúde');
    
    toast({
      title: "✅ Exportado!",
      description: "Dados de saúde exportados para PDF com sucesso.",
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
      } else {
        toast({
          title: "Erro ao alterar status",
          description: result.error || "Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
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
      } else {
        throw new Error(result.error || "Erro ao atualizar status");
      }
    } catch (error) {
      toast({
        title: "❌ Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  // Lógica de filtro por referrer:
  // Admin veem todos os usuários (sem filtro)
  // - Outros roles: vê apenas usuários que eles indicaram (filtro por user.full_name)
  const isAdminUser = isAdmin();
  const referrerFilter = isAdminUser ? undefined : user?.full_name;
  const userIdFilter = isAdminUser ? undefined : user?.id;
  
  // Verificar se usuário está sendo detectado corretamente
  // Verificar todas as funções de role
  // Verificar o que está sendo passado para os hooks
  // Verificar dados carregados
  const { users: allUsers, loading: usersLoading } = useUsers(referrerFilter, user?.campaign);
  const { stats, loading: statsLoading } = useStats(referrerFilter, user?.campaign);
  const { reportData, loading: reportsLoading } = useReports(referrerFilter, user?.campaign);
  const { userLinks, createLink, loading: linksLoading } = useUserLinks(userIdFilter, user?.campaign);
  
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
    softDeleteMember
  } = useMembers(referrerFilter, user?.campaign);

  // Hook para ranking de amigos
  const { 
    friends, 
    loading: friendsLoading,
    error: friendsError,
    getFriendsStats,
    softDeleteFriend
  } = useFriendsRanking(user?.campaign);

  
  
  const { 
    exportToPDF, 
    exportMembersToExcel, 
    exportContractsToExcel, 
    exportReportDataToPDF,
    exportFriendsToExcel,
    exportMembersToPDF,
    exportFriendsToPDF
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

  // Hook para pessoas da campanha de saúde (sempre chamar, mas só usar se admin3)
  const { 
    people: saudePeople, 
    loading: saudePeopleLoading,
    softDeletePerson: softDeleteSaudePerson,
    updateSaudePerson
  } = useSaudePeople();

  // Hooks para AdminHitech - Campanhas e Admins
  const { 
    campaigns, 
    loading: campaignsLoading,
    deleteCampaign,
    toggleCampaignStatus
  } = useCampaigns();

  const {
    admins,
    loading: adminsLoading,
    deleteAdmin,
    toggleAdminStatus
  } = useAdmins();

  // Verificar o que está sendo passado para os hooks
  // Verificar dados carregados


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
      toast({
        title: "Erro ao gerar link",
        description: 'error' in result ? result.error : "Tente novamente.",
        variant: "destructive",
      });
    }
  };


  // Filtrar membros baseado na pesquisa e filtros específicos (apenas membros, não amigos)
  const filteredMembers = members.filter(member => {
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

    return matchesSearch && matchesPhone && matchesLeader;
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
  if (usersLoading || statsLoading || reportsLoading || linksLoading || membersLoading || settingsLoading) {
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
                <span className={`${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'} font-medium`}>Bem-vindo, {user?.name}</span>
                <div className="text-sm text-muted-foreground">{user?.role}</div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className={`${user?.campaign === 'B' ? 'border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10' : 'border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10'}`}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
      {/* Header Fixed */}
      <div className={`bg-white shadow-[var(--shadow-card)] rounded-lg p-6 mb-8 border ${user?.campaign === 'B' ? 'border-institutional-light' : 'border-institutional-light'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`}>
              {isAdminHitech() 
                ? 'Hitech - Sistema de Gestão Conectados' 
                : isAdmin3() 
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
                : isAdmin3()
                ? "Gerencie sua rede de pessoas da área da saúde"
                : isAdminUser
                ? "Visão geral completa do sistema - Todos os usuários e dados consolidados"
                : "Gerencie sua rede de membros e acompanhe resultados"
              }
            </p>
          </div>
          
            {isAdminHitech() && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/cadastro-campanha')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              <Tag className="w-4 h-4 mr-2" />
              Cadastrar Nova Campanha
            </Button>
          </div>
            )}

            {isAdmin3() && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/cadastro-saude')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              Cadastrar Nova Pessoa
            </Button>
          </div>
            )}
            
            {(canGenerateLinks() || isAdminUser) && !isAdmin3() && !isAdminHitech() && (
          <div className="flex flex-col sm:flex-row gap-3">
            {canGenerateLinks() && (
            <Button
              onClick={generateLink}
                className={`${user?.campaign === 'B' ? 'bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue' : 'bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue'} font-medium`}
            >
              <Share2 className="w-4 h-4 mr-2" />
                Gerar e Copiar Link
            </Button>
            )}
            
            
            {isAdminUser && (
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
                    const hasReportData = (
                      Object.keys(reportData.usersByLocation).length > 0 ||
                      Object.keys(reportData.usersByCity).length > 0 ||
                      Object.keys(reportData.sectorsGroupedByCity).length > 0 ||
                      reportData.registrationsByDay.length > 0 ||
                      reportData.usersByStatus.length > 0 ||
                      reportData.recentActivity.length > 0
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
                    if (memberStats.total_members === 0 && memberStats.current_member_count === 0) {
                      toast({
                        title: "⚠️ Nenhum membro cadastrado",
                        description: "Não é possível gerar um relatório sem membros cadastrados",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Calcular Top 5 Membros (usando dados reais da tabela members)
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

                    exportReportDataToPDF(reportData as unknown as Record<string, unknown>, memberStats as unknown as Record<string, unknown>, topMembersData);
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
            )}
            
          </div>
          )}
        </div>

        {userLink && (
          <div className="mt-4 p-3 bg-institutional-light rounded-lg border border-institutional-gold/30">
            <p className="text-sm text-institutional-blue font-medium mb-1">
              {isAdminUser ? 'Link para cadastro de Membro:' : 'Seu link único:'}
            </p>
            <code className="text-xs break-all text-muted-foreground">{userLink}</code>
          </div>
        )}
      </div>

        {/* Controle de Tipo de Links - Apenas Administradores */}
        {isAdmin() && (
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
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${user?.campaign === 'B' ? 'text-blue-800' : 'text-blue-800'}`}>
                    <Settings className="w-4 h-4" />
                    Configurações do Sistema
                  </h4>
                  <p className={`text-sm mb-3 ${user?.campaign === 'B' ? 'text-blue-700' : 'text-blue-700'}`}>
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
                    className={`${user?.campaign === 'B' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gerenciar Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapa Interativo - Apenas Campanha B */}
        {user?.campaign === 'B' && (
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500 mb-6 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                Mapa Interativo
              </CardTitle>
              <CardDescription>
                Visualização geográfica da Campanha B
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[600px]">
                <iframe
                  src="/mapas/mapa.html"
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
                      O sistema excedeu o limite de {memberStats?.max_member_limit || 1500} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos ou ajustar o limite."}
                    </>
                  ) : isReached ? (
                    <>
                      O sistema atingiu o limite de {memberStats?.max_member_limit || 1500} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos."}
                    </>
                  ) : (
                    <>
                      O sistema está próximo do limite de {memberStats?.max_member_limit || 1500} membros. 
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

  

        {/* Gráficos de Estatísticas - Primeira Linha (Apenas Administradores) */}
        {isAdmin() && (
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
                <BarChart data={Object.entries(reportData.usersByLocation).map(([location, count]) => ({ location, quantidade: count }))}>
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
                {Object.entries(reportData.sectorsGroupedByCity)
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
                {Object.keys(reportData.sectorsGroupedByCity).length === 0 && (
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

        {/* Gráficos de Estatísticas - Segunda Linha (Apenas Administradores) */}
        {isAdmin() && (
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
                <BarChart data={Object.entries(reportData.usersByCity).map(([city, count]) => ({ city, quantidade: count }))}>
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
                {Object.entries(reportData.usersByCity)
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
                          {((count / memberStats.total_members) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                {Object.keys(reportData.usersByCity).length === 0 && (
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

        {/* Gráficos de Estatísticas - Terceira Linha (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* Gráfico de Linha - Cadastros Recentes */}
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
                <BarChart data={reportData.registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Membro com mais Amigos */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Top 5 - Membros
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
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
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
          </div>
        )}

        {/* Novos Reports - Engagement Rate e Registration Count (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          </div>
        )}

        {/* Seção para Membros Não-Administradores (exceto admin3 e AdminHitech) */}
        {!isAdmin() && !isAdmin3() && !isAdminHitech() && settings?.member_links_type === 'members' && (
          <div className="mb-8">
            {/* Informações sobre Amigos */}
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
                    <p className="text-blue-700 text-sm mb-2">
                      A fase de amigos será liberada em Breve. 
                      Cada membro poderá cadastrar 15 duplas de amigos quando ativada.
                    </p>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-sm font-medium">Disponível em Breve</span>
                    </div>
                  </div>
                  
               
                </div>
              </CardContent>
            </Card>


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

      
        {/* Cards de Resumo - Sistema de Membros (Apenas Administradores) */}
        {isAdmin() && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`}>Resumo do Sistema</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Card className={`shadow-[var(--shadow-card)] border-l-4 ${user?.campaign === 'B' ? 'border-l-institutional-gold' : 'border-l-institutional-gold'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
                  <p className={`text-2xl font-bold ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`}>{memberStats?.total_members || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {memberStats?.current_member_count || 0} / {memberStats?.max_member_limit || 1500}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${user?.campaign === 'B' ? 'bg-institutional-light' : 'bg-institutional-light'}`}>
                  <Users className={`w-6 h-6 ${user?.campaign === 'B' ? 'text-institutional-blue' : 'text-institutional-blue'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

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
          </div>
        )}


        {/* Cards de Amigos (se a fase estiver ativa) - Apenas Administradores */}
        {isAdmin() && settings?.paid_contracts_phase_active && (
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

        {/* Seção de Ranking de Membros (Apenas Administradores) */}
        {isAdmin() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <Users className="w-5 h-5" />
              {isAdminUser ? 'Membros' : 'Meu Ranking de Membros'}
            </CardTitle>
            <CardDescription>
              {isAdminUser
                ? "Ranking completo de todos os membros cadastrados no sistema"
                : "Seu ranking pessoal e membros vinculados ao seu link"
              }
            </CardDescription>
            {isAdmin() && (
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
          </div>

          {/* Tabela de Membros */}
          <div className="overflow-x-auto" id="members-table">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-institutional-light">
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Posição</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Membro e Parceiro</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Contratos</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                  {canDeleteUsers() && (
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
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
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-institutional-gold" />
                        </div>
                        <div>
                          <span className="font-medium text-institutional-blue">{member.name}</span>
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional-blue">
                          {member.contracts_completed}/15
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRankingStatusIcon(member.ranking_status)}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankingStatusColor(member.ranking_status)}`}>
                          {member.ranking_status}
                        </span>
                        {member.can_be_replaced && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            SUBSTITUÍVEL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-institutional-gold font-medium">{member.referrer}</span>
                      </div>
                    </td>
                    {canDeleteUsers() && (
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <UserIcon className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </td>
                    )}
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
                <span className="ml-2 text-blue-600 font-medium">(Limite máximo: 1.500)</span>
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

        {/* Card de Total de Amigos (Apenas Administradores) */}
        {isAdmin() && (
          <div className="mb-6 mt-8">
           
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Amigos</p>
                      <p className="text-2xl font-bold text-institutional-blue">{friends.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {friends.length} amigos cadastrados
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

        {/* Seção de Ranking de Amigos (Apenas Administradores) */}
        {isAdmin() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <Users className="w-5 h-5" />
              Amigos 
            </CardTitle>
            <CardDescription>
              Lista Completa de todos os amigos cadastrados no sistema
            </CardDescription>
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
                    {canDeleteUsers() && (
                      <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                    )}
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
                          <div>
                            <span className="font-medium text-institutional-blue">{friend.name}</span>
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
                      {canDeleteUsers() && (
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <UserIcon className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </td>
                      )}
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
                  <span className="ml-2 text-blue-600 font-medium">(Limite máximo: 22.500)</span>
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
        {isAdmin3() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <User className="w-5 h-5" />
              Pessoas Cadastradas
            </CardTitle>
            <CardDescription>
              Lista completa de todas as pessoas cadastradas da saúde
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
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => exportSaudePeopleToExcel()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                onClick={() => exportSaudePeopleToPDF()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>

            {/* Tabela de Pessoas de Saúde */}
            <div className="overflow-x-auto" id="saude-people-table">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-institutional-light">
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Líder</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp Líder</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Pessoa</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp Pessoa</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">CEP</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Observações</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
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
                          <span className="font-medium text-institutional-blue">{person.lider_nome_completo}</span>
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
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 line-clamp-2" title={person.observacoes}>
                          {person.observacoes}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(person.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSaudePerson(person)}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveSaudePerson(person.id, person.pessoa_nome_completo)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <UserIcon className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
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
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Tag className="w-5 h-5" />
                Campanhas Cadastradas
              </CardTitle>
              <CardDescription>
                Lista de todas as campanhas do sistema
              </CardDescription>
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
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Código</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor Primária</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor Secundária</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor Accent</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cor de Fundo</th>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-institutional-gold/20 text-institutional-blue">
                              {campaign.code}
                            </span>
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
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: campaign.accent_color }}
                              />
                              <span className="text-xs text-gray-600">{campaign.accent_color}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: campaign.background_color }}
                              />
                              <span className="text-xs text-gray-600">{campaign.background_color}</span>
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
                                    ? 'border-red-500 text-red-600 hover:bg-red-50' 
                                    : 'border-green-500 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {campaign.is_active ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Ativar
                                  </>
                                )}
                              </Button>
                              {campaign.is_active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditCampaign(campaign)}
                                  className="border-institutional-gold text-institutional-blue hover:bg-institutional-light"
                                >
                                  <Settings className="w-4 h-4 mr-1" />
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <UserCheck className="w-5 h-5" />
                Administradores do Sistema
              </CardTitle>
              <CardDescription>
                Lista de todos os administradores cadastrados
              </CardDescription>
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
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Username</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome Completo</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Campanha</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Data de Criação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
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
                              @{admin.username}
                            </span>
                            {(!admin.is_active || admin.deleted_at) && (
                              <span className="ml-2 text-xs text-red-500 font-semibold">
                                (DESATIVADO)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${
                              !admin.is_active || admin.deleted_at ? 'line-through text-gray-400' : ''
                            }`}>
                              {admin.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm text-gray-600 ${
                              !admin.is_active || admin.deleted_at ? 'line-through' : ''
                            }`}>
                              {admin.full_name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-institutional-gold/20 text-institutional-blue">
                              {admin.campaign}
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
                        </tr>
                      ))}
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

      </main>
    </div>
  );
}