import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test_auth_secret_for_meta_integration_testing_2025'

import { generateOAuthState, verifyOAuthState } from '../src/lib/meta/oauth'
import { encrypt, decrypt, maskSecret } from '../src/lib/encryption'
import { MetaApiError } from '../src/lib/meta/client'
import { calcCTR, calcCPC, calcCPM, calcCPA, calcROAS } from '../src/lib/metrics'

describe('Meta Ads — Segurança do OAuth e State Token (CSRF)', () => {
  it('Gera e valida token de state assinado com HMAC-SHA256 contendo userId e workspaceId', () => {
    const userId = 'user_123'
    const workspaceId = 'ws_456'
    const state = generateOAuthState(userId, workspaceId)

    assert.ok(state.includes('.'))
    const result = verifyOAuthState(state)

    assert.equal(result.valid, true)
    assert.equal(result.userId, userId)
    assert.equal(result.workspaceId, workspaceId)
    assert.equal(result.error, undefined)
  })

  it('Rejeita state adulterado ou com assinatura inválida (Proteção Anti-CSRF)', () => {
    const state = generateOAuthState('user_123', 'ws_456')
    const [payload, signature] = state.split('.')

    // Adulterar payload
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'attacker', workspaceId: 'ws_hacked' })).toString('base64url')
    const tamperedState = `${tamperedPayload}.${signature}`

    const result = verifyOAuthState(tamperedState)
    assert.equal(result.valid, false)
    assert.ok(result.error?.includes('Assinatura'))
  })

  it('Rejeita state expirado (> 30 minutos)', () => {
    const expiredPayload = {
      userId: 'user_123',
      workspaceId: 'ws_456',
      timestamp: Date.now() - (35 * 60 * 1000), // 35 min atrás
      nonce: 'nonce123',
    }
    const serialized = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')
    const crypto = require('crypto')
    const signature = crypto
      .createHmac('sha256', process.env.AUTH_SECRET!)
      .update(serialized)
      .digest('base64url')
    
    const expiredState = `${serialized}.${signature}`
    const result = verifyOAuthState(expiredState)

    assert.equal(result.valid, false)
    assert.ok(result.error?.includes('expirado'))
  })

  it('Rejeita state ausente ou malformado', () => {
    assert.equal(verifyOAuthState(null).valid, false)
    assert.equal(verifyOAuthState('').valid, false)
    assert.equal(verifyOAuthState('invalid_state_without_dot').valid, false)
  })
})

describe('Meta Ads — Proteção e Armazenamento de Access Tokens', () => {
  it('Criptografa o token do usuário com AES-256-GCM antes da persistência', () => {
    const token = 'EAABwz91k20kZAO...long_lived_user_access_token'
    const encrypted = encrypt(token)

    assert.notEqual(encrypted, token)
    const decrypted = decrypt(encrypted)
    assert.equal(decrypted, token)
  })

  it('Mascaramento seguro do token para exibição na interface', () => {
    const rawToken = 'EAABwz91k20kZAO123456789xyz'
    const masked = maskSecret(rawToken)

    assert.ok(!masked.includes('EAABwz91k20kZAO'))
    assert.equal(masked.endsWith('9xyz'), true)
  })
})

describe('Meta Ads — Tratamento de Erros da Meta Graph API v21.0', () => {
  it('Identifica código 190 como token expirado ou invalidado (Reconexão Necessária)', () => {
    const error190 = new MetaApiError('Error validating access token: Session has expired', 190, 463)
    assert.equal(error190.isTokenInvalid, true)
    assert.equal(error190.isRateLimit, false)

    const error102 = new MetaApiError('Session key invalid', 102)
    assert.equal(error102.isTokenInvalid, true)
  })

  it('Identifica código 17 e 613 como limites de requisições atingidos (Rate Limit)', () => {
    const error17 = new MetaApiError('User request limit reached', 17)
    assert.equal(error17.isRateLimit, true)
    assert.equal(error17.isTokenInvalid, false)

    const error613 = new MetaApiError('Calls to this api have exceeded the rate limit', 613)
    assert.equal(error613.isRateLimit, true)
  })
})

describe('Meta Ads — Consistência de Métricas Importadas da Meta', () => {
  it('Calcula CTR com base em cliques e impressões reais', () => {
    assert.equal(calcCTR(50, 1000), 5.0)
    assert.equal(calcCTR(0, 1000), 0.0)
    assert.equal(calcCTR(100, 0), null)
  })

  it('Calcula CPC e CPM reais', () => {
    assert.equal(calcCPC(150, 50), 3.0)
    assert.equal(calcCPM(200, 10000), 20.0)
  })

  it('Calcula ROAS com base em faturamento e investimento de anúncios', () => {
    assert.equal(calcROAS(1000, 200), 5.0)
    assert.equal(calcROAS(0, 200), 0.0)
    assert.equal(calcROAS(1000, 0), null)
  })

  it('Calcula CPA com base no gasto e conversões aprovadas', () => {
    assert.equal(calcCPA(500, 10), 50.0)
    assert.equal(calcCPA(500, 0), null)
  })
})

