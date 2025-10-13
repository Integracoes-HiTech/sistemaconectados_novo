// =====================================================
// SERVIÇO: BUSCA DE CEP COM FALLBACK DE MÚLTIPLAS APIS
// =====================================================
// Este serviço busca informações de endereço através do CEP
// usando 3 APIs com sistema de fallback automático:
// 1. ViaCEP (prioridade)
// 2. BrasilAPI (fallback 1)
// 3. OpenCEP (fallback 2)
// =====================================================

export interface CepData {
  cidade: string;
  bairro: string;
  logradouro?: string;
  uf?: string;
  cep?: string;
}

export interface CepError {
  message: string;
  code?: string;
}

/**
 * Busca CEP via ViaCEP (API principal)
 */
async function buscarViaCep(cepLimpo: string): Promise<CepData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    if (!data.localidade || !data.bairro) {
      throw new Error("Dados incompletos retornados pelo ViaCEP");
    }

    return {
      cidade: data.localidade.trim(),
      bairro: data.bairro.trim(),
      logradouro: data.logradouro?.trim() || '',
      uf: data.uf?.trim() || '',
      cep: data.cep?.trim() || cepLimpo
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Busca CEP via BrasilAPI (Fallback 1)
 */
async function buscarBrasilApi(cepLimpo: string): Promise<CepData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.city || !data.neighborhood) {
      throw new Error("Dados incompletos retornados pela BrasilAPI");
    }

    // Converter formato BrasilAPI para CepData
    return {
      cidade: data.city.trim(),
      bairro: data.neighborhood.trim(),
      logradouro: data.street?.trim() || '',
      uf: data.state?.trim() || '',
      cep: data.cep?.trim() || cepLimpo
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Busca CEP via OpenCEP (Fallback 2)
 */
async function buscarOpenCep(cepLimpo: string): Promise<CepData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`https://opencep.com/v1/${cepLimpo}.json`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.localidade || !data.bairro) {
      throw new Error("Dados incompletos retornados pela OpenCEP");
    }

    return {
      cidade: data.localidade.trim(),
      bairro: data.bairro.trim(),
      logradouro: data.logradouro?.trim() || '',
      uf: data.uf?.trim() || '',
      cep: data.cep?.trim() || cepLimpo
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Busca informações de endereço através do CEP com fallback de múltiplas APIs
 * @param cep - CEP a ser consultado (com ou sem formatação)
 * @returns Promise com dados do endereço ou erro
 */
export async function buscarCep(cep: string): Promise<CepData> {
  try {
    // Remove traços, espaços e caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, "");

    // Validação: CEP precisa ter 8 dígitos numéricos
    if (!/^[0-9]{8}$/.test(cepLimpo)) {
      throw new Error("Por favor, informe um CEP válido com 8 dígitos.");
    }

    // PRIORIDADE 1: Tentar ViaCEP
    try {
      return await buscarViaCep(cepLimpo);
    } catch (viaCepError) {
      // FALLBACK 1: Tentar BrasilAPI
      try {
        return await buscarBrasilApi(cepLimpo);
      } catch (brasilApiError) {
        // FALLBACK 2: Tentar OpenCEP
        try {
          return await buscarOpenCep(cepLimpo);
        } catch (openCepError) {
          throw new Error("CEP não encontrado Verifique o CEP informado.");
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("Erro inesperado ao consultar CEP");
  }
}

/**
 * Valida formato do CEP
 * @param cep - CEP a ser validado
 * @returns true se válido, false caso contrário
 */
export function validarFormatoCep(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, "");
  return /^[0-9]{8}$/.test(cepLimpo);
}

/**
 * Formata CEP para exibição (00000-000)
 * @param cep - CEP a ser formatado
 * @returns CEP formatado
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, "");
  
  if (cepLimpo.length === 8) {
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }
  
  return cepLimpo;
}

/**
 * Remove formatação do CEP (apenas números)
 * @param cep - CEP formatado
 * @returns CEP apenas com números
 */
export function limparCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Hook para busca de CEP com loading e error states
 * @returns Objeto com função de busca, loading e error
 */
export function useCepSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCepComLoading = async (cep: string): Promise<CepData | null> => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await buscarCep(cep);
      return resultado;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar CEP";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    buscarCep: buscarCepComLoading,
    loading,
    error,
    clearError: () => setError(null)
  };
}

// Import necessário para o hook
import { useState } from 'react';
