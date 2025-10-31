// src/lib/k9m7x2.ts
// Cliente que usa API intermediária

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://igck04s844wc0gook4k8gksg.148.230.73.244.sslip.io/api/x7k9m2p4'

interface RequestParams {
  table?: string
  select?: string
  filters?: Record<string, unknown>
  order?: { column: string; ascending: boolean }
  limit?: number
  offset?: number
  data?: Record<string, unknown> | Record<string, unknown>[]
  functionName?: string
  params?: Record<string, unknown>
}

interface SupabaseResponse<T = unknown> {
  data: T | null
  error: Error | null
  count: number | null
}

class SupabaseServerlessClient {
  private async makeRequest<T = unknown>(operation: string, params: RequestParams): Promise<SupabaseResponse<T>> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          ...params
        })
      })

      const result = await response.json()

      if (!result.success) {
        // Incluir detalhes do erro se disponível
        const errorMessage = result.error || 'Erro na requisição'
        const errorDetails = result.details ? ` - Detalhes: ${result.details}` : ''
        const errorHint = result.hint ? ` - Dica: ${result.hint}` : ''
        throw new Error(`${errorMessage}${errorDetails}${errorHint}`)
      }

      return {
        data: result.data,
        error: null,
        count: result.count
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        count: null
      }
    }
  }

  // Método para fazer select
  async select<T = unknown>(table: string, options: {
    select?: string
    filters?: Record<string, unknown>
    order?: { column: string; ascending: boolean }
    limit?: number
    offset?: number
    orFilters?: Record<string, unknown>[]
  } = {}): Promise<SupabaseResponse<T>> {
    const result = await this.makeRequest<T>('select', {
      table,
      ...options
    })
    
    // Se há apenas um resultado e não foi especificado limit > 1, retornar como objeto único
    if (result.data && Array.isArray(result.data) && result.data.length === 1 && !options.limit) {
      return {
        ...result,
        data: result.data[0]
      }
    }
    
    return result
  }

  // Método para fazer insert
  async insert<T = unknown>(table: string, data: Record<string, unknown> | Record<string, unknown>[], select?: string): Promise<SupabaseResponse<T>> {
    return this.makeRequest('insert', {
      table,
      data,
      select
    })
  }

  // Método para fazer update
  async update<T = unknown>(table: string, data: Record<string, unknown>, filters: Record<string, unknown>, select?: string): Promise<SupabaseResponse<T>> {
    return this.makeRequest('update', {
      table,
      data,
      filters,
      select
    })
  }

  // Método para fazer delete
  async delete<T = unknown>(table: string, filters: Record<string, unknown>): Promise<SupabaseResponse<T>> {
    return this.makeRequest('delete', {
      table,
      filters
    })
  }

  // Método para chamar funções RPC
  async rpc<T = unknown>(functionName: string, params?: Record<string, unknown>): Promise<SupabaseResponse<T>> {
    return this.makeRequest('rpc', {
      functionName,
      params
    })
  }

  // Método para autenticação
  async auth<T = unknown>(username: string, password: string): Promise<SupabaseResponse<T>> {
    return this.makeRequest('auth', {
      table: 'auth_users',
      data: { username, password }
    })
  }

  // Método para buscar usuário por ID
  async getUserById(id: string): Promise<SupabaseResponse> {
    return this.select('auth_users', {
      filters: { id }
    })
  }

  // Método para buscar usuário por username
  async getUserByUsername(username: string): Promise<SupabaseResponse> {
    return this.select('auth_users', {
      filters: { username }
    })
  }

  // Método para buscar membros
  async getMembers(filters: Record<string, unknown> = {}): Promise<SupabaseResponse> {
    return this.select('members', {
      filters,
      order: { column: 'created_at', ascending: false }
    })
  }

  // Método para buscar amigos
  async getFriends(filters: Record<string, unknown> = {}): Promise<SupabaseResponse> {
    return this.select('friends', {
      filters,
      order: { column: 'created_at', ascending: false }
    })
  }

  // Método para buscar campanhas
  async getCampaigns(): Promise<SupabaseResponse> {
    return this.select('campaigns', {
      order: { column: 'created_at', ascending: false }
    })
  }

  // Método para buscar planos
  async getPlans(): Promise<SupabaseResponse> {
    return this.select('planos_precos', {
      filters: { is_active: true },
      order: { column: 'order_display', ascending: true }
    })
  }

  // Método para buscar links de usuário
  async getUserLinks(filters: Record<string, unknown> = {}): Promise<SupabaseResponse> {
    return this.select('user_links', {
      filters,
      order: { column: 'created_at', ascending: false }
    })
  }

  // Método para buscar pessoas do saúde
  async getSaudePeople(filters: Record<string, unknown> = {}): Promise<SupabaseResponse> {
    return this.select('saude_people', {
      filters,
      order: { column: 'created_at', ascending: false }
    })
  }

  // Interface compatível com Supabase original
  from(table: string) {
    const self = this // Capturar this da classe
    
    return {
      select: (columns: string) => {
        const filters: Record<string, unknown> = {}
        const orderBy: { column: string; ascending: boolean }[] = []
        const orFilters: Record<string, unknown>[] = []
        let limitCount: number | undefined
        let offsetStart: number | undefined
        
        const queryBuilder: {
          eq: (column: string, value: unknown) => typeof queryBuilder
          neq: (column: string, value: unknown) => typeof queryBuilder
          is: (column: string, value: unknown) => typeof queryBuilder
          or: (condition: string) => typeof queryBuilder
          not: (column: string, value: unknown) => typeof queryBuilder
          ilike: (column: string, value: unknown) => typeof queryBuilder
          order: (column: string, options?: { ascending: boolean }) => typeof queryBuilder
          limit: (count: number) => typeof queryBuilder
          range: (start: number, end: number) => typeof queryBuilder
          single: () => Promise<SupabaseResponse>
          then: (callback: (result: SupabaseResponse) => void) => Promise<SupabaseResponse>
        } = {
          eq: (column: string, value: unknown) => {
            filters[column] = value
            return queryBuilder
          },
          
          neq: (column: string, value: unknown) => {
            filters[`${column}_neq`] = value
            return queryBuilder
          },
          
          is: (column: string, value: unknown) => {
            if (value === null) {
              filters[column] = null
            } else {
              filters[column] = value
            }
            return queryBuilder
          },
          
          or: (condition: string) => {
            // Parse OR conditions like "campaign.eq.A,campaign.eq.B"
            const conditions = condition.split(',')
            const orCondition: Record<string, unknown> = {}
            
            conditions.forEach(cond => {
              const [col, op, val] = cond.split('.')
              if (op === 'eq') {
                orCondition[col] = val
              }
            })
            
            orFilters.push(orCondition)
            return queryBuilder
          },
          
          not: (column: string, value: unknown) => {
            // Para o método .not(), vamos usar uma abordagem diferente
            // Armazenar como filtro especial que será tratado na API
            if (typeof value === 'string' && value.includes('in')) {
              // Para casos como .not('user_id', 'in', '(1,2,3)')
              filters[`not_${column}`] = `in,${value}`
            } else {
              filters[`not_${column}`] = value
            }
            return queryBuilder
          },
          
          ilike: (column: string, value: unknown) => {
            // Para o método .ilike(), vamos usar uma abordagem diferente
            // Armazenar como filtro especial que será tratado na API
            filters[`ilike_${column}`] = value
            return queryBuilder
          },
          
          order: (column: string, options?: { ascending: boolean }) => {
            orderBy.push({ column, ascending: options?.ascending ?? true })
            return queryBuilder
          },
          
          limit: (count: number) => {
            limitCount = count
            return queryBuilder
          },
          
          range: (start: number, end: number) => {
            offsetStart = start
            limitCount = end - start + 1
            return queryBuilder
          },
          
          single: async (): Promise<SupabaseResponse> => {
            const result = await self.select(table, {
              select: columns,
              filters,
              order: orderBy[0], // Use first order if any
              limit: 1
            })
            
            // Para .single(), sempre retornar o primeiro item como objeto único
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              return {
                ...result,
                data: result.data[0]
              }
            }
            
            return result
          },
          
          then: async (callback: (result: SupabaseResponse) => void): Promise<SupabaseResponse> => {
            const result = await self.select(table, {
              select: columns,
              filters,
              order: orderBy[0],
              limit: limitCount,
              offset: offsetStart,
              orFilters: orFilters.length > 0 ? orFilters : undefined
            })
            
            callback(result)
            return result
          }
        }
        
        return queryBuilder
      },
      insert: (data: Record<string, unknown> | Record<string, unknown>[]) => ({
        select: (columns?: string) => ({
          single: async (): Promise<SupabaseResponse> => {
            const result = await self.insert(table, data, columns || '*')
            // Para .single() após insert, retornar o primeiro item como objeto único
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
              return {
                ...result,
                data: result.data[0]
              }
            }
            return result
          },
          then: async (callback: (result: SupabaseResponse) => void): Promise<SupabaseResponse> => {
            const result = await self.insert(table, data, columns || '*')
            callback(result)
            return result
          }
        }),
        then: async (callback: (result: SupabaseResponse) => void): Promise<SupabaseResponse> => {
          const result = await self.insert(table, data)
          callback(result)
          return result
        }
      }),
      update: (data: Record<string, unknown>) => ({
        eq: (column: string, value: unknown) => {
          const filters: Record<string, unknown> = {}
          filters[column] = value
          
          return {
            select: (columns: string) => ({
              single: async (): Promise<SupabaseResponse> => {
                return self.update(table, data, filters, columns)
              },
              then: async (callback: (result: SupabaseResponse) => void): Promise<SupabaseResponse> => {
                const result = await self.update(table, data, filters, columns)
                callback(result)
                return result
              }
            })
          }
        },
        in: (column: string, values: unknown[]) => ({
          select: async (columns: string): Promise<SupabaseResponse> => {
            const filters: Record<string, unknown> = {}
            filters[`${column}_in`] = values
            
            return self.update(table, data, filters, columns)
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => ({
          select: (columns: string) => ({
            single: async (): Promise<SupabaseResponse> => {
              const filters: Record<string, unknown> = {}
              filters[column] = value
              
              return self.delete(table, filters)
            }
          })
        })
      })
    }
  }
}

// Exportar instância única
export const supabaseServerless = new SupabaseServerlessClient()

// Manter compatibilidade com o cliente original
export const supabase = supabaseServerless
