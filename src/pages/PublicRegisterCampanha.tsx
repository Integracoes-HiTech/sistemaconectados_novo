import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tag, Palette, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Campaign } from "@/hooks/useCampaigns";

export default function PublicRegisterCampanha() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { editMode, campaignData } = (location.state || {}) as { 
    editMode?: boolean; 
    campaignData?: Campaign 
  };

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    primaryColor: "#1e40af",
    secondaryColor: "#d4af37",
    accentColor: "#d4af37",
    backgroundColor: "#1e3a8a"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
  const { toast } = useToast();

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (editMode && campaignData) {
      setFormData({
        name: campaignData.name,
        code: campaignData.code,
        primaryColor: campaignData.primary_color,
        secondaryColor: campaignData.secondary_color,
        accentColor: campaignData.accent_color || "#d4af37",
        backgroundColor: campaignData.background_color || "#1e3a8a"
      });
    }
  }, [editMode, campaignData]);

  // Funções de validação
  const validateName = (name: string) => {
    return name.trim().length >= 3;
  };

  const validateCode = (code: string) => {
    const codeRegex = /^[A-Z0-9]+$/;
    return code.length >= 1 && code.length <= 10 && codeRegex.test(code);
  };

  const validateColor = (color: string) => {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'code' ? value.toUpperCase() : value
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
      errors.name = "Nome da campanha é obrigatório";
    } else if (!validateName(formData.name)) {
      errors.name = "Mínimo 3 caracteres";
    }

    if (!formData.code.trim()) {
      errors.code = "Código da campanha é obrigatório";
    } else if (!validateCode(formData.code)) {
      errors.code = "Use apenas letras maiúsculas e números (máx. 10 caracteres)";
    }

    if (!validateColor(formData.primaryColor)) {
      errors.primaryColor = "Cor primária inválida";
    }

    if (!validateColor(formData.secondaryColor)) {
      errors.secondaryColor = "Cor secundária inválida";
    }

    if (!validateColor(formData.accentColor)) {
      errors.accentColor = "Cor accent inválida";
    }

    if (!validateColor(formData.backgroundColor)) {
      errors.backgroundColor = "Cor de fundo inválida";
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
        description: "Por favor, preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editMode && campaignData) {
        // MODO DE EDIÇÃO - Atualizar campanha existente
        console.log('📝 Atualizando campanha:', campaignData.id);

        const { data: updatedCampaign, error: updateError } = await supabase
          .from('campaigns')
          .update({
            name: formData.name,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            accent_color: formData.accentColor,
            background_color: formData.backgroundColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignData.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('✅ Campanha atualizada:', updatedCampaign);
        
        setIsSuccess(true);
        toast({
          title: "✅ Campanha atualizada!",
          description: `A campanha "${formData.name}" foi atualizada com sucesso.`,
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        // MODO DE CRIAÇÃO - Criar nova campanha
        // Verificar se o código da campanha já existe
        const { data: existingCampaign, error: checkError } = await supabase
          .from('campaigns')
          .select('id')
          .eq('code', formData.code)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingCampaign) {
          toast({
            title: "Campanha já existe",
            description: "Este código de campanha já está em uso. Escolha outro.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // PASSO 1: Gerar credenciais do admin automaticamente
        const nomeLimpo = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = `admin${nomeLimpo}`;
        const password = `${nomeLimpo.substring(0, 10)}${formData.code}`;
        const displayName = formData.name.split(' ')[0];

        console.log('🔐 Gerando credenciais do admin...');
        console.log('Username:', username);
        console.log('Password:', password);

        // PASSO 2: Criar o admin na tabela auth_users (com permissões completas)
        const { data: newAdmin, error: adminError } = await supabase
          .from('auth_users')
          .insert([
            {
              username: username,
              password: password,
              name: `Admin ${formData.name}`,
              role: 'Administrador',  // Role completo (todas as permissões)
              campaign: formData.code,
              full_name: `Admin ${formData.name} - Administrador`,
              display_name: displayName,
              is_active: true
            }
          ])
          .select()
          .single();

        if (adminError) {
          console.error('❌ Erro ao criar admin:', adminError);
          throw new Error(`Erro ao criar admin: ${adminError.message}`);
        }

        console.log('✅ Admin criado com sucesso:', newAdmin);

        // PASSO 3: Criar a nova campanha (sem admin_user_id - pode ter vários admins)
        const { data: newCampaign, error: insertError } = await supabase
          .from('campaigns')
          .insert([
            {
              name: formData.name,
              code: formData.code,
              primary_color: formData.primaryColor,
              secondary_color: formData.secondaryColor,
              accent_color: formData.accentColor,
              background_color: formData.backgroundColor,
              is_active: true
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erro ao criar campanha:', insertError);
          // ROLLBACK: Deletar o admin se a campanha falhar
          await supabase.from('auth_users').delete().eq('id', newAdmin.id);
          throw new Error(`Erro ao criar campanha: ${insertError.message}`);
        }

        console.log('✅ Campanha cadastrada com sucesso:', newCampaign);
        
        // Salvar credenciais para exibir na tela de sucesso
        setCreatedCredentials({ username, password });
        setIsSuccess(true);
        
        toast({
          title: "✅ Campanha e Admin criados!",
          description: `Campanha "${formData.name}" criada com sucesso!`,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('❌ Erro ao salvar campanha:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && createdCredentials) {
    const handleLoginWithCredentials = async () => {
      try {
        // Fazer login automático com as credenciais criadas
        const success = await login(createdCredentials.username, createdCredentials.password);
        
        if (success) {
          toast({
            title: "✅ Login realizado!",
            description: "Redirecionando para o dashboard...",
          });
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          toast({
            title: "Erro ao fazer login",
            description: "Tente fazer login manualmente na tela inicial.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        toast({
          title: "Erro ao fazer login",
          description: "Tente fazer login manualmente na tela inicial.",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Logo no topo */}
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>

        {/* Tela de Sucesso com Credenciais */}
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-institutional-blue mb-4 text-center">
              ✅ Campanha e Admin Criados!
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              A campanha "{formData.name}" foi cadastrada com sucesso.
            </p>

            {/* Card com Credenciais */}
            <div className="bg-institutional-light rounded-lg p-6 mb-6 border-2 border-institutional-gold">
              <h3 className="text-lg font-semibold text-institutional-blue mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Credenciais do Administrador
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Username:</p>
                  <p className="text-lg font-mono font-bold text-institutional-blue break-all">
                    {createdCredentials.username}
                  </p>
                </div>

                <div className="bg-white rounded p-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Senha:</p>
                  <p className="text-lg font-mono font-bold text-institutional-blue break-all">
                    {createdCredentials.password}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Atenção:</strong> Repasse essas credenciais! Elas serão passadas ao admin responsavel.
                  </p>
                </div>
              </div>
            </div>

            {/* Botão para fazer login */}
            <Button
              onClick={handleLoginWithCredentials}
              className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Fazer Login com estas Credenciais
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
          className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
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
          {editMode ? 'Editar Campanha' : 'Cadastro de Nova Campanha'}
        </h1>
        <p className="text-gray-300">
          {editMode 
            ? 'Atualize os dados da campanha abaixo' 
            : 'Preencha os dados abaixo para criar uma nova campanha'
          }
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        
        {/* SEÇÃO: Dados da Campanha */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-4">Dados da Campanha</h3>
          </div>

          {/* Campo Nome */}
          <div className="space-y-1">
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome da Campanha (ex: Campanha Saúde 2025)"
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

          {/* Campo Código */}
          <div className="space-y-1">
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Código (ex: C, SAUDE, 2025)"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.code ? 'border-red-500' : ''}`}
                maxLength={10}
                required
                disabled={editMode}
                title={editMode ? 'Código não pode ser alterado' : ''}
              />
            </div>
            {editMode && (
              <p className="text-xs text-gray-400">
                O código da campanha não pode ser alterado
              </p>
            )}
            {formErrors.code && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.code}</span>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO: Cores da Campanha */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-4">Cores da Campanha</h3>
          </div>

          {/* Cor Primária */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Cor Primária</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Palette className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="#1e40af"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.primaryColor ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer bg-gray-800 border-gray-700"
              />
            </div>
            {formErrors.primaryColor && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.primaryColor}</span>
              </div>
            )}
          </div>

          {/* Cor Secundária */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Cor Secundária (Dourado)</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Palette className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="#d4af37"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.secondaryColor ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer bg-gray-800 border-gray-700"
              />
            </div>
            {formErrors.secondaryColor && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.secondaryColor}</span>
              </div>
            )}
          </div>

          {/* Cor Accent */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Cor Accent (Destaque)</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Palette className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="#d4af37"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.accentColor ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => handleInputChange('accentColor', e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer bg-gray-800 border-gray-700"
              />
            </div>
            {formErrors.accentColor && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.accentColor}</span>
              </div>
            )}
          </div>

          {/* Cor de Fundo */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Cor de Fundo</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Palette className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="#1e3a8a"
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.backgroundColor ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer bg-gray-800 border-gray-700"
              />
            </div>
            {formErrors.backgroundColor && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.backgroundColor}</span>
              </div>
            )}
          </div>

          {/* Preview das Cores */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-white text-sm font-medium mb-3">Preview das Cores:</p>
            <div className="grid grid-cols-2 gap-2">
              <div 
                className="h-16 rounded-lg border-2 border-gray-600 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: formData.primaryColor }}
                title="Cor Primária"
              >
                Primária
              </div>
              <div 
                className="h-16 rounded-lg border-2 border-gray-600 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: formData.secondaryColor }}
                title="Cor Secundária"
              >
                Secundária
              </div>
              <div 
                className="h-16 rounded-lg border-2 border-gray-600 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: formData.accentColor }}
                title="Cor Accent"
              >
                Accent
              </div>
              <div 
                className="h-16 rounded-lg border-2 border-gray-600 flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: formData.backgroundColor }}
                title="Cor de Fundo"
              >
                Fundo
              </div>
            </div>
          </div>
        </div>

        {/* Botão Cadastrar/Atualizar */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-institutional-blue border-t-transparent rounded-full animate-spin" />
              {editMode ? 'Atualizando...' : 'Cadastrando...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {editMode ? 'Atualizar Campanha' : 'Finalizar Cadastro'}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}

