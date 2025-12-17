import { describe, it, expect } from 'vitest';
import { calculateSimulation, getRegressiveIRRate } from './calculations';

describe('calculateSimulation', () => {
  it('deve calcular corretamente com valores padrão', () => {
    const result = calculateSimulation({
      monthlyContribution: 2000,
      annualReturn: 8,
      years: 30,
      currentAge: 30,
      adminFee: 0.5,
      loadingFee: 0,
      productType: 'VGBL',
    });

    // Valores aproximados (teste de regressão)
    expect(result.totalMonths).toBe(360);
    expect(result.retirementAge).toBe(60);
    expect(result.totalContributions).toBe(720000); // 2000 * 360
    expect(result.futureValue).toBeGreaterThan(700000);
    expect(result.totalReturn).toBeGreaterThan(0);
    const expectedIR = result.totalReturn * 0.1
    const expectedAfterTax = result.futureValue - expectedIR
    expect(result.afterTaxValue).toBeCloseTo(expectedAfterTax, 1);
  });

  it('deve aplicar taxa de carregamento corretamente', () => {
    const result = calculateSimulation({
      monthlyContribution: 1000,
      annualReturn: 0,
      years: 1,
      currentAge: 30,
      adminFee: 0,
      loadingFee: 5, // 5% de carregamento
      productType: 'VGBL',
    });

    // Com 5% de carregamento, aporte líquido = 950
    // 12 meses * 950 = 11400
    expect(result.totalContributions).toBe(11400);
    expect(result.futureValue).toBe(11400); // Sem juros nem taxas
  });

  it('deve aplicar taxa de administração uma vez por mês', () => {
    const withAdminFee = calculateSimulation({
      monthlyContribution: 1000,
      annualReturn: 12, // 1% a.m.
      years: 1,
      currentAge: 30,
      adminFee: 0.5, // 0.5% a.m.
      loadingFee: 0,
      productType: 'VGBL',
    });

    const withoutAdminFee = calculateSimulation({
      monthlyContribution: 1000,
      annualReturn: 12,
      years: 1,
      currentAge: 30,
      adminFee: 0,
      loadingFee: 0,
      productType: 'VGBL',
    });

    // Com taxa de administração, valor futuro deve ser menor
    expect(withAdminFee.futureValue).toBeLessThan(withoutAdminFee.futureValue);
  });

  it('deve retornar zero quando annualReturn é zero', () => {
    const result = calculateSimulation({
      monthlyContribution: 1000,
      annualReturn: 0,
      years: 10,
      currentAge: 30,
      adminFee: 0,
      loadingFee: 0,
      productType: 'VGBL',
    });

    expect(result.totalReturn).toBe(0);
    expect(result.futureValue).toBe(result.totalContributions);
  });

  it('deve calcular idade de aposentadoria corretamente', () => {
    const result = calculateSimulation({
      monthlyContribution: 1000,
      annualReturn: 8,
      years: 25,
      currentAge: 35,
      adminFee: 0,
      loadingFee: 0,
      productType: 'PGBL',
    });

    expect(result.retirementAge).toBe(60);
  });

  it('deve lidar com valores grandes sem overflow', () => {
    const result = calculateSimulation({
      monthlyContribution: 10000,
      annualReturn: 15,
      years: 40,
      currentAge: 20,
      adminFee: 0,
      loadingFee: 0,
      productType: 'VGBL',
    });

    expect(result.futureValue).toBeGreaterThan(0);
    expect(result.futureValue).toBeLessThan(Infinity);
    expect(Number.isFinite(result.futureValue)).toBe(true);
  });
});

describe('getRegressiveIRRate', () => {
  it('deve retornar 35% para 0-2 anos', () => {
    expect(getRegressiveIRRate(0)).toBe(0.35);
    expect(getRegressiveIRRate(12)).toBe(0.35);
    expect(getRegressiveIRRate(24)).toBe(0.35);
  });

  it('deve retornar 30% para 2-4 anos', () => {
    expect(getRegressiveIRRate(25)).toBe(0.30);
    expect(getRegressiveIRRate(36)).toBe(0.30);
    expect(getRegressiveIRRate(48)).toBe(0.30);
  });

  it('deve retornar 25% para 4-6 anos', () => {
    expect(getRegressiveIRRate(49)).toBe(0.25);
    expect(getRegressiveIRRate(60)).toBe(0.25);
    expect(getRegressiveIRRate(72)).toBe(0.25);
  });

  it('deve retornar 20% para 6-8 anos', () => {
    expect(getRegressiveIRRate(73)).toBe(0.20);
    expect(getRegressiveIRRate(84)).toBe(0.20);
    expect(getRegressiveIRRate(96)).toBe(0.20);
  });

  it('deve retornar 15% para 8-10 anos', () => {
    expect(getRegressiveIRRate(97)).toBe(0.15);
    expect(getRegressiveIRRate(108)).toBe(0.15);
    expect(getRegressiveIRRate(120)).toBe(0.15);
  });

  it('deve retornar 10% para mais de 10 anos', () => {
    expect(getRegressiveIRRate(121)).toBe(0.10);
    expect(getRegressiveIRRate(240)).toBe(0.10);
    expect(getRegressiveIRRate(360)).toBe(0.10);
  });
});
