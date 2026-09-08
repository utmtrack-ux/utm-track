# Guia Oficial de Integrações — UTM-Track

Este documento detalha como conectar cada plataforma ao UTM-Track.

---

## 1. Meta Ads (Facebook & Instagram)

### Pré-requisitos
1. Uma conta no [Meta for Developers](https://developers.facebook.com/).
2. Um aplicativo registrado com o tipo **Business**.
3. Permissões necessárias:
   - `ads_read`
   - `ads_management`
   - `business_management`
   - `read_insights`

### Configuração no `.env`
```env
META_APP_ID=seu_app_id
META_APP_SECRET=seu_app_secret
META_VERIFY_TOKEN=token_aleatorio_de_verificacao
```

### Fluxo de Conexão
1. No menu lateral, acesse **Integrações** ou **Meta Ads**.
2. Clique no botão **Conectar Meta Ads**.
3. Autorize o aplicativo no Facebook.
4. Ao retornar, o sistema lista todas as contas de anúncio às quais seu usuário tem acesso.
5. Selecione as contas desejadas e clique em **Sincronizar**.
6. As campanhas, conjuntos, anúncios e insights dos últimos 30 dias serão importados automaticamente.

---

## 2. Meta Pixel & Conversions API (CAPI)

### Configuração
1. Acesse **Integrações → Pixel**.
2. Clique em **Adicionar Pixel**.
3. Preencha:
   - **Nome:** Identificador amigável.
   - **Pixel ID:** Obtido no Gerenciador de Eventos da Meta.
   - **Access Token:** Token gerado na aba "Configurações" do Pixel no Gerenciador de Eventos.
   - **Ambiente:** `production` ou `test`.
4. Clique em **Salvar Pixel**.

### Testar Conexão Server-Side
Clique no botão de **Play (Testar)** ao lado do pixel cadastrado. O sistema enviará um evento `PageView` de teste via CAPI e exibirá a confirmação imediata de recebimento.

---

## 3. Hotmart

### Configuração de Webhook
1. Acesse sua conta na Hotmart: **Ferramentas → Webhook (Notificações)**.
2. Crie uma nova configuração de webhook:
   - **URL de Envio:** `https://seu-dominio.com/api/webhooks/hotmart`
   - **Versão:** 2.0 (mais recente)
   - **Eventos:** Marcar `Compra aprovada`, `Compra cancelada`, `Compra reembolsada`, `Chargeback`.
   - **Token de Autenticação (Hottok):** Copie o token fornecido pela Hotmart.
3. No `.env`, configure:
   ```env
   HOTMART_WEBHOOK_SECRET=token_copiado_da_hotmart
   ```

---

## 4. Shopify

### Configuração de Webhook
1. No painel da sua loja Shopify: **Configurações → Notificações → Webhooks**.
2. Clique em **Criar Webhook**:
   - **Evento:** `Criação de pedido` ou `Pagamento do pedido` (`orders/paid`).
   - **Formato:** `JSON`.
   - **URL:** `https://seu-dominio.com/api/webhooks/shopify`
3. Copie o segredo do webhook exibido no rodapé da página de Webhooks da Shopify.
4. No `.env`, configure:
   ```env
   SHOPIFY_WEBHOOK_SECRET=segredo_copiado_da_shopify
   ```

---

## 5. Yampi

### Configuração de Webhook
1. No painel da Yampi: **Configurações → Webhooks**.
2. Adicione um novo webhook apontando para:
   - **URL:** `https://seu-dominio.com/api/webhooks/yampi`
   - **Eventos:** Pedidos pagos, cancelados e reembolsados.
3. Defina um token secreto Bearer e insira no `.env`:
   ```env
   YAMPI_WEBHOOK_SECRET=seu_token_yampi
   ```

---

## 6. Cacto

### Configuração de Webhook
1. No painel da Cacto: acesse **Integrações / Webhooks**.
2. Configure a URL de notificação:
   - **URL:** `https://seu-dominio.com/api/webhooks/cacto`
3. Configure a chave secreta no `.env`:
   ```env
   CACTO_WEBHOOK_SECRET=sua_chave_secreta_cacto
   ```

---

## 7. Webhook Genérico (Para qualquer checkout ou plataforma)

1. Acesse **Integrações → Webhooks**.
2. Clique em **Novo Webhook**.
3. Dê um nome ao webhook (ex: "Checkout Customizado").
4. O sistema gera uma URL única:
   `https://seu-dominio.com/api/webhooks/generic/{endpointId}`
5. Qualquer payload JSON enviado para esta URL será registrado e exibido na tela de **Eventos**.
