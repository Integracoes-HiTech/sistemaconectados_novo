import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock, Tag, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabaseServerless } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Admin {
  id: string;
  username: string;
  name: string;
  campaign: string;
  is_active: boolean;
  created_at: string;
}

export default function PublicRegisterAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdminHitech, loading: authLoading } = useAuth();
  const { editMode, adminData } = (location.state || {}) as { 
    editMode?: boolean; 
    adminData?: Admin 
  };

  // Proteção de rota - apenas AdminHitech pode acessar
  useEffect(() => {
    const hasUserInStorage = !!localStorage.getItem('loggedUser')
    
    if (!authLoading && (!user || !isAdminHitech()) && !hasUserInStorage) {
      navigate('/login');
    }
  }, [user, isAdminHitech, authLoading, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    campaign: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  // Estado para campanhas disponíveis
  const [campanhas, setCampanhas] = useState<Array<{ code: string; name: string }>>([]);
  const [campanhasLoading, setCampanhasLoading] = useState(true);

  // Carregar campanhas do banco
  useEffect(() => {
    const fetchCampanhas = async () => {
      try {
        const { data, error } = await supabaseServerless
          .from('campaigns')
          .select('code, name')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setCampanhas(data || []);
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        toast({
          title: "Erro ao carregar campanhas",
          description: "Não foi possível carregar as campanhas disponíveis.",
          variant: "destructive",
        });
      } finally {
        setCampanhasLoading(false);
      }
    };

    fetchCampanhas();
  }, [toast]);

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (editMode && adminData) {
      setFormData({
        name: adminData.name,
        username: adminData.username,
        password: "", // Senha vazia no modo de edição
        campaign: adminData.campaign
      });
    }
  }, [editMode, adminData]);

  // Funções de validação
  const validateName = (name: string) => {
    return name.trim().length >= 3;
  };

  const validateUsername = (username: string) => {
    return username.trim().length >= 3;
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateRequiredFields = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    } else if (!validateName(formData.name)) {
      errors.name = "Mínimo 3 caracteres";
    }

    if (!editMode) {
      if (!formData.username.trim()) {
        errors.username = "Username é obrigatório";
      } else if (!validateUsername(formData.username)) {
        errors.username = "Mínimo 3 caracteres";
      }
    }

    if (!editMode || formData.password) {
      if (!formData.password) {
        errors.password = "Senha é obrigatória";
      } else if (!validatePassword(formData.password)) {
        errors.password = "Mínimo 6 caracteres";
      }
    }

    if (!formData.campaign) {
      errors.campaign = "Selecione uma campanha";
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateRequiredFields();
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editMode && adminData) {
        // MODO DE EDIÇÃO - Atualizar admin existente
        const updateData: {
          name: string;
          campaign: string;
          updated_at: string;
          password?: string;
        } = {
          name: formData.name,
          campaign: formData.campaign,
          updated_at: new Date().toISOString()
        };

        // Só atualiza senha se fornecida
        if (formData.password) {
          updateData.password = formData.password;
        }

        const { error: updateError } = await supabaseServerless
          .from('auth_users')
          .update(updateData)
          .eq('id', adminData.id);

        if (updateError) {
          throw updateError;
        }
        
        setIsSuccess(true);
        toast({
          title: "✅ Administrador atualizado!",
          description: `O administrador "${formData.name}" foi atualizado com sucesso.`,
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        // MODO DE CRIAÇÃO - Criar novo admin
        // Verificar se o username já existe
        const { data: existingAdminData, error: checkError } = await supabaseServerless
          .from('auth_users')
          .select('id')
          .eq('username', formData.username);
        
        // maybeSingle não existe, então pegamos o primeiro resultado
        const existingAdmin = Array.isArray(existingAdminData) && existingAdminData.length > 0 
          ? existingAdminData[0] 
          : null;

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingAdmin) {
          toast({
            title: "Username já existe",
            description: "Este username já está em uso. Escolha outro.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Criar o novo admin
        const { error: insertError } = await supabaseServerless
          .from('auth_users')
          .insert([
            {
              username: formData.username,
              password: formData.password,
              name: formData.name,
              role: 'Administrador',
              campaign: formData.campaign,
              full_name: `Admin ${formData.name}`,
              is_active: true
            }
          ]);

        if (insertError) {
          throw insertError;
        }

        setIsSuccess(true);
        toast({
          title: "✅ Administrador criado!",
          description: `O administrador "${formData.name}" foi criado com sucesso.`,
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Erro ao salvar admin:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao salvar o administrador.";
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-institutional-blue mb-2">
              {editMode ? 'Administrador Atualizado!' : 'Administrador Criado!'}
            </h2>
            <p className="text-gray-600">
              {editMode 
                ? 'As informações do administrador foram atualizadas com sucesso.'
                : 'O novo administrador foi cadastrado com sucesso.'}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
      {/* Botão Voltar no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => navigate('/dashboard')}
          className="bg-[#CFBA7F] hover:bg-[#CFBA7F]/90 text-white font-medium rounded-lg"
        >
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Logo no topo */}
      <div className="mb-8">
        <Logo size="lg" showText={true} layout="vertical" textColor="white" />
      </div>

      {/* Título */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          {editMode ? 'Editar Administrador' : 'Cadastro de Novo Administrador'}
        </h1>
        <p className="text-gray-300">
          {editMode 
            ? 'Atualize os dados do administrador abaixo' 
            : 'Preencha os dados abaixo para criar um novo administrador'
          }
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Nome */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Nome *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome do Administrador"
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

          {/* Campo Username (desabilitado no modo de edição) */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Username *</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Username para login"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.username ? 'border-red-500' : ''}`}
                required
                disabled={editMode}
                title={editMode ? 'Username não pode ser alterado' : ''}
              />
            </div>
            {editMode && (
              <p className="text-xs text-gray-400">
                O username não pode ser alterado
              </p>
            )}
            {formErrors.username && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.username}</span>
              </div>
            )}
          </div>

          {/* Campo Senha */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">
              Senha {editMode ? '(deixe em branco para não alterar)' : '*'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={editMode ? "Nova senha (opcional)" : "Senha"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-12 pr-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.password ? 'border-red-500' : ''}`}
                required={!editMode}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formErrors.password && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.password}</span>
              </div>
            )}
          </div>

          {/* Select Campanha */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Campanha *</label>
            <Select
              value={formData.campaign}
              onValueChange={(value) => handleInputChange('campaign', value)}
              disabled={campanhasLoading}
            >
              <SelectTrigger className={`h-12 bg-gray-800 border-gray-700 text-white focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.campaign ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={campanhasLoading ? "Carregando..." : "Selecione uma campanha"} />
              </SelectTrigger>
              <SelectContent>
                {campanhas.map((campanha) => (
                  <SelectItem key={campanha.code} value={campanha.code}>
                    {campanha.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.campaign && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.campaign}</span>
              </div>
            )}
          </div>

          {/* Botão Cadastrar/Atualizar */}
          <Button
            type="submit"
            disabled={isLoading || campanhasLoading}
            className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg mt-6"
          >
            {isLoading ? (
              <>Processando...</>
            ) : (
              <>{editMode ? 'Atualizar Administrador' : 'Cadastrar Administrador'}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

