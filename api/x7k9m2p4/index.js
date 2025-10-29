// api/x7k9m2p4/index.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { table, operation, data, filters, select, order, limit, offset, functionName, params } = req.body

    let result

    switch (operation) {
      case 'select':
        let query = supabase.from(table).select(select || '*')
        
        // Aplicar filtros
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
                  if (key.startsWith('not_')) {
                    // Tratar filtros .not()
                    const column = key.replace('not_', '')
                    if (typeof value === 'string' && value.includes('in,')) {
                      // Para valores como "in,(1,2,3)"
                      const match = value.match(/^in,\s*\(([^)]+)\)$/)
                      if (match) {
                        const ids = match[1].split(',').map(id => id.trim())
                        query = query.not(column, 'in', `(${ids.join(',')})`)
                      } else {
                        // Fallback para outros formatos
                        query = query.not(column, value)
                      }
                    } else {
                      query = query.not(column, value)
                    }
                  } else if (key.endsWith('_neq')) {
                    // Tratar filtros .neq()
                    const column = key.replace('_neq', '')
                    query = query.neq(column, value)
                  } else if (key.startsWith('ilike_')) {
                    // Tratar filtros .ilike()
                    const column = key.replace('ilike_', '')
                    query = query.ilike(column, value)
                  } else if (typeof value === 'object' && value.operator) {
              query = query[key](value.column, value.value)
            } else {
              query = query.eq(key, value)
            }
          })
        }
        
        // Aplicar ordenação
        if (order) {
          query = query.order(order.column, { ascending: order.ascending })
        }
        
        // Aplicar paginação
        if (limit) {
          query = query.limit(limit)
        }
        if (offset) {
          query = query.range(offset, offset + (limit || 10) - 1)
        }
        
        result = await query
        break

      case 'insert':
        console.log('📝 INSERT - Tabela:', table)
        console.log('📝 INSERT - Dados:', JSON.stringify(data, null, 2))
        console.log('📝 INSERT - Select:', select)
        
        if (select) {
          result = await supabase.from(table).insert(data).select(select)
        } else {
          result = await supabase.from(table).insert(data)
        }
        
        if (result.error) {
          console.error('❌ Erro no INSERT:', result.error)
        }
        break

      case 'update':
        if (filters) {
          // Check if we have _in filters
          const inFilters = Object.entries(filters).filter(([key]) => key.endsWith('_in'))
          
          if (inFilters.length > 0) {
            const results = []
            
            for (const [key, values] of inFilters) {
              const column = key.replace('_in', '')
              
              if (Array.isArray(values)) {
                for (const value of values) {
                  let updateQuery = supabase.from(table).update(data)
                  
                  // Add other non-_in filters
                  Object.entries(filters).forEach(([filterKey, filterValue]) => {
                    if (!filterKey.endsWith('_in')) {
                      updateQuery = updateQuery.eq(filterKey, filterValue)
                    }
                  })
                  
                  // Add the specific ID filter
                  updateQuery = updateQuery.eq(column, value)
                  
                  if (select) {
                    updateQuery = updateQuery.select(select)
                  }
                  
                  const result = await updateQuery
                  results.push(result)
                }
              }
            }
            
            // Return the last result (or combine them)
            result = results[results.length - 1] || { data: null, error: null }
            break
          }
        }
        
        // Original logic for non-_in filters
        let updateQuery = supabase.from(table).update(data)
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (!key.endsWith('_in')) {
              updateQuery = updateQuery.eq(key, value)
            }
          })
        }
        
        if (select) {
          updateQuery = updateQuery.select(select)
        }
        
        result = await updateQuery
        break

      case 'delete':
        let deleteQuery = supabase.from(table).delete()
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value)
          })
        }
        
        result = await deleteQuery
        break

      case 'auth':
        if (data.username && data.password) {
          // Buscar usuário por username e password
          result = await supabase
            .from('auth_users')
            .select('*')
            .eq('username', data.username)
            .eq('password', data.password)
            .single()
        } else {
          throw new Error('Username e password são obrigatórios para autenticação')
        }
        break

      case 'rpc':
        if (functionName) {
          result = await supabase.rpc(functionName, params || {})
        } else {
          throw new Error('Nome da função RPC é obrigatório')
        }
        break

      default:
        throw new Error(`Operação não suportada: ${operation}`)
    }

    if (result.error) {
      console.error('Erro do Supabase:', result.error)
      return res.status(400).json({ 
        success: false, 
        error: result.error.message || 'Erro na operação',
        details: result.error.details || result.error.message,
        hint: result.error.hint,
        code: result.error.code
      })
    }

    res.status(200).json({ 
      success: true, 
      data: result.data,
      count: result.count 
    })

  } catch (error) {
    console.error('Erro na API:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    })
  }
}
