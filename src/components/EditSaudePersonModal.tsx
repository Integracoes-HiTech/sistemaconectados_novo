import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { buscarCep, validarFormatoCep } from "@/services/cepService";
import { useSaudePeople } from "@/hooks/useSaudePeople";
import type { SaudePerson } from "@/hooks/useSaudePeople";

interface EditSaudePersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: SaudePerson | null;
  onSuccess: () => void;
}

export default function EditSaudePersonModal({ isOpen, onClose, person, onSuccess }: EditSaudePersonModalProps) {
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
  const { updateSaudePerson } = useSaudePeople();

  // Carregar dados da pessoa no formulário
  useEffect(() => {
    if (person) {
      setFormData({
        liderNomeCompleto: person.lider_nome_completo || "",
        liderWhatsapp: person.lider_whatsapp || "",
        pessoaNomeCompleto: person.pessoa_nome_completo || "",
        pessoaWhatsapp: person.pessoa_whatsapp || "",
        cep: person.cep || "",
        cidade: person.cidade || "",
        observacoes: person.observacoes || ""
      });
    }
  }, [person]);

  // Funções de validação
  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    const words = name.trim().split(/\s+/);
    return nameRegex.test(name) && words.length >= 2 && words.every(word => word.length > 0);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 11) {
      return false;
    }
    
    const ddd = parseInt(cleanPhone.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return false;
    }
    
    const firstDigit = parseInt(cleanPhone.substring(2, 3));
    if (firstDigit !== 9) {
      return false;
    }
    
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

  const formatName = (value: string) => {
    const cleaned = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    
    return cleaned.split(' ').map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'liderWhatsapp' || field === 'pessoaWhatsapp') {
      processedValue = formatPhone(value);
    } else if (field === 'liderNomeCompleto' || field === 'pessoaNomeCompleto') {
      processedValue = formatName(value);
    } else if (field === 'cep') {
      processedValue = formatCep(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

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

    if (!formData.liderNomeCompleto.trim()) {
      errors.liderNomeCompleto = "Nome do líder é obrigatório";
    } else if (!validateName(formData.liderNomeCompleto)) {
      errors.liderNomeCompleto = "Digite nome e sobrenome completos";
    }

    if (!formData.liderWhatsapp) {
      errors.liderWhatsapp = "WhatsApp do líder é obrigatório";
    } else if (!validatePhone(formData.liderWhatsapp)) {
      errors.liderWhatsapp = "WhatsApp inválido";
    }

    if (!formData.pessoaNomeCompleto.trim()) {
      errors.pessoaNomeCompleto = "Nome da pessoa é obrigatório";
    } else if (!validateName(formData.pessoaNomeCompleto)) {
      errors.pessoaNomeCompleto = "Digite nome e sobrenome completos";
    }

    if (!formData.pessoaWhatsapp) {
      errors.pessoaWhatsapp = "WhatsApp da pessoa é obrigatório";
    } else if (!validatePhone(formData.pessoaWhatsapp)) {
      errors.pessoaWhatsapp = "WhatsApp inválido";
    }

    if (formData.cep && !validarFormatoCep(formData.cep)) {
      errors.cep = "CEP inválido";
    }

    if (!formData.observacoes.trim()) {
      errors.observacoes = "Observações são obrigatórias";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !person) {
      toast({
        title: "Campos inválidos",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await updateSaudePerson(person.id, {
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
        onSuccess();
        onClose();
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

  if (!person) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-institutional-blue">
            Editar Pessoa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Separador - Dados do Líder */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-600 text-sm font-medium">Dados do Líder</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Campo Nome do Líder */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome Completo do Líder"
                value={formData.liderNomeCompleto}
                onChange={(e) => handleInputChange('liderNomeCompleto', e.target.value)}
                className={`pl-12 h-12 ${formErrors.liderNomeCompleto ? 'border-red-500' : ''}`}
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
                className={`pl-12 h-12 ${formErrors.liderWhatsapp ? 'border-red-500' : ''}`}
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

          {/* Separador - Dados da Pessoa */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-600 text-sm font-medium">Dados da Pessoa</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Campo Nome da Pessoa */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Nome Completo da Pessoa"
                value={formData.pessoaNomeCompleto}
                onChange={(e) => handleInputChange('pessoaNomeCompleto', e.target.value)}
                className={`pl-12 h-12 ${formErrors.pessoaNomeCompleto ? 'border-red-500' : ''}`}
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
                className={`pl-12 h-12 ${formErrors.pessoaWhatsapp ? 'border-red-500' : ''}`}
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
                className={`pl-12 h-12 ${formErrors.cep ? 'border-red-500' : ''}`}
                maxLength={9}
              />
              {cepLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                className="pl-12 h-12 bg-gray-100 text-gray-500 cursor-not-allowed"
                disabled
              />
              {formData.cidade && (
                <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
          </div>

          {/* Campo Observações */}
          <div className="space-y-1">
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <Textarea
                placeholder="Observações sobre a pessoa..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                className={`pl-12 min-h-[100px] ${formErrors.observacoes ? 'border-red-500' : ''}`}
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

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue"
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

