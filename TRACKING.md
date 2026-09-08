# Documentação Técnica de Tracking & Atribuição — UTM-Track

## 1. O Script de Tracking (`public/tracker.js`)

O `tracker.js` é um script vanilla JavaScript ultra-leve (< 3KB), autônomo, não dependente de bibliotecas externas e projetado para nunca travar a renderização da página (carregamento assíncrono via atributo `async`).

### Instalação na Página de Vendas
```html
<script 
  src="https://seu-dominio.com/tracker.js" 
  data-api-url="https://seu-dominio.com" 
  data-workspace-id="ID_DO_SEU_WORKSPACE" 
  async
></script>
```

---

## 2. Dados Capturados Automaticamente

Ao carregar em qualquer página, o script executa as seguintes etapas:

1. **Extração de UTMs**:
   - `utm_source`
   - `utm_medium`
   - `utm_campaign`
   - `utm_content`
   - `utm_term`
   *Nota: Se o usuário navegar entre páginas do mesmo site, os parâmetros UTM são mantidos na `sessionStorage` para preservar a origem.*

2. **Identificadores Meta**:
   - `fbclid`: Identificador de clique único gerado pelo Meta Ads na URL.
   - `_fbp`: Cookie primário do Meta (formato `fb.1.{timestamp}.{random}`).
   - `_fbc`: Cookie de clique do Meta (formato `fb.1.{timestamp}.{fbclid}`).

3. **Gerenciamento de Sessão**:
   - `_utmt_sid`: Identificador único de sessão com expiração em 30 minutos de inatividade.
   - `_utmt_vid`: Identificador anônimo persistente do visitante.

4. **Disparo de Eventos Não-Bloqueantes**:
   - O script utiliza `navigator.sendBeacon` com fallback para `fetch(..., { keepalive: true })`. Dessa forma, mesmo que o usuário feche a página imediatamente, os dados de tracking continuam sendo transmitidos ao servidor.

---

## 3. Disparo Manual de Eventos Customizados

Você pode disparar eventos customizados através do objeto global `window.utmTrack`:

```javascript
// Exemplo: Disparo em clique no botão de checkout
window.utmTrack.track('InitiateCheckout', {
  value: 197.00,
  currency: 'BRL',
  content_ids: ['produto_01']
});
```

---

## 4. Regras do Motor de Atribuição (Last-Click)

Quando uma venda chega via webhook de qualquer plataforma (Hotmart, Shopify, Yampi, Cacto), o sistema executa a função `attemptAttribution(saleId)`:

| Prioridade | Método de Matching | Confiança | Descrição |
|---|---|---|---|
| **1ª** | `fbclid` | 100% | O ID de clique do anúncio bate exatamente com a sessão registrada. |
| **2ª** | `_fbp` | 90% | O cookie do navegador bate com a sessão do usuário. |
| **3ª** | `sessionId` | 85% | O ID da sessão do checkout bate com a sessão do lead. |
| **4ª** | `utm_campaign` | 50% | A campanha bate com a última campanha acessada pelo lead. |

Se nenhum identificador confiável for encontrado, a venda **não** é atribuída forçadamente, preservando a integridade e precisão dos dados do dashboard.
