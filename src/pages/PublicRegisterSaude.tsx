import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, Building, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { buscarCep, validarFormatoCep } from "@/services/cepService";
import { useSaudePeople } from "@/hooks/useSaudePeople";
import type { SaudePerson } from "@/hooks/useSaudePeople";

export default function PublicRegisterSaude() {
  const navigate = useNavigate();
  const location = useLocation();
  const { editMode, personData } = (location.state as { editMode?: boolean; personData?: SaudePerson }) || {};
  
  const [formData, setFormData] = useState({
    leaderName: "",
    leaderWhatsapp: "",
    leaderCep: "",
    personName: "",
    personWhatsapp: "",
    personCep: "",
    observation: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [leaderCepLoading, setLeaderCepLoading] = useState(false);
  const [personCepLoading, setPersonCepLoading] = useState(false);
  const { toast } = useToast();
  const { addSaudePerson, checkPersonExists, updateSaudePerson } = useSaudePeople();

  // Carregar dados para edição
  useEffect(() => {
    if (editMode && personData) {
      setFormData({
        leaderName: personData.leader_name,
        leaderWhatsapp: personData.leader_whatsapp,
        leaderCep: personData.leader_cep || "",
        personName: personData.person_name,
        personWhatsapp: personData.person_whatsapp,
        personCep: personData.person_cep || "",
        observation: personData.observation
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
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11;
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
    
    if (field === 'leaderWhatsapp' || field === 'personWhatsapp') {
      processedValue = formatPhone(value);
    } else if (field === 'leaderName' || field === 'personName') {
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'leaderCep' || field === 'personCep') {
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

  // Função para validar CEP quando o campo perde o foco
  const handleCepBlur = async (field: 'leaderCep' | 'personCep') => {
    const cepValue = formData[field];
    
    if (!cepValue || cepValue.trim() === '') {
      return; // CEP é opcional, não validar se estiver vazio
    }

    const isLeader = field === 'leaderCep';
    
    try {
      if (isLeader) {
        setLeaderCepLoading(true);
      } else {
        setPersonCepLoading(true);
      }

      // Limpar erros anteriores
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));

      // Validar formato
      if (!validarFormatoCep(cepValue)) {
        setFormErrors(prev => ({
          ...prev,
          [field]: 'CEP inválido. Use o formato 12345-678'
        }));
        return;
      }

      // Buscar CEP para validar se existe
      await buscarCep(cepValue);
      
      // Se chegou aqui, o CEP é válido
      toast({
        title: "CEP válido",
        description: "CEP encontrado com sucesso!",
      });

    } catch (error) {
      setFormErrors(prev => ({
        ...prev,
        [field]: 'CEP não encontrado. Verifique e tente novamente.'
      }));
    } finally {
      if (isLeader) {
        setLeaderCepLoading(false);
      } else {
        setPersonCepLoading(false);
      }
    }
  };

  const validateRequiredFields = async () => {
    const errors: Record<string, string> = {};

    // Validar líder - apenas Nome e WhatsApp obrigatórios
    if (!formData.leaderName.trim()) {
      errors.leaderName = "Nome do líder é obrigatório";
    } else if (!validateName(formData.leaderName)) {
      errors.leaderName = "Deve conter nome e sobrenome";
    }

    if (!formData.leaderWhatsapp.trim()) {
      errors.leaderWhatsapp = "WhatsApp do líder é obrigatório";
    } else if (!validatePhone(formData.leaderWhatsapp)) {
      errors.leaderWhatsapp = "WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)";
    }

    // Validar pessoa - Nome, WhatsApp e Observações obrigatórios
    if (!formData.personName.trim()) {
      errors.personName = "Nome da pessoa é obrigatório";
    } else if (!validateName(formData.personName)) {
      errors.personName = "Deve conter nome e sobrenome";
    }

    if (!formData.personWhatsapp.trim()) {
      errors.personWhatsapp = "WhatsApp da pessoa é obrigatório";
    } else if (!validatePhone(formData.personWhatsapp)) {
      errors.personWhatsapp = "WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)";
    }

    if (!formData.observation.trim()) {
      errors.observation = "Observações são obrigatórias";
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = await validateRequiredFields();
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
      // MODO DE EDIÇÃO
      if (editMode && personData) {
        const success = await updateSaudePerson(personData.id, {
          leader_name: formData.leaderName,
          leader_whatsapp: formData.leaderWhatsapp,
          leader_cep: formData.leaderCep || undefined,
          person_name: formData.personName,
          person_whatsapp: formData.personWhatsapp,
          person_cep: formData.personCep || undefined,
          observation: formData.observation,
        });

        if (!success) {
          throw new Error('Erro ao atualizar pessoa no banco de dados');
        }

        console.log('✅ Pessoa atualizada com sucesso');
        
        setIsSuccess(true);
        toast({
          title: "Alterações salvas com sucesso!",
          description: "Os dados da pessoa foram atualizados.",
        });
        
        // Voltar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } else {
        // MODO DE CADASTRO
        // Verificar se a pessoa já está cadastrada
        const personExists = await checkPersonExists(formData.personWhatsapp);
        
        if (personExists) {
          toast({
            title: "Pessoa já cadastrada",
            description: "Esta pessoa já está cadastrada no sistema com este WhatsApp.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Salvar no banco de dados (tabela saude_people)
        const newPerson = await addSaudePerson({
          leader_name: formData.leaderName,
          leader_whatsapp: formData.leaderWhatsapp,
          leader_cep: formData.leaderCep || undefined,
          person_name: formData.personName,
          person_whatsapp: formData.personWhatsapp,
          person_cep: formData.personCep || undefined,
          observation: formData.observation,
        });

        if (!newPerson) {
          throw new Error('Erro ao cadastrar pessoa no banco de dados');
        }

        console.log('✅ Pessoa cadastrada com sucesso:', newPerson);
        
        setIsSuccess(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "A pessoa foi cadastrada no sistema.",
        });
        
        // Limpar formulário após 3 segundos
        setTimeout(() => {
          setFormData({
            leaderName: "",
            leaderWhatsapp: "",
            leaderCep: "",
            personName: "",
            personWhatsapp: "",
            personCep: "",
            observation: ""
          });
          setIsSuccess(false);
        }, 3000);
      }

    } catch (error) {
      console.error(`❌ Erro ao ${editMode ? 'atualizar' : 'cadastrar'} pessoa:`, error);
      toast({
        title: editMode ? "Erro ao atualizar" : "Erro no cadastro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
        {/* Logo no topo */}
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>

        {/* Tela de Sucesso */}
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-institutional-blue mb-4">
              {editMode ? 'Alterações Salvas!' : 'Cadastro Realizado!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {editMode 
                ? 'Os dados da pessoa foram atualizados com sucesso no sistema.' 
                : 'A pessoa foi cadastrada com sucesso no sistema da área da saúde.'
              }
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold"
            >
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
          Cadastro de Pessoa - Área da Saúde
        </h1>
        <p className="text-gray-300">
          Preencha os dados abaixo para cadastrar uma nova pessoa
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        
        {/* SEÇÃO: Dados do Líder */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-4">Dados do Líder</h3>
          </div>

          {/* Campo Nome do Líder */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome Completo do Líder (ex: João Silva)"
                value={formData.leaderName}
                onChange={(e) => handleInputChange('leaderName', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.leaderName ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.leaderName && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.leaderName}</span>
              </div>
            )}
          </div>

          {/* Campo WhatsApp do Líder */}
          <div className="space-y-1">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="tel"
                placeholder="WhatsApp (62) 99999-9999"
                value={formData.leaderWhatsapp}
                onChange={(e) => handleInputChange('leaderWhatsapp', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.leaderWhatsapp ? 'border-red-500' : ''}`}
                maxLength={15}
                required
              />
            </div>
            {formErrors.leaderWhatsapp && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.leaderWhatsapp}</span>
              </div>
            )}
          </div>

          {/* Campo CEP do Líder (Opcional) */}
          <div className="space-y-1">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="CEP (12345-678) - Opcional"
                value={formData.leaderCep}
                onChange={(e) => handleInputChange('leaderCep', e.target.value)}
                onBlur={() => handleCepBlur('leaderCep')}
                className={`pl-12 pr-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.leaderCep ? 'border-red-500' : ''}`}
                maxLength={9}
                disabled={leaderCepLoading}
              />
              {leaderCepLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {formErrors.leaderCep && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.leaderCep}</span>
              </div>
            )}
          </div>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm font-medium">Dados da Pessoa</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* SEÇÃO: Dados da Pessoa */}
        <div className="space-y-4">
          {/* Campo Nome da Pessoa */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome Completo da Pessoa (ex: Maria Santos)"
                value={formData.personName}
                onChange={(e) => handleInputChange('personName', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.personName ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.personName && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.personName}</span>
              </div>
            )}
          </div>

          {/* Campo WhatsApp da Pessoa */}
          <div className="space-y-1">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="tel"
                placeholder="WhatsApp (62) 99999-9999"
                value={formData.personWhatsapp}
                onChange={(e) => handleInputChange('personWhatsapp', e.target.value)}
                className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.personWhatsapp ? 'border-red-500' : ''}`}
                maxLength={15}
                required
              />
            </div>
            {formErrors.personWhatsapp && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.personWhatsapp}</span>
              </div>
            )}
          </div>

          {/* Campo CEP da Pessoa (Opcional) */}
          <div className="space-y-1">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="CEP (12345-678) - Opcional"
                value={formData.personCep}
                onChange={(e) => handleInputChange('personCep', e.target.value)}
                onBlur={() => handleCepBlur('personCep')}
                className={`pl-12 pr-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.personCep ? 'border-red-500' : ''}`}
                maxLength={9}
                disabled={personCepLoading}
              />
              {personCepLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {formErrors.personCep && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.personCep}</span>
              </div>
            )}
          </div>

          {/* Campo Observação */}
          <div className="space-y-1">
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <Textarea
                placeholder="Observações"
                value={formData.observation}
                onChange={(e) => handleInputChange('observation', e.target.value)}
                className={`pl-12 pt-3 min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg resize-none ${formErrors.observation ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.observation && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.observation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão Cadastrar/Salvar */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-institutional-blue border-t-transparent rounded-full animate-spin" />
              {editMode ? 'Salvando...' : 'Cadastrando...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {editMode ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
