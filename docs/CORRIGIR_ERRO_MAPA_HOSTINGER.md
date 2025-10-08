# 🗺️ CORRIGIR ERRO DO MAPA NA HOSTINGER

## ❌ ERRO ATUAL:
```
conectadosdigital.com.br recusou estabelecer ligação
```

---

## 🔍 DIAGNÓSTICO - Possíveis Causas:

### 1. **Pasta `mapas` não foi enviada para a Hostinger** ⭐ (MAIS PROVÁVEL)
   - A pasta `dist/mapas/` precisa estar no servidor
   - Caminho esperado: `public_html/mapas/mapa.html`

### 2. **Problema de CORS**
   - APIs externas bloqueadas (ViaCEP, Nominatim, OpenStreetMap)
   - Firewall ou configuração de segurança da Hostinger

### 3. **Erro no caminho do iframe**
   - O dashboard tenta acessar `/mapas/mapa.html`
   - Arquivo pode não estar no lugar correto

---

## ✅ SOLUÇÕES:

### **Solução 1: Enviar a pasta `mapas` para a Hostinger** (FAÇA PRIMEIRO)

1. **Via FTP/Gerenciador de Arquivos:**
   ```
   - Acesse o painel da Hostinger
   - Vá em "Gerenciador de Arquivos" ou conecte via FTP
   - Navegue até: public_html/
   - Crie uma pasta chamada "mapas" (se não existir)
   - Envie o arquivo: dist/mapas/mapa.html para public_html/mapas/
   ```

2. **Estrutura esperada:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   ├── mapas/           ← PRECISA EXISTIR
   │   └── mapa.html    ← ARQUIVO DO MAPA
   ├── lovable-uploads/
   └── ...
   ```

3. **Testar:**
   - Acesse diretamente: `https://conectadosdigital.com.br/mapas/mapa.html`
   - Se aparecer o mapa (ou mensagem de carregamento), está correto!

---

### **Solução 2: Verificar Build Local**

Antes de enviar para a Hostinger, garanta que o build está correto:

```bash
# 1. Limpar e rebuildar
npm run build

# 2. Verificar se a pasta mapas existe no dist
ls dist/mapas/

# 3. Deve mostrar: mapa.html
```

---

### **Solução 3: Adicionar arquivo `.htaccess` (se necessário)**

Se o problema for CORS, crie/edite `.htaccess` em `public_html/`:

```apache
# Permitir CORS para APIs externas
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Permitir iframe
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header set Content-Security-Policy "frame-ancestors 'self'"
</IfModule>
```

---

### **Solução 4: Verificar Supabase na Hostinger**

O erro pode ser conexão com Supabase:

1. **Teste manual:** Acesse `https://conectadosdigital.com.br/mapas/mapa.html`
2. **Abra o Console do navegador** (F12)
3. **Veja a mensagem de erro específica**
4. **Procure por:**
   - "Supabase não inicializado"
   - "Failed to fetch"
   - Erro de CORS

---

## 🔧 MELHORIAS IMPLEMENTADAS:

### **1. Mensagens de erro detalhadas**
Agora o mapa mostra mensagens específicas:
- ❌ Erro ao conectar com banco de dados
- ⚠️ Nenhum membro encontrado
- ⏳ Carregamento lento (timeout de 30s)

### **2. Validação de Supabase**
Verifica se o Supabase foi inicializado corretamente

### **3. Timeout de carregamento**
Avisa se o mapa demorar mais de 30 segundos

---

## 📋 CHECKLIST PARA RESOLVER:

- [ ] Fazer build: `npm run build`
- [ ] Verificar se `dist/mapas/mapa.html` existe
- [ ] Enviar pasta `mapas` para `public_html/mapas/` na Hostinger
- [ ] Testar acesso direto: `https://conectadosdigital.com.br/mapas/mapa.html`
- [ ] Verificar console do navegador (F12) para erro específico
- [ ] Se necessário, adicionar `.htaccess` com CORS
- [ ] Testar no dashboard da campanha B

---

## 🚨 ERRO MAIS COMUM:

**90% das vezes o problema é:**
> A pasta `mapas` não foi enviada para a Hostinger junto com o build

**SOLUÇÃO:**
> Envie manualmente a pasta `dist/mapas/` para `public_html/mapas/`

---

## 📞 SE O ERRO PERSISTIR:

1. Acesse `https://conectadosdigital.com.br/mapas/mapa.html` diretamente
2. Abra o Console (F12 → Console)
3. Copie a mensagem de erro completa
4. O erro vai mostrar exatamente qual é o problema:
   - Supabase?
   - ViaCEP?
   - Nominatim?
   - Arquivo não encontrado (404)?

---

## ✅ APÓS CORRIGIR:

Faça um commit das melhorias:

```bash
git add public/mapas/mapa.html dist/mapas/mapa.html
git commit -m "Melhorias no mapa: tratamento de erros e mensagens detalhadas"
git push origin main
```

Depois rebuild e reenvie para a Hostinger!

