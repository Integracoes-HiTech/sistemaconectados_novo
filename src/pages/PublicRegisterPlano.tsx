import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Package, DollarSign, CheckCircle, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plano {
  id: string;
  nome_plano: string;
  descricao: string;
  amount: number;
  recorrencia: string;
  features: string[];
  max_users: number;
  order_display: number;
  is_active: boolean;
  created_at: string;
}

export default function PublicRegisterPlano() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdminHitech, loading: authLoading } = useAuth();
  const { editMode, planoData } = (location.state || {}) as { 
    editMode?: boolean; 
    planoData?: Plano 
  };

  // Proteção de rota - apenas AdminHitech pode acessar
  useEffect(() => {
    const hasUserInStorage = !!localStorage.getItem('loggedUser')
    
    if (!authLoading && (!user || !isAdminHitech()) && !hasUserInStorage) {
      navigate('/login');
    }
  }, [user, isAdminHitech, authLoading, navigate]);

  const [formData, setFormData] = useState({
    nomePlano: "",
    descricao: "",
    amount: "",
    recorrencia: "MONTHLY",
    maxUsers: "",
    features: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Preencher formulário no modo de edição
  useEffect(() => {
    if (editMode && planoData) {
      setFormData({
        nomePlano: planoData.nome_plano,
        descricao: planoData.descricao || "",
        amount: planoData.amount.toString(),
        recorrencia: planoData.recorrencia || "MONTHLY",
        maxUsers: planoData.max_users?.toString() || "",
        features: Array.isArray(planoData.features) ? planoData.features.join(', ') : ""
      });
    }
  }, [editMode, planoData]);

  // Funções de validação
  const validateName = (name: string) => {
    return name.trim().length >= 3;
  };

  const validateAmount = (amount: string) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0;
  };

  const validateMaxUsers = (maxUsers: string) => {
    const num = parseInt(maxUsers);
    return !isNaN(num) && num > 0;
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

    if (!formData.nomePlano.trim()) {
      errors.nomePlano = "Nome do plano é obrigatório";
    } else if (!validateName(formData.nomePlano)) {
      errors.nomePlano = "Mínimo 3 caracteres";
    }

    if (!formData.amount) {
      errors.amount = "Valor é obrigatório";
    } else if (!validateAmount(formData.amount)) {
      errors.amount = "Valor inválido";
    }

    if (!formData.maxUsers) {
      errors.maxUsers = "Máximo de usuários é obrigatório";
    } else if (!validateMaxUsers(formData.maxUsers)) {
      errors.maxUsers = "Valor inválido";
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
      // Processar features (string separada por vírgula para array JSON)
      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Gerar ordem automaticamente (usar timestamp simplificado para ordem única)
      // Date.now() retorna milissegundos desde 1970, que é muito grande para INTEGER
      // Usamos apenas os últimos 9 dígitos ou contamos planos existentes + 1
      const orderDisplay = editMode && planoData?.order_display 
        ? planoData.order_display 
        : Math.floor(Date.now() / 1000); // Timestamp em segundos (menor valor)

      const planoDataToSave = {
        nome_plano: formData.nomePlano,
        descricao: formData.descricao || null,
        amount: parseFloat(formData.amount),
        recorrencia: formData.recorrencia,
        features: featuresArray,
        max_users: parseInt(formData.maxUsers),
        order_display: orderDisplay,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      // Debug temporário
      console.log('📋 Dados que serão salvos:', planoDataToSave);
      console.log('📋 FormData:', formData);
      console.log('📋 EditMode:', editMode);
      console.log('📋 PlanoData:', planoData);

      if (editMode && planoData) {
        // MODO DE EDIÇÃO - Atualizar plano existente
        const { error: updateError } = await supabase
          .from('planos_precos')
          .update(planoDataToSave)
          .eq('id', planoData.id);

        if (updateError) {
          console.error('❌ Erro UPDATE:', updateError);
          console.error('❌ Erro message:', updateError.message);
          console.error('❌ Erro details:', updateError.details);
          console.error('❌ Erro hint:', updateError.hint);
          console.error('❌ Erro code:', updateError.code);
          throw updateError;
        }
        
        setIsSuccess(true);
        toast({
          title: "✅ Plano atualizado!",
          description: `O plano "${formData.nomePlano}" foi atualizado com sucesso.`,
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        // MODO DE CRIAÇÃO - Criar novo plano
        const { error: insertError } = await supabase
          .from('planos_precos')
          .insert([{
            ...planoDataToSave,
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('❌ Erro INSERT:', insertError);
          console.error('❌ Erro message:', insertError.message);
          console.error('❌ Erro details:', insertError.details);
          console.error('❌ Erro hint:', insertError.hint);
          console.error('❌ Erro code:', insertError.code);
          throw insertError;
        }

        setIsSuccess(true);
        toast({
          title: "✅ Plano criado!",
          description: `O plano "${formData.nomePlano}" foi criado com sucesso.`,
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao salvar o plano.";
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
              {editMode ? 'Plano Atualizado!' : 'Plano Criado!'}
            </h2>
            <p className="text-gray-600">
              {editMode 
                ? 'O plano foi atualizado com sucesso.'
                : 'O novo plano foi cadastrado com sucesso.'}
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
          {editMode ? 'Editar Plano' : 'Cadastro de Novo Plano'}
        </h1>
        <p className="text-gray-300">
          {editMode 
            ? 'Atualize os dados do plano abaixo' 
            : 'Preencha os dados abaixo para criar um novo plano'
          }
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-2xl space-y-6">
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Nome do Plano */}
            <div className="space-y-1">
              <label className="text-white text-sm font-medium">Nome do Plano *</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ex: Profissional"
                  value={formData.nomePlano}
                  onChange={(e) => handleInputChange('nomePlano', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.nomePlano ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {formErrors.nomePlano && (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formErrors.nomePlano}</span>
                </div>
              )}
            </div>

            {/* Campo Valor */}
            <div className="space-y-1">
              <label className="text-white text-sm font-medium">Valor (R$) *</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.amount ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {formErrors.amount && (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formErrors.amount}</span>
                </div>
              )}
            </div>

            {/* Campo Recorrência */}
            <div className="space-y-1">
              <label className="text-white text-sm font-medium">Recorrência *</label>
              <Input
                type="text"
                placeholder="Ex: MONTHLY, QUARTERLY, YEARLY"
                value={formData.recorrencia}
                onChange={(e) => handleInputChange('recorrencia', e.target.value.toUpperCase())}
                className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
                required
              />
              <p className="text-xs text-gray-400">
                Sugestões: MONTHLY, QUARTERLY, SEMIANNUAL, YEARLY
              </p>
            </div>

            {/* Campo Máximo de Usuários */}
            <div className="space-y-1">
              <label className="text-white text-sm font-medium">Máximo de Usuários *</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  type="number"
                  placeholder="1000"
                  value={formData.maxUsers}
                  onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                  className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.maxUsers ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {formErrors.maxUsers && (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formErrors.maxUsers}</span>
                </div>
              )}
            </div>

          </div>

          {/* Campo Descrição */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">Descrição</label>
            <Textarea
              placeholder="Descrição do plano..."
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="min-h-[80px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            />
          </div>

          {/* Campo Features */}
          <div className="space-y-1">
            <label className="text-white text-sm font-medium">
              Funcionalidades (separadas por vírgula)
            </label>
            <Textarea
              placeholder="1000 cadastros, Painel completo, Mapa interativo, Relatórios"
              value={formData.features}
              onChange={(e) => handleInputChange('features', e.target.value)}
              className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            />
            <p className="text-xs text-gray-400">
              Separe cada funcionalidade com vírgula
            </p>
          </div>

          {/* Botão Cadastrar/Atualizar */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg mt-6"
          >
            {isLoading ? (
              <>Processando...</>
            ) : (
              <>{editMode ? 'Atualizar Plano' : 'Cadastrar Plano'}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

