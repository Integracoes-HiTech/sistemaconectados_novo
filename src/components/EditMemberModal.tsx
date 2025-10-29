import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabaseServerless } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { buscarCep, validarFormatoCep, formatarCep, limparCep, CepData } from '@/services/cepService';
import { User, Phone, Instagram, MapPin, Building, Settings, Loader2 } from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: { id: string; name: string; [key: string]: unknown } | null;
  onSuccess: () => void;
}

export default function EditMemberModal({ isOpen, onClose, memberData, onSuccess }: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    instagram: '',
    cep: '',
    city: '',
    sector: '',
    referrer: '',
    couple_name: '',
    couple_phone: '',
    couple_instagram: '',
    couple_cep: '',
    couple_city: '',
    couple_sector: ''
  });
  const [referrerSuggestions, setReferrerSuggestions] = useState<Array<{ name: string; phone: string }>>([]);
  const [showReferrerSuggestions, setShowReferrerSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Função para aplicar máscara de nome (primeira letra maiúscula, resto minúsculo, primeira letra após espaço maiúscula)
  const formatName = (value: string) => {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Função para verificar se há mudanças nos dados
  const hasChanges = () => {
    const fields = ['name', 'phone', 'instagram', 'cep', 'city', 'sector', 'referrer', 'couple_name', 'couple_phone', 'couple_instagram', 'couple_cep', 'couple_city', 'couple_sector'];
    
    for (const field of fields) {
      if (formData[field as keyof typeof formData] !== originalData[field]) {
        return true;
      }
    }
    return false;
  };

  // Função para buscar referrers no banco - busca todos os membros pelo nome
  const searchReferrers = async (query: string) => {
    if (query.length < 2) {
      setReferrerSuggestions([]);
      setShowReferrerSuggestions(false);
      return;
    }

    try {
      // Buscar todos os membros ativos pelo nome (para permitir alterar o referrer)
      const { data, error } = await supabaseServerless
        .from('members')
        .select('name, phone')
        .ilike('name', `%${query}%`)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .neq('id', memberData?.id) // Excluir o próprio membro da lista
        .order('name', { ascending: true })
        .limit(50);

      if (!error && data) {
        // Remover duplicatas baseado no nome (case-insensitive)
        const uniqueReferrers = new Map<string, { name: string; phone: string }>();
        
        const membersArray = Array.isArray(data) ? data : (data ? [data] : []);
        membersArray.forEach((member: { name?: string; phone?: string }) => {
          if (member.name && member.name.trim() !== '') {
            const key = member.name.toLowerCase().trim();
            if (!uniqueReferrers.has(key)) {
              uniqueReferrers.set(key, {
                name: member.name.trim(),
                phone: member.phone || ''
              });
            }
          }
        });

        // Se o valor atual (referrer) não estiver nos resultados e corresponder à busca, adicionar
        const currentValue = formData.referrer.trim();
        if (currentValue && currentValue.toLowerCase().includes(query.toLowerCase())) {
          const key = currentValue.toLowerCase().trim();
          if (!uniqueReferrers.has(key)) {
            // Buscar telefone do referrer atual se disponível
            let currentPhone = '';
            try {
              const { data: currentMember } = await supabaseServerless
                .from('members')
                .select('phone')
                .eq('name', currentValue)
                .limit(1)
                .single();
              
              if (currentMember && typeof currentMember === 'object' && 'phone' in currentMember) {
                currentPhone = String(currentMember.phone || '');
              }
            } catch (e) {
              // Ignorar erro
            }
            
            uniqueReferrers.set(key, {
              name: currentValue,
              phone: currentPhone
            });
          }
        }

        setReferrerSuggestions(Array.from(uniqueReferrers.values()));
        setShowReferrerSuggestions(true);
      } else {
        setReferrerSuggestions([]);
        setShowReferrerSuggestions(false);
      }
    } catch (error) {
      setReferrerSuggestions([]);
      setShowReferrerSuggestions(false);
    }
  };

  // Função para validar todos os campos
  const validateAllFields = async () => {
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
      errors.phone = 'WhatsApp inválido';
    } else {
      // Verificar se telefone já existe em outro membro
      const phoneExists = await checkPhoneExists(formData.phone);
      if (phoneExists) {
        errors.phone = 'Este WhatsApp já está cadastrado no sistema';
      }
      
      // Verificar se telefone é igual ao do parceiro
      if (formData.couple_phone && formData.phone === formData.couple_phone) {
        errors.phone = 'O WhatsApp não pode ser igual ao do parceiro';
      }
    }

    if (!formData.instagram.trim()) {
      errors.instagram = 'Instagram é obrigatório';
    } else {
      const instagramError = validateInstagramBasic(formData.instagram);
      if (instagramError) {
        errors.instagram = instagramError;
      } else {
        // Verificar se Instagram já existe em outro membro
        const instagramExists = await checkInstagramExists(formData.instagram);
        if (instagramExists) {
          errors.instagram = 'Este Instagram já está cadastrado no sistema';
        }
        
        // Verificar se Instagram é igual ao do parceiro
        if (formData.couple_instagram && formData.instagram === formData.couple_instagram) {
          errors.instagram = 'O Instagram não pode ser igual ao do parceiro';
        }
      }
    }

    if (!formData.cep.trim()) {
      errors.cep = 'CEP é obrigatório';
    } else if (!validarFormatoCep(formData.cep)) {
      errors.cep = 'CEP inválido';
    }

    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }

    if (!formData.sector.trim()) {
      errors.sector = 'Bairro é obrigatório';
    }

    // Validação do parceiro
    if (!formData.couple_name.trim()) {
      errors.couple_name = 'Nome do parceiro é obrigatório';
    } else if (!validateName(formData.couple_name)) {
      errors.couple_name = 'Deve conter nome e sobrenome';
    }

    if (!formData.couple_phone.trim()) {
      errors.couple_phone = 'WhatsApp do parceiro é obrigatório';
    } else if (!validatePhone(formData.couple_phone)) {
      errors.couple_phone = 'WhatsApp do parceiro inválido';
    } else {
      // Verificar se telefone do parceiro já existe em outro membro
      const couplePhoneExists = await checkCouplePhoneExists(formData.couple_phone);
      if (couplePhoneExists) {
        errors.couple_phone = 'Este WhatsApp do parceiro já está cadastrado no sistema';
      }
      
      // Verificar se telefone do parceiro é igual ao principal
      if (formData.phone && formData.couple_phone === formData.phone) {
        errors.couple_phone = 'O WhatsApp do parceiro não pode ser igual ao principal';
      }
    }

    if (!formData.couple_instagram.trim()) {
      errors.couple_instagram = 'Instagram do parceiro é obrigatório';
    } else {
      const coupleInstagramError = validateInstagramBasic(formData.couple_instagram);
      if (coupleInstagramError) {
        errors.couple_instagram = coupleInstagramError;
      } else {
        // Verificar se Instagram do parceiro já existe em outro membro
        const coupleInstagramExists = await checkCoupleInstagramExists(formData.couple_instagram);
        if (coupleInstagramExists) {
          errors.couple_instagram = 'Este Instagram do parceiro já está cadastrado no sistema';
        }
        
        // Verificar se Instagram do parceiro é igual ao principal
        if (formData.instagram && formData.couple_instagram === formData.instagram) {
          errors.couple_instagram = 'O Instagram do parceiro não pode ser igual ao principal';
        }
      }
    }

    if (!formData.couple_cep.trim()) {
      errors.couple_cep = 'CEP do parceiro é obrigatório';
    } else if (!validarFormatoCep(formData.couple_cep)) {
      errors.couple_cep = 'CEP do parceiro inválido';
    }

    if (!formData.couple_city.trim()) {
      errors.couple_city = 'Cidade do parceiro é obrigatória';
    }

    if (!formData.couple_sector.trim()) {
      errors.couple_sector = 'Bairro do parceiro é obrigatório';
    }

    return errors;
  };

  useEffect(() => {
    if (memberData && isOpen) {
      const initialData = {
        name: String(memberData.name ?? ''),
        phone: String(memberData.phone ?? ''),
        instagram: String(memberData.instagram ?? ''),
        cep: String(memberData.cep ?? ''),
        city: String(memberData.city ?? ''),
        sector: String(memberData.sector ?? ''),
        referrer: String(memberData.referrer ?? ''),
        couple_name: String(memberData.couple_name ?? ''),
        couple_phone: String(memberData.couple_phone ?? ''),
        couple_instagram: String(memberData.couple_instagram ?? ''),
        couple_cep: String(memberData.couple_cep ?? ''),
        couple_city: String(memberData.couple_city ?? ''),
        couple_sector: String(memberData.couple_sector ?? '')
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setFormErrors({});
    }
  }, [memberData, isOpen]);

  // Funções de formatação
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
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

  // Funções de validação
  const validateName = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    return words.length >= 2;
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Bloquear telefones de exemplo
    if (cleanPhone === '62999999999' || cleanPhone === '6299999999') {
      return false;
    }
    
    // Aceitar telefones com 10 ou 11 dígitos
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      return false;
    }
    
    const ddd = parseInt(cleanPhone.substring(0, 2));
    const validDDDs = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];
    
    // Verificar se o DDD é válido
    return validDDDs.includes(ddd);
  };

  // Função para verificar se telefone já existe em outro membro
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('members')
        .select('id')
        .eq('phone', phone)
        .neq('id', memberData?.id) // Excluir o próprio membro
        .is('deleted_at', null);

      if (error) return false;
      return data && Array.isArray(data) && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Função para verificar se Instagram já existe em outro membro
  const checkInstagramExists = async (instagram: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('members')
        .select('id')
        .eq('instagram', instagram)
        .neq('id', memberData?.id) // Excluir o próprio membro
        .is('deleted_at', null);

      if (error) return false;
      return data && Array.isArray(data) && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Função para verificar se telefone do parceiro já existe em outro membro
  const checkCouplePhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('members')
        .select('id')
        .eq('couple_phone', phone)
        .neq('id', memberData?.id) // Excluir o próprio membro
        .is('deleted_at', null);

      if (error) return false;
      return data && Array.isArray(data) && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  // Função para verificar se Instagram do parceiro já existe em outro membro
  const checkCoupleInstagramExists = async (instagram: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('members')
        .select('id')
        .eq('couple_instagram', instagram)
        .neq('id', memberData?.id) // Excluir o próprio membro
        .is('deleted_at', null);

      if (error) return false;
      return data && Array.isArray(data) && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  const validateInstagramBasic = (instagram: string): string | null => {
    if (!instagram) return null;
    
    const instagramClean = instagram.replace('@', '').toLowerCase();
    
    // Lista de nomes genéricos/fake que devem ser bloqueados
    const blockedNames = [
      'insta', 'instagram', 'seminsta', 'ainstao', 'naotem', 'seminsta', 'seminstram', 'aaaaaaa', 
      'instanao', 'naotenhoinsta', 'nãotenhoinstragram', 'instanaotem', 'asdadd', 
      'aaaa', 'bbbbb', 'nao', 'tem', 'insta', 'sem', 'não', 'tenho', 'aaaaa', 
      'bbbb', 'cccc', 'dddd', 'eeee', 'ffff', 'gggg', 'hhhh', 'iiii', 'jjjj',
      'kkkk', 'llll', 'mmmm', 'nnnn', 'oooo', 'pppp', 'qqqq', 'rrrr', 'ssss',
      'tttt', 'uuuu', 'vvvv', 'wwww', 'xxxx', 'yyyy', 'zzzz', 'teste', 'test',
      'usuario', 'user', 'nome', 'name', 'exemplo', 'example', 'fake', 'falso',
      'naoteminsta', 'seminsta', 'seminstram', 'naotem', 'sem', 'não', 'tem'
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
    
    // Verificar se tem muitos números consecutivos (mais de 6 números seguidos)
    if (/\d{7,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitos números consecutivos.';
    }
    
    // Verificar se parece com número de telefone (padrões comuns)
    if (/^(\d{2,3})?\d{4,5}\d{4}$/.test(instagramClean) || 
        /^\d{10,11}$/.test(instagramClean) ||
        /^\(\d{2,3}\)\s?\d{4,5}-?\d{4}$/.test(instagramClean)) {
      return 'Instagram não pode ser um número de telefone.';
    }
    
    // Verificar se tem muitas letras iguais consecutivas (mais de 3)
    if (/([a-z])\1{3,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitas letras iguais consecutivas.';
    }
    
    // Verificar se é principalmente números (mais de 70% números)
    const numberCount = (instagramClean.match(/\d/g) || []).length;
    const totalLength = instagramClean.length;
    if (numberCount / totalLength > 0.7) {
      return 'Instagram deve ter mais letras que números.';
    }
    
    return null;
  };

  const handleCepSearch = async (cep: string, field: string) => {
    if (!validarFormatoCep(cep)) {
      setFormErrors(prev => ({
        ...prev,
        [field]: 'CEP inválido'
      }));
      return;
    }

    try {
      setIsCepLoading(true);
      const cepData = await buscarCep(cep);
      if (cepData) {
        if (field === 'cep') {
          setFormData(prev => ({
            ...prev,
            city: cepData.cidade,
            sector: cepData.bairro
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            couple_city: cepData.cidade,
            couple_sector: cepData.bairro
          }));
        }
        
        setFormErrors(prev => ({
          ...prev,
          [field]: ''
        }));
        
        toast({
          title: "CEP encontrado!",
          description: `Cidade: ${cepData.cidade}, Bairro: ${cepData.bairro}`,
          variant: "default",
        });
      } else {
        setFormErrors(prev => ({
          ...prev,
          [field]: 'CEP não encontrado'
        }));
      }
    } catch (error) {
      setFormErrors(prev => ({
        ...prev,
        [field]: 'Erro ao buscar CEP'
      }));
    } finally {
      setIsCepLoading(false);
    }
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

    // Buscar CEP automaticamente quando tiver 9 caracteres (formato 00000-000)
    if ((field === 'cep' || field === 'couple_cep') && value.length === 9) {
      handleCepSearch(value, field);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // 1. Verificar se há mudanças
      if (!hasChanges()) {
        toast({
          title: "Nenhuma alteração detectada",
          description: "Não há mudanças para salvar.",
          variant: "default",
        });
        return;
      }
      // 2. Validar todos os campos se há mudanças
      const validationErrors = await validateAllFields();
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros antes de salvar.",
          variant: "destructive",
        });
        return;
      }
      // 3. Buscar dados atuais do banco para comparação
      const { data: currentMember, error: fetchError } = await supabaseServerless
        .from('members')
        .select('*')
        .eq('id', memberData?.id)
        .single();

      if (fetchError) {
        toast({
          title: "Erro ao verificar dados",
          description: "Não foi possível verificar os dados atuais.",
          variant: "destructive",
        });
        return;
      }
        // 4. Comparar com dados do banco e preparar apenas campos alterados
        const fieldsToUpdate: Record<string, unknown> = {};
        const fields = ['name', 'phone', 'instagram', 'cep', 'city', 'sector', 'referrer', 'couple_name', 'couple_phone', 'couple_instagram', 'couple_cep', 'couple_city', 'couple_sector'];
        
        
        for (const field of fields) {
          const currentValue = String((currentMember as Record<string, unknown>)[field] || '');
          const newValue = formData[field as keyof typeof formData];
          
          if (currentValue !== newValue) {
            fieldsToUpdate[field] = newValue;
          }
        }

        // 4.1. Se o campo referrer foi alterado, buscar o ID do membro e setar null nos campos quemindicou e telefonequemindicou
        const referrerChanged = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'referrer');
        if (referrerChanged) {
          try {
            const newReferrerValue = String(fieldsToUpdate.referrer || '');
            
            // Buscar o ID do membro pelo nome
            const { data: referrerMember, error: referrerError } = await supabaseServerless
              .from('members')
              .select('id, name')
              .eq('name', newReferrerValue)
              .is('deleted_at', null)
              .single();

            if (!referrerError && referrerMember) {
              // Setar o referrer_member_id com o ID do membro encontrado
              fieldsToUpdate.referrer_member_id = (referrerMember as Record<string, unknown>).id;
            } else {
              // Se não encontrou o membro, setar null no referrer_member_id
              fieldsToUpdate.referrer_member_id = null;
            }
            
            // Sempre setar null nos campos quemindicou e telefonequemindicou quando referrer mudar
            fieldsToUpdate.quemindicou = null;
            fieldsToUpdate.telefonequemindicou = null;
          } catch (error) {
            // Em caso de erro, apenas setar null
            fieldsToUpdate.referrer_member_id = null;
            fieldsToUpdate.quemindicou = null;
            fieldsToUpdate.telefonequemindicou = null;
          }
        }

      // 5. Se não há campos para atualizar, não fazer nada
      if (Object.keys(fieldsToUpdate).length === 0) {
        toast({
          title: "Dados já estão atualizados",
          description: "Os dados no banco já estão iguais aos do formulário.",
          variant: "default",
        });
        return;
      }

      // 6. Atualizar apenas a tabela members
      
      const { data: membersResult, error: membersError } = await supabaseServerless
        .from('members')
        .update(fieldsToUpdate)
        .eq('id', memberData?.id)
        .select('*');

      if (membersError) {
        toast({
          title: "Erro ao salvar membro",
          description: "Não foi possível salvar as alterações no membro.",
          variant: "destructive",
        });
        return;
      }
      
      if (!membersResult || !Array.isArray(membersResult) || membersResult.length === 0) {
        toast({
          title: "Erro ao salvar membro",
          description: "Nenhum registro foi encontrado para atualizar.",
          variant: "destructive",
        });
        return;
      }

      // 7. Sucesso
      toast({
        title: "Alterações salvas!",
        description: `${Object.keys(fieldsToUpdate).length} campo(s) atualizado(s) na tabela members.`,
        variant: "default",
      });

      // 8. Atualizar dados originais e fechar modal
      setOriginalData(formData);
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar alterações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Editar {memberData?.is_friend ? 'Amigo' : 'Membro'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primeira Pessoa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-institutional-blue">Dados da Primeira Pessoa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', formatName(e.target.value))}
                    className={`pl-10 ${formErrors.name ? 'border-red-500' : ''}`}
                    placeholder="Nome completo"
                  />
                </div>
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className={`pl-10 ${formErrors.instagram ? 'border-red-500' : ''}`}
                    placeholder="@usuario"
                  />
                </div>
                {formErrors.instagram && <p className="text-red-500 text-sm">{formErrors.instagram}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {isCepLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', formatCep(e.target.value))}
                    onBlur={(e) => {
                      if (e.target.value.length === 9) {
                        handleCepSearch(e.target.value, 'cep');
                      }
                    }}
                    className={`pl-10 ${formErrors.cep ? 'border-red-500' : ''}`}
                    placeholder="00000-000"
                    disabled={isCepLoading}
                  />
                </div>
                {formErrors.cep && <p className="text-red-500 text-sm">{formErrors.cep}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="city"
                    value={formData.city}
                    readOnly
                    className="pl-10 bg-gray-50 cursor-not-allowed"
                    placeholder="Cidade (preenchida automaticamente pelo CEP)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referrer">Referrer (Quem indicou)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="referrer"
                    value={formData.referrer}
                    onChange={(e) => {
                      const value = formatName(e.target.value);
                      handleInputChange('referrer', value);
                      if (value.length >= 2) {
                        searchReferrers(value);
                      } else {
                        setShowReferrerSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (formData.referrer.length >= 2) {
                        searchReferrers(formData.referrer);
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clique na sugestão
                      setTimeout(() => setShowReferrerSuggestions(false), 200);
                    }}
                    className={`pl-10 ${formErrors.referrer ? 'border-red-500' : ''}`}
                    placeholder="Buscar membro cadastrado (digite pelo menos 2 letras)..."
                  />
                  {showReferrerSuggestions && referrerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                        Membros cadastrados ({referrerSuggestions.length})
                      </div>
                      {referrerSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleInputChange('referrer', suggestion.name);
                            setShowReferrerSuggestions(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{suggestion.name}</div>
                          {suggestion.phone && (
                            <div className="text-sm text-gray-500">{suggestion.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.referrer && <p className="text-red-500 text-sm">{formErrors.referrer}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Setor</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="sector"
                    value={formData.sector}
                    readOnly
                    className="pl-10 bg-gray-50 cursor-not-allowed"
                    placeholder="Setor (preenchido automaticamente pelo CEP)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Segunda Pessoa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-institutional-blue">Dados da Segunda Pessoa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couple_name">Nome do Parceiro</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="couple_name"
                    value={formData.couple_name}
                    onChange={(e) => handleInputChange('couple_name', formatName(e.target.value))}
                    className={`pl-10 ${formErrors.couple_name ? 'border-red-500' : ''}`}
                    placeholder="Nome completo do parceiro"
                  />
                </div>
                {formErrors.couple_name && <p className="text-red-500 text-sm">{formErrors.couple_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couple_phone">WhatsApp do Parceiro</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="couple_phone"
                    value={formData.couple_phone}
                    onChange={(e) => handleInputChange('couple_phone', formatPhone(e.target.value))}
                    className={`pl-10 ${formErrors.couple_phone ? 'border-red-500' : ''}`}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                {formErrors.couple_phone && <p className="text-red-500 text-sm">{formErrors.couple_phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couple_instagram">Instagram do Parceiro</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="couple_instagram"
                    value={formData.couple_instagram}
                    onChange={(e) => handleInputChange('couple_instagram', e.target.value)}
                    className={`pl-10 ${formErrors.couple_instagram ? 'border-red-500' : ''}`}
                    placeholder="@usuario"
                  />
                </div>
                {formErrors.couple_instagram && <p className="text-red-500 text-sm">{formErrors.couple_instagram}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couple_cep">CEP do Parceiro</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {isCepLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <Input
                    id="couple_cep"
                    value={formData.couple_cep}
                    onChange={(e) => handleInputChange('couple_cep', formatCep(e.target.value))}
                    onBlur={(e) => {
                      if (e.target.value.length === 9) {
                        handleCepSearch(e.target.value, 'couple_cep');
                      }
                    }}
                    className={`pl-10 ${formErrors.couple_cep ? 'border-red-500' : ''}`}
                    placeholder="00000-000"
                    disabled={isCepLoading}
                  />
                </div>
                {formErrors.couple_cep && <p className="text-red-500 text-sm">{formErrors.couple_cep}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="couple_city">Cidade do Parceiro</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="couple_city"
                    value={formData.couple_city}
                    readOnly
                    className="pl-10 bg-gray-50 cursor-not-allowed"
                    placeholder="Cidade (preenchida automaticamente pelo CEP)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="couple_sector">Setor do Parceiro</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="couple_sector"
                    value={formData.couple_sector}
                    readOnly
                    className="pl-10 bg-gray-50 cursor-not-allowed"
                    placeholder="Setor (preenchido automaticamente pelo CEP)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
