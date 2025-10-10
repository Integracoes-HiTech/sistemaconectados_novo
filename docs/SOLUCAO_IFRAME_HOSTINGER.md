# 🎯 SOLUÇÃO: Mapa abre sozinho mas quebra no Dashboard

## ✅ SITUAÇÃO ATUAL:
- ✅ `https://conectadosdigital.com.br/mapas/mapa.html` → **FUNCIONA**
- ❌ Dentro do dashboard (iframe) → **CONEXÃO RECUSADA**

---

## 🔍 CAUSA DO PROBLEMA:

O servidor da Hostinger está **bloqueando o carregamento do mapa dentro de um iframe** por padrão, por segurança.

Isso é feito através de:
- **X-Frame-Options**: Impede que a página seja carregada em iframe
- **Content-Security-Policy**: Política de segurança que restringe de onde o conteúdo pode ser carregado

---

## ✅ SOLUÇÃO COMPLETA:

### **PASSO 1: Enviar o arquivo `.htaccess` para a Hostinger**

1. **Acesse o Gerenciador de Arquivos da Hostinger**
   - Login no painel da Hostinger
   - Vá em **"Gerenciador de Arquivos"**

2. **Navegue até a pasta do mapa**
   ```
   public_html/mapas/
   ```

3. **Crie/edite o arquivo `.htaccess`**
   - Clique em **"Novo Arquivo"**
   - Nome: `.htaccess` (com ponto no início!)
   - Cole o conteúdo abaixo:

```apache
# Permitir que este arquivo seja carregado em iframe do mesmo domínio
<IfModule mod_headers.c>
    # Permitir iframe do mesmo domínio
    Header always set X-Frame-Options "SAMEORIGIN"
    
    # Permitir iframe via CSP
    Header always set Content-Security-Policy "frame-ancestors 'self' https://conectadosdigital.com.br http://localhost:*"
    
    # Permitir CORS para APIs externas
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Cache para o mapa (melhorar performance)
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
```

4. **Salvar o arquivo**

---

### **PASSO 2: Atualizar o arquivo `mapa.html`**

O arquivo `mapa.html` já foi atualizado com as permissões de CSP. Você precisa enviar a versão atualizada para a Hostinger:

1. **Arquivo local:** `dist/mapas/mapa.html`
2. **Destino na Hostinger:** `public_html/mapas/mapa.html`
3. **Ação:** Substituir o arquivo antigo pelo novo

---

### **PASSO 3: Testar**

Após enviar os arquivos:

1. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
2. **Acesse o dashboard:** `https://conectadosdigital.com.br`
3. **Faça login com usuário da Campanha B**
4. **Verifique se o mapa carrega corretamente**

---

## 📁 ESTRUTURA FINAL NA HOSTINGER:

```
public_html/
├── index.html
├── assets/
├── mapas/
│   ├── .htaccess        ← NOVO ARQUIVO (IMPORTANTE!)
│   └── mapa.html        ← ATUALIZADO
├── lovable-uploads/
└── ...
```

---

## 🔧 ALTERNATIVA: .htaccess no root (se não funcionar)

Se o problema persistir, você pode adicionar essas regras no `.htaccess` principal em `public_html/.htaccess`:

```apache
# Permitir iframe para a pasta mapas
<FilesMatch "mapas/mapa\.html$">
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Content-Security-Policy "frame-ancestors 'self' https://conectadosdigital.com.br"
</FilesMatch>
```

---

## 🧪 COMO VERIFICAR SE FUNCIONOU:

### **Teste 1: Acesso Direto**
```
https://conectadosdigital.com.br/mapas/mapa.html
```
✅ Deve carregar: "🗺️ Carregando mapa..."

### **Teste 2: Dentro do Dashboard**
```
1. Login no dashboard
2. Usuário da Campanha B
3. O card "Mapa Interativo" deve aparecer
4. O mapa deve carregar dentro do iframe
```

### **Teste 3: Console do Navegador (F12)**
Não deve aparecer erros de:
- ❌ "Refused to frame"
- ❌ "X-Frame-Options"
- ❌ "Content-Security-Policy"

---

## 📊 RESUMO DOS ARQUIVOS:

| Arquivo | Localização | Ação |
|---------|-------------|------|
| `.htaccess` | `public_html/mapas/.htaccess` | **CRIAR NOVO** |
| `mapa.html` | `public_html/mapas/mapa.html` | **ATUALIZAR** |

---

## ⚡ COMANDOS PARA BUILD LOCAL:

Antes de enviar para a Hostinger, faça:

```bash
# Build
npm run build

# Verificar arquivos
ls dist/mapas/

# Deve mostrar:
# - .htaccess
# - mapa.html
```

---

## 🚨 SE AINDA NÃO FUNCIONAR:

Verifique no Console do navegador (F12) qual é o erro exato:

1. **"Refused to frame"** → `.htaccess` não foi aplicado
2. **"CORS error"** → APIs externas bloqueadas
3. **"Connection refused"** → Arquivo não existe ou caminho errado
4. **"Timeout"** → Problema de rede/Supabase

---

## ✅ CHECKLIST FINAL:

- [ ] Criar arquivo `.htaccess` em `public_html/mapas/`
- [ ] Atualizar `mapa.html` em `public_html/mapas/`
- [ ] Limpar cache do navegador
- [ ] Testar acesso direto: `/mapas/mapa.html`
- [ ] Testar no dashboard com usuário Campanha B
- [ ] Verificar console (F12) para erros

---

**Isso deve resolver o problema de "conexão recusada" no iframe!** 🎉

