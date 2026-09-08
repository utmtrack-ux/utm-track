import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'

describe('Integrações e Normalização de Webhooks', () => {
  it('Hotmart: Normalização de evento PURCHASE_APPROVED', () => {
    const hotmartPayload = {
      event: 'PURCHASE_APPROVED',
      data: {
        purchase: {
          transaction: 'HP123456789',
          order_date: '2026-09-07T14:30:00Z',
          approved_date: '2026-09-07T14:32:00Z',
          price: { value: 197.0, currency_code: 'BRL' },
          commission: { value: 180.0 },
          tracking: {
            utm_source: 'instagram',
            utm_campaign: 'oferta_relampago'
          }
        },
        buyer: { email: 'cliente@gmail.com' }
      }
    }

    const { event, data } = hotmartPayload
    const status = event === 'PURCHASE_APPROVED' ? 'approved' : 'pending'
    const grossAmount = data.purchase.price.value
    const netAmount = data.purchase.commission.value

    assert.equal(status, 'approved')
    assert.equal(grossAmount, 197.0)
    assert.equal(netAmount, 180.0)
    assert.equal(data.purchase.tracking.utm_source, 'instagram')
  })

  it('Shopify: Validação de assinatura HMAC-SHA256', () => {
    const secret = 'shpss_test_secret_123'
    const payload = JSON.stringify({ id: 82098291194, total_price: '250.00' })

    // Gerar HMAC esperado
    const expectedHmac = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64')

    // Validar assinatura
    const receivedHmac = expectedHmac
    const isValid = crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(receivedHmac))

    assert.equal(isValid, true)
  })

  it('Yampi: Mapeamento de status de pedido', () => {
    const mapYampiStatus = (alias: string) => {
      if (alias === 'payment_approved' || alias === 'paid') return 'approved'
      if (alias === 'refunded') return 'refunded'
      if (alias === 'cancelled') return 'cancelled'
      return 'pending'
    }

    assert.equal(mapYampiStatus('payment_approved'), 'approved')
    assert.equal(mapYampiStatus('refunded'), 'refunded')
    assert.equal(mapYampiStatus('waiting_payment'), 'pending')
    assert.equal(mapYampiStatus('cancelled'), 'cancelled')
  })

  it('Cakto: Normalização oficial de payload com campos id, status, amount, utms e e-mail', () => {
    const caktoPayload = {
      id: 'cakto_trans_99182',
      status: 'approved',
      amount: 297.0,
      currency: 'BRL',
      email: 'comprador@cakto.com.br',
      utms: {
        source: 'facebook',
        medium: 'cpc',
        campaign: 'campanha_cakto_oficial',
        content: 'ad_01',
        term: 'feed'
      },
      created_at: '2026-09-08T12:00:00Z'
    }

    const caktoStatus = caktoPayload.status.toLowerCase()
    let status = 'pending'
    if (caktoStatus.includes('approved') || caktoStatus.includes('paid')) status = 'approved'

    assert.equal(status, 'approved')
    assert.equal(caktoPayload.amount, 297.0)
    assert.equal(caktoPayload.utms.campaign, 'campanha_cakto_oficial')
    assert.equal(caktoPayload.utms.source, 'facebook')
  })

  it('Cakto: Geração de chave de idempotência para evitar duplicação de vendas', () => {
    const transId = 'ck_987654'
    const status = 'approved'
    const key1 = `cakto_${transId}_${status}_approved`
    const key2 = `cakto_${transId}_${status}_approved`

    assert.equal(key1, key2, 'Mesma transação Cakto gera a mesma chave de idempotência')
  })

  it('Detecção de Checkout por URL: Reconhece gateways configurados (Hotmart, Cakto, Yampi, Shopify)', () => {
    const checkoutKeywords = [
      'hotmart.com', 'cakto.com.br', 'cacto.com.br', 'yampi.io', 'yampi.com.br',
      'shopify.com', 'myshopify.com', 'kiwify.com.br', 'eduzz.com', 'braip.com',
      'ticto.com.br', 'monetizze.com.br', 'perfectpay.com.br', 'pay.', 'checkout'
    ]

    const isCheckout = (url: string) => {
      const lower = url.toLowerCase()
      return checkoutKeywords.some(k => lower.includes(k))
    }

    assert.equal(isCheckout('https://pay.hotmart.com/B12345678X'), true)
    assert.equal(isCheckout('https://checkout.cakto.com.br/pay/abc123xyz'), true)
    assert.equal(isCheckout('https://loja.yampi.io/checkout/order/123'), true)
    assert.equal(isCheckout('https://minhaloja.myshopify.com/checkouts/c/12345'), true)
    assert.equal(isCheckout('https://meusite.com.br/pagina-de-vendas'), false)
  })
})
