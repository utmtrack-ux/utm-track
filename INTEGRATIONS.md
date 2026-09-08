# Guia Oficial de Integrações — UTM-Track

Este documento detalha como conectar cada plataforma ao UTM-Track.

---

## 1. Meta Ads (Marketing API & OAuth Oficial)

### Pré-requisitos
1. Uma conta no [Meta for Developers](https://developers.facebook.com/).
2. Um aplicativo registrado com o tipo de caso de uso **Negócios** (Business).
3. Adicionar o produto **Marketing API** e **Facebook Login for Business** no painel do aplicativo.
4. Configurar as URLs de redirecionamento no Facebook Login:
   - `https://seu-dominio.com/api/meta/callback`
   - `http://localhost:3000/api/meta/callback` (para testes locais)

### Permissões Solicitadas
- `ads_read`: Permite listar contas de anúncios, campanhas, conjuntos de anúncios e criativos.
- `read_insights`: Permite consultar métricas agregadas e relatórios de desempenho de anúncios (gasto, impressões, cliques, conversões).
- `ads_management`: Permite operações de sincronização e gerenciamento de status de anúncios.
- `business_management`: Permite acessar contas vinculadas ao Gerenciador de Negócios (Business Manager).

> **Nota sobre App Review da Meta:**
> Durante o desenvolvimento (modo Development do App), apenas administradores, desenvolvedores e testadores adicionados no Meta App podem autenticar via OAuth.
> Para liberar o OAuth para qualquer cliente final externo, o aplicativo precisará passar pelo **App Review** da Meta para as permissões `ads_read` e `read_insights`.

### Variáveis de Ambiente Necessárias
Configure as seguintes variáveis na Vercel (Production) ou no seu arquivo `.env`:
```env
META_APP_ID=seu_meta_app_id
META_APP_SECRET=seu_meta_app_secret
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### Ciclo de Vida do Token e Segurança
1. **OAuth com Proteção CSRF**: A URL de autorização gera um `state` assinado com HMAC-SHA256 vinculando o usuário autenticado ao seu workspace.
2. **Troca por Long-Lived Token**: O código de autorização é trocado por um token de curta duração e imediatamente convertido para um **Long-Lived User Access Token** com validade de 60 dias.
3. **Criptografia em Repouso**: Todos os tokens de acesso são cifrados com **AES-256-GCM** antes de serem salvos no banco de dados. Nunca são expostos no frontend ou em logs.
4. **Seleção de Contas**: O usuário pode selecionar quais contas de anúncios deseja monitorar ativamente.
5. **Detecção de Expiração**: Se o token for invalidado pelo usuário ou expirar, o UTM-Track marca a conta com o status `reconnect_required`, preservando todo o histórico financeiro intacto.


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
