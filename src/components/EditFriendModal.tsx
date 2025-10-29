import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabaseServerless } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { buscarCep, validarFormatoCep } from '@/services/cepService';
import { User, Phone, Instagram, MapPin, Building, Settings } from 'lucide-react';

interface EditFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendData: { id: string; name: string; [key: string]: unknown } | null;
  onSuccess: () => void;
}

export default function EditFriendModal({ isOpen, onClose, friendData, onSuccess }: EditFriendModalProps) {
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

  const formatName = (value: string) => {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasChanges = () => {
    const fields = ['name', 'phone', 'instagram', 'cep', 'city', 'sector', 'referrer', 'couple_name', 'couple_phone', 'couple_instagram', 'couple_cep', 'couple_city', 'couple_sector'];
    
    for (const field of fields) {
      if (formData[field as keyof typeof formData] !== originalData[field]) {
        return true;
      }
    }
    return false;
  };

  const searchReferrers = async (query: string) => {
    if (query.length < 2) {
      setReferrerSuggestions([]);
      setShowReferrerSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabaseServerless
        .from('members')
        .select('name, phone')
        .ilike('name', `%${query}%`)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .eq('is_friend', false)
        .order('name', { ascending: true })
        .limit(50);

      if (!error && data) {
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

  const validateAllFields = async () => {
    const errors: Record<string, string> = {};

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
      const phoneExists = await checkPhoneExists(formData.phone);
      if (phoneExists) {
        errors.phone = 'Este WhatsApp já está cadastrado no sistema';
      }
    }

    if (!formData.instagram.trim()) {
      errors.instagram = 'Instagram é obrigatório';
    } else {
      const instagramError = validateInstagramBasic(formData.instagram);
      if (instagramError) {
        errors.instagram = instagramError;
      } else {
        const instagramExists = await checkInstagramExists(formData.instagram);
        if (instagramExists) {
          errors.instagram = 'Este Instagram já está cadastrado no sistema';
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

    if (!formData.couple_name.trim()) {
      errors.couple_name = 'Nome do parceiro é obrigatório';
    } else if (!validateName(formData.couple_name)) {
      errors.couple_name = 'Deve conter nome e sobrenome';
    }

    if (!formData.couple_phone.trim()) {
      errors.couple_phone = 'WhatsApp do parceiro é obrigatório';
    } else if (!validatePhone(formData.couple_phone)) {
      errors.couple_phone = 'WhatsApp do parceiro inválido';
    }

    if (!formData.couple_instagram.trim()) {
      errors.couple_instagram = 'Instagram do parceiro é obrigatório';
    } else {
      const coupleInstagramError = validateInstagramBasic(formData.couple_instagram);
      if (coupleInstagramError) {
        errors.couple_instagram = coupleInstagramError;
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
    if (friendData && isOpen) {
      const initialData = {
        name: String(friendData.name ?? ''),
        phone: String(friendData.phone ?? ''),
        instagram: String(friendData.instagram ?? ''),
        cep: String(friendData.cep ?? ''),
        city: String(friendData.city ?? ''),
        sector: String(friendData.sector ?? ''),
        referrer: String(friendData.referrer ?? ''),
        couple_name: String(friendData.couple_name ?? ''),
        couple_phone: String(friendData.couple_phone ?? ''),
        couple_instagram: String(friendData.couple_instagram ?? ''),
        couple_cep: String(friendData.couple_cep ?? ''),
        couple_city: String(friendData.couple_city ?? ''),
        couple_sector: String(friendData.couple_sector ?? '')
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setFormErrors({});
    }
  }, [friendData, isOpen]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
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

  const validateName = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    return words.length >= 2;
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone === '62999999999' || cleanPhone === '6299999999') {
      return false;
    }
    
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      return false;
    }
    
    const ddd = parseInt(cleanPhone.substring(0, 2));
    const validDDDs = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];
    
    return validDDDs.includes(ddd);
  };

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('friends')
        .select('id')
        .eq('phone', phone)
        .neq('id', friendData?.id)
        .is('deleted_at', null);

      if (error) return false;
      return data && Array.isArray(data) && data.length > 0;
    } catch (error) {
      return false;
    }
  };

  const checkInstagramExists = async (instagram: string): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerless
        .from('friends')
        .select('id')
        .eq('instagram', instagram)
        .neq('id', friendData?.id)
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
    
    if (blockedNames.includes(instagramClean)) {
      return 'Por favor, insira um Instagram válido e real.';
    }
    
    if (instagramClean.length < 3) {
      return 'Instagram deve ter pelo menos 3 caracteres.';
    }
    
    if (/^\d+$/.test(instagramClean)) {
      return 'Instagram deve conter letras.';
    }
    
    if (/(.)\1{4,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitos caracteres repetidos.';
    }
    
    if (/\d{7,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitos números consecutivos.';
    }
    
    if (/^(\d{2,3})?\d{4,5}\d{4}$/.test(instagramClean) || 
        /^\d{10,11}$/.test(instagramClean) ||
        /^\(\d{2,3}\)\s?\d{4,5}-?\d{4}$/.test(instagramClean)) {
      return 'Instagram não pode ser um número de telefone.';
    }
    
    if (/([a-z])\1{3,}/.test(instagramClean)) {
      return 'Instagram não pode ter muitas letras iguais consecutivas.';
    }
    
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

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if ((field === 'cep' || field === 'couple_cep') && value.length === 9) {
      handleCepSearch(value, field);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!hasChanges()) {
        toast({
          title: "Nenhuma alteração detectada",
          description: "Não há mudanças para salvar.",
          variant: "default",
        });
        return;
      }

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

      const { data: currentFriend, error: fetchError } = await supabaseServerless
        .from('friends')
        .select('*')
        .eq('id', friendData?.id)
        .single();

      if (fetchError) {
        toast({
          title: "Erro ao verificar dados",
          description: "Não foi possível verificar os dados atuais.",
          variant: "destructive",
        });
        return;
      }

      const fieldsToUpdate: Record<string, unknown> = {};
      const fields = ['name', 'phone', 'instagram', 'cep', 'city', 'sector', 'referrer', 'couple_name', 'couple_phone', 'couple_instagram', 'couple_cep', 'couple_city', 'couple_sector'];
      
      for (const field of fields) {
        const currentValue = String((currentFriend as Record<string, unknown>)[field] || '');
        const newValue = formData[field as keyof typeof formData];
        
        if (currentValue !== newValue) {
          fieldsToUpdate[field] = newValue;
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        toast({
          title: "Dados já estão atualizados",
          description: "Os dados no banco já estão iguais aos do formulário.",
          variant: "default",
        });
        return;
      }

      const { data: friendsResult, error: friendsError } = await supabaseServerless
        .from('friends')
        .update(fieldsToUpdate)
        .eq('id', friendData?.id)
        .select('*');

      if (friendsError) {
        toast({
          title: "Erro ao salvar amigo",
          description: "Não foi possível salvar as alterações no amigo.",
          variant: "destructive",
        });
        return;
      }
      
      if (!friendsResult || !Array.isArray(friendsResult) || friendsResult.length === 0) {
        toast({
          title: "Erro ao salvar amigo",
          description: "Nenhum registro foi encontrado para atualizar.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Alterações salvas!",
        description: `${Object.keys(fieldsToUpdate).length} campo(s) atualizado(s) na tabela friends.`,
        variant: "default",
      });

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
            Editar Amigo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

