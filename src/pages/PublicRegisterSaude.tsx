import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, FileText, AlertCircle, CheckCircle, UserPlus, ArrowLeft } from "lucide-react";
import { buscarCep, validarFormatoCep } from "@/services/cepService";
import { useSaudePeople } from "@/hooks/useSaudePeople";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import type { SaudePerson } from "@/hooks/useSaudePeople";

export default function PublicRegisterSaude() {
  const navigate = useNavigate();
  const location = useLocation();
  const { editMode, personData, campaign } = (location.state as { editMode?: boolean; personData?: SaudePerson; campaign?: string }) || {};
  
  // Proteção de rota - apenas admin3 pode acessar
  const { user, isAdmin3, loading: authLoading } = useAuth();
  
  useEffect(() => {
    
    // Verificar se há dados de usuário no localStorage antes de redirecionar
    const hasUserInStorage = !!localStorage.getItem('loggedUser')
    
    if (!authLoading && (!user || !isAdmin3()) && !hasUserInStorage) {
      navigate('/login');
    } else if (!authLoading && (!user || !isAdmin3()) && hasUserInStorage) {
    }
  }, [user, isAdmin3, authLoading, navigate]);
  
  const [formData, setFormData] = useState({
    liderNomeCompleto: "",
    liderWhatsapp: "",
    pessoaNomeCompleto: "",
    pessoaWhatsapp: "",
    cep: "",
    cidade: "",
    observacoes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const { toast } = useToast();
  const { addSaudePerson, checkPersonExists, updateSaudePerson } = useSaudePeople(user?.campaign);
  const { getCampaignByCode, loading: campaignsLoading } = useCampaigns();
  
  // Buscar cores da campanha específica do usuário com memoização
  const { bgColor, accentColor } = useMemo(() => {
    // Usar a campanha passada via state ou a campanha do usuário
    const campaignCode = campaign || user?.campaign || 'saude';
    const userCampaign = getCampaignByCode(campaignCode);
    
    return {
      bgColor: userCampaign?.primary_color || '#14446C',
      accentColor: userCampaign?.secondary_color || '#D4AF37'
    };
  }, [getCampaignByCode, campaign, user?.campaign]);

  // Carregar dados para edição
  useEffect(() => {
    if (editMode && personData) {
      setFormData({
        liderNomeCompleto: personData.lider_nome_completo,
        liderWhatsapp: personData.lider_whatsapp,
        pessoaNomeCompleto: personData.pessoa_nome_completo,
        pessoaWhatsapp: personData.pessoa_whatsapp,
        cep: personData.cep || "",
        cidade: personData.cidade || "",
        observacoes: personData.observacoes
      });
    }
  }, [editMode, personData]);

  // Funções de validação
  const validateName = (name: string) => {
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
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'liderWhatsapp' || field === 'pessoaWhatsapp') {
      processedValue = formatPhone(value);
    } else if (field === 'liderNomeCompleto' || field === 'pessoaNomeCompleto') {
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'cep') {
      processedValue = formatCep(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpar erro quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Buscar cidade automaticamente quando CEP estiver completo
  const handleCepBlur = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    
    if (!cepLimpo) {
      setFormData(prev => ({ ...prev, cidade: "" }));
      return;
    }

    if (!validarFormatoCep(formData.cep)) {
      setFormErrors(prev => ({ ...prev, cep: "CEP inválido" }));
      setFormData(prev => ({ ...prev, cidade: "" }));
      return;
    }

    setCepLoading(true);
    
    try {
      const resultado = await buscarCep(cepLimpo);
      
      // Preencher cidade com os dados do serviço
      setFormData(prev => ({ 
        ...prev, 
        cidade: `${resultado.cidade} - ${resultado.uf}` 
      }));
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cep;
        return newErrors;
      });
    } catch (error) {
      setFormErrors(prev => ({ ...prev, cep: error instanceof Error ? error.message : "Erro ao buscar CEP" }));
      setFormData(prev => ({ ...prev, cidade: "" }));
    } finally {
      setCepLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validar líder
    if (!formData.liderNomeCompleto.trim()) {
      errors.liderNomeCompleto = "Nome do líder é obrigatório";
    } else if (!validateName(formData.liderNomeCompleto)) {
      errors.liderNomeCompleto = "Digite nome e sobrenome completos";
    }

    if (!formData.liderWhatsapp) {
      errors.liderWhatsapp = "WhatsApp do líder é obrigatório";
    } else if (!validatePhone(formData.liderWhatsapp)) {
      const cleanPhone = formData.liderWhatsapp.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        errors.liderWhatsapp = "WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)";
      } else {
        const ddd = parseInt(cleanPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          errors.liderWhatsapp = "DDD inválido. Use um DDD válido (11-99)";
        } else if (parseInt(cleanPhone.substring(2, 3)) !== 9) {
          errors.liderWhatsapp = "Número deve começar com 9 (celular)";
        } else {
          errors.liderWhatsapp = "Número de telefone inválido";
        }
      }
    }

    // Validar pessoa
    if (!formData.pessoaNomeCompleto.trim()) {
      errors.pessoaNomeCompleto = "Nome da pessoa é obrigatório";
    } else if (!validateName(formData.pessoaNomeCompleto)) {
      errors.pessoaNomeCompleto = "Digite nome e sobrenome completos";
    }

    if (!formData.pessoaWhatsapp) {
      errors.pessoaWhatsapp = "WhatsApp da pessoa é obrigatório";
    } else if (!validatePhone(formData.pessoaWhatsapp)) {
      const cleanPhone = formData.pessoaWhatsapp.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        errors.pessoaWhatsapp = "WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)";
      } else {
        const ddd = parseInt(cleanPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          errors.pessoaWhatsapp = "DDD inválido. Use um DDD válido (11-99)";
        } else if (parseInt(cleanPhone.substring(2, 3)) !== 9) {
          errors.pessoaWhatsapp = "Número deve começar com 9 (celular)";
        } else {
          errors.pessoaWhatsapp = "Número de telefone inválido";
        }
      }
    }

    // Validar CEP (opcional, mas se preenchido deve ser válido)
    if (formData.cep && !validarFormatoCep(formData.cep)) {
      errors.cep = "CEP inválido";
    }

    // Validar observações (obrigatório)
    if (!formData.observacoes.trim()) {
      errors.observacoes = "Observações são obrigatórias";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Campos inválidos",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editMode && personData) {
        // Modo de edição
        const success = await updateSaudePerson(personData.id, {
          lider_nome_completo: formData.liderNomeCompleto,
          lider_whatsapp: formData.liderWhatsapp,
          pessoa_nome_completo: formData.pessoaNomeCompleto,
          pessoa_whatsapp: formData.pessoaWhatsapp,
          cep: formData.cep || undefined,
          cidade: formData.cidade || undefined,
          observacoes: formData.observacoes,
        });

        if (success) {
          toast({
            title: "✅ Pessoa atualizada!",
            description: "Os dados foram atualizados com sucesso.",
          });
          navigate("/dashboard");
        }
      } else {
        // Modo de cadastro
        // Verificar duplicidade
        const personExists = await checkPersonExists(formData.pessoaWhatsapp.replace(/\D/g, ''));

        if (personExists) {
          toast({
            title: "WhatsApp já cadastrado",
            description: "Esta pessoa já está cadastrada no sistema.",
            variant: "destructive",
          });
          return;
        }

        await addSaudePerson({
          lider_nome_completo: formData.liderNomeCompleto,
          lider_whatsapp: formData.liderWhatsapp,
          pessoa_nome_completo: formData.pessoaNomeCompleto,
          pessoa_whatsapp: formData.pessoaWhatsapp,
          cep: formData.cep || undefined,
          cidade: formData.cidade || undefined,
          observacoes: formData.observacoes,
          campaign: campaign || user?.campaign
        });

        toast({
          title: "✅ Pessoa cadastrada!",
          description: "A pessoa foi cadastrada com sucesso. Redirecionando...",
        });

        // Redirecionar para o dashboard após 1.5 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Aguardar carregar campanhas antes de renderizar para evitar flash de cores
  if (campaignsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
      {/* Botão Voltar ao Dashboard */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="bg-[#CFBA7F] hover:bg-[#CFBA7F]/90 text-white border-none font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Logo no topo */}
      <div className="mb-8">
        <Logo size="lg" showText={true} layout="vertical" textColor="white" />
      </div>

      {/* Informação do Cadastro */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          {editMode ? "Editar Pessoa Saúde" : "Cadastrar Nova Pessoa"}
        </h1>
        <p className="text-gray-300">
          Sistema de Gestão de Pessoas
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        {/* Separador - Dados do Líder */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-white text-sm font-medium">Dados do Líder</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* Campo Nome do Líder */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo do Líder (ex: João Silva)"
              value={formData.liderNomeCompleto}
              onChange={(e) => handleInputChange('liderNomeCompleto', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-lg ${formErrors.liderNomeCompleto ? 'border-red-500' : ''}`}
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = accentColor}
              onBlur={(e) => e.target.style.borderColor = ''}
              required
            />
          </div>
          {formErrors.liderNomeCompleto && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.liderNomeCompleto}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp do Líder */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp do Líder (62) 99999-9999"
              value={formData.liderWhatsapp}
              onChange={(e) => handleInputChange('liderWhatsapp', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.liderWhatsapp ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.liderWhatsapp && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.liderWhatsapp}</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-white text-sm font-medium">Dados da Pessoa</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* Campo Nome da Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo da Pessoa (ex: Maria Silva)"
              value={formData.pessoaNomeCompleto}
              onChange={(e) => handleInputChange('pessoaNomeCompleto', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.pessoaNomeCompleto ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.pessoaNomeCompleto && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.pessoaNomeCompleto}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp da Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp da Pessoa (62) 99999-9999"
              value={formData.pessoaWhatsapp}
              onChange={(e) => handleInputChange('pessoaWhatsapp', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.pessoaWhatsapp ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.pessoaWhatsapp && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.pessoaWhatsapp}</span>
            </div>
          )}
        </div>

        {/* Campo CEP */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="CEP (12345-678) - Opcional"
              value={formData.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              onBlur={handleCepBlur}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.cep ? 'border-red-500' : ''}`}
              maxLength={9}
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
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cidade (preenchida automaticamente pelo CEP)"
              value={formData.cidade}
              onChange={(e) => handleInputChange('cidade', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.cidade ? 'border-red-500' : ''}`}
              disabled
            />
            {formData.cidade && (
              <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          {formErrors.cidade && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.cidade}</span>
            </div>
          )}
        </div>

        {/* Campo Observações */}
        <div className="space-y-1">
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <Textarea
              placeholder="Observações sobre a pessoa..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              className={`pl-12 min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.observacoes ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.observacoes && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.observacoes}</span>
            </div>
          )}
        </div>

        {/* Botão Cadastrar */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-[#CFBA7F] hover:bg-[#B8A570] text-white font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {editMode ? "Atualizando..." : "Cadastrando..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {editMode ? "Atualizar Cadastro" : "Finalizar Cadastro"}
            </div>
          )}
        </Button>

      </div>

      {/* Rodapé */}
    
    </div>
  );
}
