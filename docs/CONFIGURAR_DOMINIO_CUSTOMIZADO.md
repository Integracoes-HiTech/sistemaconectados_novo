# 🌐 Configurar Domínio Customizado no Vercel

## 📋 Visão Geral

Este guia explica como configurar `conectadosdigital.com.br` para funcionar com as URLs amigáveis.

---

## ✅ **Arquivos Renomeados**

### **Antes → Depois:**
```
landing.html → comece-agora.html
sucesso.html → success.html
```

### **Por que renomear?**
- ✅ Funciona em **localhost** (desenvolvimento)
- ✅ Funciona em **Vercel** (produção)
- ✅ Funciona em **qualquer domínio** customizado
- ✅ Não depende de rewrites do servidor
- ✅ URLs limpas sem `.html`

---

## 🔗 **URLs Funcionais Agora:**

### **Localhost (Desenvolvimento):**
```
http://localhost:8080/comece-agora.html
http://localhost:8080/comece-agora  (sem .html também funciona)
http://localhost:8080/success.html
http://localhost:8080/success
```

### **Vercel (Temporário):**
```
https://sistemaconectados-nov-odev.vercel.app/comece-agora
https://sistemaconectados-nov-odev.vercel.app/success
```

### **Domínio Customizado (Após configurar):**
```
https://conectadosdigital.com.br/comece-agora
https://conectadosdigital.com.br/success
```

---

## 🚀 **Como Configurar o Domínio no Vercel**

### **Passo 1: Acessar o Dashboard do Vercel**

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `sistemaconectados-nov-odev`

---

### **Passo 2: Adicionar Domínio Customizado**

1. Clique na aba **"Settings"**
2. No menu lateral, clique em **"Domains"**
3. Clique em **"Add Domain"**
4. Digite: `conectadosdigital.com.br`
5. Clique em **"Add"**

---

### **Passo 3: Configurar DNS**

O Vercel vai mostrar as configurações de DNS necessárias:

#### **Opção A: Usar Nameservers do Vercel (Recomendado)**

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**No painel do Registro.br ou seu provedor de domínio:**
1. Vá em configurações de DNS
2. Altere os nameservers para os do Vercel
3. Aguarde propagação (até 48h, geralmente 1-2h)

---

#### **Opção B: Adicionar Registros A e CNAME**

**Se não puder mudar os nameservers, adicione estes registros:**

```
Tipo: A
Nome: @
Valor: 76.76.21.21

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

---

### **Passo 4: Verificar e Ativar SSL**

1. Após configurar o DNS, aguarde alguns minutos
2. O Vercel vai verificar automaticamente
3. O SSL (HTTPS) será ativado automaticamente
4. Status mudará para: ✅ **"Valid Configuration"**

---

### **Passo 5: Configurar Redirecionamento WWW (Opcional)**

Para que `www.conectadosdigital.com.br` redirecione para `conectadosdigital.com.br`:

1. Em **Settings → Domains**
2. Clique em `www.conectadosdigital.com.br`
3. Marque: **"Redirect to conectadosdigital.com.br"**

---

## ⚙️ **Configuração do vercel.json**

O arquivo `vercel.json` já está configurado corretamente:

```json
{
  "rewrites": [
    {
      "source": "/comece-agora",
      "destination": "/comece-agora.html"
    },
    {
      "source": "/success",
      "destination": "/success.html"
    }
  ]
}
```

**Isso garante que:**
- `/comece-agora` funciona (sem `.html`)
- `/comece-agora.html` também funciona
- Funciona em **todos os domínios** configurados no projeto

---

## 🧪 **Como Testar**

### **1. Testar Localhost:**

```bash
# Iniciar servidor local
npm run dev

# Acessar no navegador:
http://localhost:8080/comece-agora
http://localhost:8080/success
```

---

### **2. Testar Vercel (Deploy Temporário):**

```
https://sistemaconectados-nov-odev.vercel.app/comece-agora
https://sistemaconectados-nov-odev.vercel.app/success
```

---

### **3. Testar Domínio Customizado (Após configurar):**

```
https://conectadosdigital.com.br/comece-agora
https://conectadosdigital.com.br/success
```

---

## 📊 **Status de Propagação DNS**

Para verificar se o DNS já propagou:

### **Online:**
- https://dnschecker.org/
- Digite: `conectadosdigital.com.br`

### **Terminal:**
```bash
# Windows
nslookup conectadosdigital.com.br

# Linux/Mac
dig conectadosdigital.com.br
```

---

## 🔐 **SSL/HTTPS Automático**

O Vercel configura automaticamente:
- ✅ Certificado SSL gratuito (Let's Encrypt)
- ✅ Renovação automática
- ✅ Redirecionamento HTTP → HTTPS
- ✅ HSTS habilitado

**Você não precisa fazer nada!**

---

## 🎯 **Domínios Múltiplos**

Você pode adicionar múltiplos domínios apontando para o mesmo projeto:

```
conectadosdigital.com.br  (principal)
www.conectadosdigital.com.br  (redireciona)
sistemaconectados.com.br  (alternativo)
landing.conectados.com.br  (subdomínio)
```

**Todos funcionarão com:**
- `/comece-agora`
- `/success`

---

## 🚨 **Troubleshooting**

### **Problema: DNS não propaga**
**Solução:** Aguarde até 48h. Limpe cache DNS:
```bash
# Windows
ipconfig /flushdns

# Mac
sudo killall -HUP mDNSResponder
```

---

### **Problema: SSL não ativa**
**Solução:** 
1. Verifique se DNS está correto
2. Aguarde alguns minutos
3. Em Settings → Domains, clique em "Refresh"

---

### **Problema: URL não funciona**
**Solução:**
1. Verifique se o deploy foi feito
2. Limpe cache do navegador (Ctrl + Shift + R)
3. Teste em aba anônima

---

## 📚 **Links Úteis**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Vercel Domains:** https://vercel.com/docs/concepts/projects/domains
- **Suporte Vercel:** https://vercel.com/support

---

## ✅ **Checklist de Configuração**

- [x] Arquivos renomeados (`comece-agora.html`, `success.html`)
- [x] `vercel.json` atualizado
- [ ] Domínio adicionado no Vercel
- [ ] DNS configurado (Nameservers ou A/CNAME)
- [ ] DNS propagado (teste com dnschecker)
- [ ] SSL ativo (https funcionando)
- [ ] URLs testadas e funcionando
- [ ] Materiais de marketing atualizados

---

## 📝 **Anotações**

### **Domínio Atual:**
```
Domínio: conectadosdigital.com.br
Registrado em: [preencher]
Provedor: [preencher - ex: Registro.br, GoDaddy, etc]
```

### **Contatos:**
```
Email técnico: [preencher]
Acesso Vercel: [preencher]
Acesso DNS: [preencher]
```

---

**Data de Configuração:** 12/10/2025  
**Status:** 🟡 Arquivos renomeados - Aguardando configuração de domínio  
**Próximo Passo:** Adicionar domínio no Vercel Dashboard

