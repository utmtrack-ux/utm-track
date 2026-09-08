import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calcCPM,
  calcCPC,
  calcCTR,
  calcCPI,
  calcCPA,
  calcROAS,
  calcROI,
  calcMargin,
  calcProfit,
  formatMetric
} from '../src/lib/metrics'

describe('Cálculos de Métricas de Marketing e Finanças', () => {
  it('Cálculo de CPM (Custo por Mil Impressões)', () => {
    // CPM = (Gasto / Impressões) * 1000
    const cpm = calcCPM(500, 20000)
    assert.equal(cpm, 25)

    // Divisão por zero deve retornar null
    assert.equal(calcCPM(500, 0), null)
  })

  it('Cálculo de CPC (Custo por Clique)', () => {
    // CPC = Gasto / Cliques
    const cpc = calcCPC(500, 800)
    assert.equal(cpc, 0.625)

    // Divisão por zero deve retornar null
    assert.equal(calcCPC(500, 0), null)
  })

  it('Cálculo de CTR (Taxa de Cliques %)', () => {
    // CTR = (Cliques / Impressões) * 100
    const ctr = calcCTR(800, 20000)
    assert.equal(ctr, 4)

    // Divisão por zero deve retornar null
    assert.equal(calcCTR(800, 0), null)
  })

  it('Cálculo de CPI (Custo por Início de Checkout)', () => {
    // CPI = Gasto / Checkouts
    const cpi = calcCPI(500, 80)
    assert.equal(cpi, 6.25)

    // Divisão por zero deve retornar null
    assert.equal(calcCPI(500, 0), null)
  })

  it('Cálculo de CPA (Custo por Aquisição / Venda)', () => {
    // CPA = Gasto / Compras
    const cpa = calcCPA(500, 20)
    assert.equal(cpa, 25)

    // Divisão por zero deve retornar null
    assert.equal(calcCPA(500, 0), null)
  })

  it('Cálculo de ROAS (Retorno sobre Gasto em Anúncios)', () => {
    // ROAS = Faturamento / Gasto
    const roas = calcROAS(2000, 500)
    assert.equal(roas, 4)

    // Divisão por zero deve retornar null
    assert.equal(calcROAS(2000, 0), null)
  })

  it('Cálculo de ROI (Retorno sobre Investimento %)', () => {
    // ROI = (Lucro / Investimento) * 100
    const roi = calcROI(900, 500)
    assert.equal(roi, 180)

    // Divisão por zero deve retornar null
    assert.equal(calcROI(900, 0), null)
  })

  it('Cálculo de Margem de Lucro (%)', () => {
    // Margem = (Lucro / Faturamento) * 100
    const margin = calcMargin(900, 2000)
    assert.equal(margin, 45)

    // Divisão por zero deve retornar null
    assert.equal(calcMargin(900, 0), null)
  })

  it('Cálculo de Lucro Líquido Real', () => {
    // Lucro = Receita líquida - custos - despesas - investimento em anúncios
    const profit = calcProfit({
      netRevenue: 2000,
      adSpend: 500,
      productCost: 400,
      fees: 100,
      taxes: 60,
      expenses: 40
    })
    assert.equal(profit, 900)
  })

  it('Formatação segura de métricas (valores nulos retornam "—")', () => {
    assert.equal(formatMetric(null, 'currency'), '—')
    assert.equal(formatMetric(null, 'percent'), '—')
    assert.equal(formatMetric(null, 'ratio'), '—')
    assert.equal(formatMetric(4, 'ratio'), '4.00x')
    assert.equal(formatMetric(25, 'percent'), '25.00%')
  })
})
