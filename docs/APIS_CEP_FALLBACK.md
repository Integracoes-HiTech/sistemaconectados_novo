# 🌐 Sistema de APIs de CEP com Fallback

## 📋 Visão Geral

O mapa interativo agora usa **3 APIs de CEP** com sistema de fallback automático para garantir alta disponibilidade e resiliência.

---

## 🎯 Prioridade de APIs

### **1️⃣ ViaCEP** (Prioridade Principal)
- **URL:** `https://viacep.com.br/ws/{cep}/json/`
- **Timeout:** 5 segundos
- **Motivo:** API mais completa e confiável do Brasil
- **Formato de Resposta:**
  ```json
  {
    "cep": "01310-100",
    "logradouro": "Avenida Paulista",
    "complemento": "",
    "bairro": "Bela Vista",
    "localidade": "São Paulo",
    "uf": "SP",
    "erro": false
  }
  ```

### **2️⃣ BrasilAPI** (Fallback 1)
- **URL:** `https://brasilapi.com.br/api/cep/v2/{cep}`
- **Timeout:** 5 segundos
- **Ativa quando:** ViaCEP falhar ou retornar erro
- **Formato de Resposta:**
  ```json
  {
    "cep": "01310-100",
    "street": "Avenida Paulista",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  }
  ```
- **Conversão:** Campos são convertidos para o formato ViaCEP

### **3️⃣ OpenCEP** (Fallback 2)
- **URL:** `https://opencep.com/v1/{cep}.json`
- **Timeout:** 5 segundos
- **Ativa quando:** ViaCEP E BrasilAPI falharem
- **Formato de Resposta:**
  ```json
  {
    "cep": "01310-100",
    "logradouro": "Avenida Paulista",
    "complemento": "",
    "bairro": "Bela Vista",
    "localidade": "São Paulo",
    "uf": "SP"
  }
  ```

---

## 🔄 Fluxo de Fallback

```
┌─────────────┐
│  ViaCEP     │ ← Tentativa 1 (5s timeout)
└─────────────┘
       ↓ (se falhar)
┌─────────────┐
│ BrasilAPI   │ ← Tentativa 2 (5s timeout)
└─────────────┘
       ↓ (se falhar)
┌─────────────┐
│  OpenCEP    │ ← Tentativa 3 (5s timeout)
└─────────────┘
       ↓ (se falhar)
┌─────────────┐
│ Retorna NULL│ ← Membro não aparece no mapa
└─────────────┘
```

---

## 📊 Vantagens do Sistema

### ✅ **Alta Disponibilidade**
- Se uma API cair, o sistema automaticamente usa a próxima
- Reduz drasticamente a chance de falha total

### ✅ **Performance**
- Timeout de 5 segundos em cada API
- Máximo de 15 segundos para tentar todas as APIs
- Logs detalhados no console para debug

### ✅ **Compatibilidade**
- Todas as APIs são convertidas para o formato ViaCEP
- O resto do código não precisa ser alterado

### ✅ **Logs Informativos**
- `⚠️ ViaCEP falhou...` → Indica falha e próxima tentativa
- `✅ BrasilAPI encontrou CEP` → Indica sucesso no fallback
- `❌ Todas as APIs falharam` → Indica falha total

---

## 🛡️ Content Security Policy (CSP)

As seguintes URLs foram adicionadas ao CSP do `mapa.html`:

```html
default-src: https://brasilapi.com.br https://opencep.com
connect-src: https://brasilapi.com.br https://opencep.com
```

---

## 🧪 Como Testar

### **Teste 1: ViaCEP funcionando**
1. Abra o mapa
2. Verifique o console
3. Deve mostrar: Nenhum log de fallback (ViaCEP funcionou)

### **Teste 2: Forçar fallback para BrasilAPI**
1. Bloqueia `viacep.com.br` no navegador (DevTools → Network → Block)
2. Recarregue o mapa
3. Deve mostrar: `⚠️ ViaCEP falhou...` e `✅ BrasilAPI encontrou CEP`

### **Teste 3: Forçar fallback para OpenCEP**
1. Bloqueie `viacep.com.br` E `brasilapi.com.br`
2. Recarregue o mapa
3. Deve mostrar: `⚠️ ViaCEP falhou...`, `⚠️ BrasilAPI falhou...` e `✅ OpenCEP encontrou CEP`

### **Teste 4: Simular falha total**
1. Bloqueie todas as 3 APIs
2. Recarregue o mapa
3. Deve mostrar: `❌ Todas as APIs falharam para CEP [número]`

---

## 📈 Estatísticas Esperadas

Com 3 APIs de CEP:
- **Disponibilidade individual:** ~99.5% (cada API)
- **Disponibilidade combinada:** ~99.9999% (sistema com fallback)
- **Chance de todas falharem simultaneamente:** ~0.0001%

---

## 🔧 Manutenção

### Adicionar nova API de fallback:
1. Adicione a URL no CSP (`meta` tag no `<head>`)
2. Adicione um novo bloco `try/catch` após o OpenCEP
3. Converta a resposta para o formato ViaCEP
4. Adicione logs apropriados

### Alterar prioridade das APIs:
Reorganize a ordem dos blocos `try/catch` conforme desejado.

### Ajustar timeout:
Modifique o valor em `AbortSignal.timeout(5000)` (em milissegundos)

---

## 📚 Referências

- **ViaCEP:** https://viacep.com.br/
- **BrasilAPI:** https://brasilapi.com.br/docs/cep
- **OpenCEP:** https://opencep.com/

---

**Última atualização:** 13/10/2025
**Desenvolvido para:** Sistema CONECTADOS - Mapa Interativo

