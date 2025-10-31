// api/supabase/dev.js
// Servidor de desenvolvimento local para testar a API

import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3000

// Configurar CORS
app.use(cors({
  origin: 'https://conectadosdigital.com.br',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Suporte a requisições preflight (OPTIONS)
app.options('*', cors())

app.use(express.json())

// Configurar Supabase
const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Handle OPTIONS requests first
app.options('/api/x7k9m2p4', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://conectadosdigital.com.br');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

// Endpoint principal
app.post('/api/x7k9m2p4', async (req, res) => {
  try {
    const { table, operation, data, filters, select, order, limit, offset, functionName, params } = req.body

    let result

    switch (operation) {
            case 'select':
              let query = supabase.from(table).select(select || '*')
              
              if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                  try {
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
                  } else if (typeof value === 'object' && value !== null && value.operator) {
                    query = query[key](value.column, value.value)
                  } else if (value === null) {
                    query = query.is(key, null)
                  } else {
                    query = query.eq(key, value)
                  }
                  } catch (filterError) {
                    console.error(`Erro ao aplicar filtro ${key}:`, filterError)
                    // Continuar com outros filtros mesmo se um falhar
                  }
                })
              }
              
              // Handle OR conditions if present
              if (req.body.orFilters && Array.isArray(req.body.orFilters)) {
                req.body.orFilters.forEach(orCondition => {
                  Object.entries(orCondition).forEach(([key, value]) => {
                    query = query.or(`${key}.eq.${value}`)
                  })
                })
              }
        
        if (order) {
          query = query.order(order.column, { ascending: order.ascending })
        }
        
        if (limit) {
          query = query.limit(limit)
        }
        if (offset) {
          query = query.range(offset, offset + (limit || 10) - 1)
        }
        
        result = await query
        break

      case 'insert':
        if (select) {
          result = await supabase.from(table).insert(data).select(select)
        } else {
          result = await supabase.from(table).insert(data)
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
      return res.status(400).json({ 
        success: false, 
        error: 'Erro na operação',
        details: result.error.message 
      })
    }

    res.status(200).json({ 
      success: true, 
      data: result.data,
      count: result.count 
    })

  } catch (error) {
    console.error('Erro na API:', error)
    console.error('Request body:', JSON.stringify(req.body, null, 2))
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor de desenvolvimento rodando em http://localhost:${PORT}`)
  console.log(`📡 API disponível em http://localhost:${PORT}/api/x7k9m2p4`)
})
