import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, FileText, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { buscarCep, validarFormatoCep } from "@/services/cepService";
import { useSaudePeople } from "@/hooks/useSaudePeople";
import type { SaudePerson } from "@/hooks/useSaudePeople";

export default function PublicRegisterSaude() {
  const navigate = useNavigate();
  const location = useLocation();
  const { editMode, personData } = (location.state as { editMode?: boolean; personData?: SaudePerson }) || {};
  
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const { toast } = useToast();
  const { addSaudePerson, checkPersonExists, updateSaudePerson } = useSaudePeople();

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
      
      if (resultado.erro) {
        setFormErrors(prev => ({ ...prev, cep: "CEP não encontrado" }));
        setFormData(prev => ({ ...prev, cidade: "" }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          cidade: `${resultado.localidade} - ${resultado.uf}` 
        }));
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.cep;
          return newErrors;
        });
      }
    } catch (error) {
      setFormErrors(prev => ({ ...prev, cep: "Erro ao buscar CEP" }));
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
      errors.liderWhatsapp = "WhatsApp inválido (deve ter 11 dígitos)";
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
      errors.pessoaWhatsapp = "WhatsApp inválido (deve ter 11 dígitos)";
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
        });

        setIsSuccess(true);
        
        toast({
          title: "✅ Pessoa cadastrada!",
          description: "A pessoa foi cadastrada com sucesso na campanha de saúde.",
        });

        // Limpar formulário
        setFormData({
          liderNomeCompleto: "",
          liderWhatsapp: "",
          pessoaNomeCompleto: "",
          pessoaWhatsapp: "",
          cep: "",
          cidade: "",
          observacoes: ""
        });

        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header com Logo */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Logo />
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-6">
            <h1 className="text-3xl font-bold text-white">
              {editMode ? "Editar Pessoa" : "Cadastrar Nova Pessoa"}
            </h1>
            <p className="text-white/90 mt-2">
              Campanha Saúde - Sistema Conectados
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Seção: Dados do Líder */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Líder
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo do Líder *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Digite o nome completo"
                      value={formData.liderNomeCompleto}
                      onChange={(e) => handleInputChange("liderNomeCompleto", e.target.value)}
                      className={`pl-10 ${formErrors.liderNomeCompleto ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.liderNomeCompleto && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.liderNomeCompleto}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp do Líder *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.liderWhatsapp}
                      onChange={(e) => handleInputChange("liderWhatsapp", e.target.value)}
                      className={`pl-10 ${formErrors.liderWhatsapp ? 'border-red-500' : ''}`}
                      maxLength={15}
                    />
                  </div>
                  {formErrors.liderWhatsapp && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.liderWhatsapp}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção: Dados da Pessoa */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-secondary" />
                Dados da Pessoa
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo da Pessoa *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Digite o nome completo"
                      value={formData.pessoaNomeCompleto}
                      onChange={(e) => handleInputChange("pessoaNomeCompleto", e.target.value)}
                      className={`pl-10 ${formErrors.pessoaNomeCompleto ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.pessoaNomeCompleto && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.pessoaNomeCompleto}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp da Pessoa *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={formData.pessoaWhatsapp}
                      onChange={(e) => handleInputChange("pessoaWhatsapp", e.target.value)}
                      className={`pl-10 ${formErrors.pessoaWhatsapp ? 'border-red-500' : ''}`}
                      maxLength={15}
                    />
                  </div>
                  {formErrors.pessoaWhatsapp && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.pessoaWhatsapp}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP (Opcional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={(e) => handleInputChange("cep", e.target.value)}
                        onBlur={handleCepBlur}
                        className={`pl-10 ${formErrors.cep ? 'border-red-500' : ''}`}
                        maxLength={9}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {formErrors.cep && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {formErrors.cep}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade (Preenchido automaticamente)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Será preenchido pelo CEP"
                        value={formData.cidade}
                        disabled
                        className="pl-10 bg-gray-50 cursor-not-allowed"
                      />
                      {formData.cidade && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Textarea
                      placeholder="Digite suas observações..."
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      className={`pl-10 min-h-[100px] ${formErrors.observacoes ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors.observacoes && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.observacoes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {editMode ? "Atualizando..." : "Cadastrando..."}
                  </div>
                ) : (
                  editMode ? "Atualizar Pessoa" : "Cadastrar Pessoa"
                )}
              </Button>
            </div>

            {/* Mensagem de sucesso */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Cadastro realizado com sucesso!</p>
                  <p className="text-sm text-green-700">A pessoa foi adicionada à campanha de saúde.</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
