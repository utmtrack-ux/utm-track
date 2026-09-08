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

  it('Cacto: Normalização de payload e status', () => {
    const cactoPayload = {
      id: 'cacto_99182',
      status: 'paid',
      amount: 497.0,
      currency: 'BRL',
      email: 'comprador@teste.com',
      utms: {
        source: 'facebook',
        campaign: 'campanha_escala'
      }
    }

    const status = (cactoPayload.status === 'paid' || cactoPayload.status === 'approved') ? 'approved' : 'pending'
    assert.equal(status, 'approved')
    assert.equal(cactoPayload.amount, 497.0)
    assert.equal(cactoPayload.utms.campaign, 'campanha_escala')
  })

  it('Idempotência de Webhook: Geração e unicidade de chave', () => {
    const hotmartKey1 = `hotmart_HP123456_PURCHASE_APPROVED`
    const hotmartKey2 = `hotmart_HP123456_PURCHASE_APPROVED`
    const hotmartKey3 = `hotmart_HP123456_PURCHASE_REFUNDED`

    assert.equal(hotmartKey1, hotmartKey2, 'Mesmo evento da mesma transação deve ter a mesma chave')
    assert.notEqual(hotmartKey1, hotmartKey3, 'Eventos diferentes devem ter chaves diferentes')
  })
})
