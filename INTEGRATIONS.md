# Guia Oficial de Integrações — UTM-Track

Este documento detalha como conectar cada plataforma ao UTM-Track.

---

## 1. Meta Ads (Marketing API & OAuth Oficial)

### Pré-requisitos
1. Uma conta no [Meta for Developers](https://developers.facebook.com/).
2. Um aplicativo registrado com o tipo de caso de uso **Negócios** (Business).
3. Adicionar o produto **Marketing API** e **Facebook Login for Business** no painel do aplicativo.
4. Configurar as URLs de redirecionamento no Facebook Login:
   - `https://utm-track-navy.vercel.app/api/meta/callback`
   - `http://localhost:3000/api/meta/callback` (para testes locais)

### Permissões Oficiais
- `ads_read`: Leitura de contas, campanhas, conjuntos, anúncios e Insights da Meta Marketing API v21.0.
- `ads_management`: Gestão de status de campanhas e anúncios.
- `business_management`: Gestão de permissões de Business Manager.

### Ciclo Operacional
1. **OAuth 2.0 com Proteção CSRF**: `state` assinado com HMAC-SHA256.
2. **Seleção Desacoplada e Rápida**: `/api/meta/select` salva imediatamente as contas ativas no banco.
3. **Sincronização Resiliente**: `/api/meta/sync` processa conta a conta com isolamento de falhas.

---

## 2. Meta Pixel & Conversions API (CAPI)

### Recursos Oficiais
- **Browser Pixel + Server-Side CAPI**: Envio duplo com deduplicação por `event_id`.
- **Regras Individuais de Eventos**:
  - `Lead`: Disparo ao preencher formulários de captura.
  - `AddToCart`: Disparo ao adicionar produto ao carrinho.
  - `InitiateCheckout`: Disparo automático ao detectar clique em links de checkout configurados (`pay.hotmart.com`, `checkout.cakto.com.br`, `yampi.io`, etc.).
  - `Purchase`: Disparo exclusivamente após confirmação de venda aprovada via webhook.
- **Hash de Privacidade**: Dados de e-mail e telefone são normalizados e criptografados com SHA-256 antes do envio para a Meta.

---

## 3. Webhooks Oficiais de Checkout

### 3.1 Hotmart
- **URL**: `https://utm-track-navy.vercel.app/api/webhooks/hotmart`
- **Header**: `x-hotmart-hottok`
- **Eventos**: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED`.

### 3.2 Cakto (Oficial)
- **URL**: `https://utm-track-navy.vercel.app/api/webhooks/cakto`
- **Header**: `x-cakto-signature` ou `Authorization`
- **Eventos**: `approved`, `paid`, `waiting_payment` (Pix), `refunded`, `chargeback`, `cancelled`.

### 3.3 Yampi
- **URL**: `https://utm-track-navy.vercel.app/api/webhooks/yampi`
- **Header**: `Authorization: Bearer <SECRET>`
- **Eventos**: `payment_approved`, `waiting_payment`, `refunded`, `cancelled`.

### 3.4 Shopify
- **URL**: `https://utm-track-navy.vercel.app/api/webhooks/shopify`
- **Header**: `x-shopify-hmac-sha256` (Assinatura HMAC validada)
- **Tópicos**: `orders/paid`, `orders/cancelled`, `refunds/create`.

### 3.5 Webhook Genérico Customizável
- **URL**: `https://utm-track-navy.vercel.app/api/webhooks/generic/[endpointId]`
- **Mapeamento**: Suporta de-para de campos JSON para `order_id`, `amount`, `customerEmail`, `utmSource`, `utmCampaign`, `fbclid`.

---

## 4. UTMs & Scripts de Rastreamento

### Parâmetros Recomendados para Meta Ads
```
utm_source={{site_source_name}}&utm_medium={{placement}}&utm_campaign={{campaign.name}}&utm_content={{adset.name}}&utm_term={{ad.name}}&src={{site_source_name}}&sck={{campaign.name}}
```

### Script de Tracking Próprio (`tracker.js`)
```html
<script src="https://utm-track-navy.vercel.app/tracker.js" data-api-url="https://utm-track-navy.vercel.app" async></script>
```
- Captura `utm_*`, `fbclid`, `_fbp`, `_fbc`, `referrer`, `landingPage`, `session_id`.
- Persiste a sessão entre páginas e detecta URLs de checkout para disparar `InitiateCheckout`.
