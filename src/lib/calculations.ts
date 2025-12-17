import type { SimulationResults, YearlyEvolution } from '@/types/simulation';

export interface SimulationInput {
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  currentAge: number;
  adminFee: number;
  loadingFee: number;
  productType: 'PGBL' | 'VGBL';
  inflation?: number;

}

/**
 * Calcula a simulação de investimento previdenciário
 *
 * @param input - Parâmetros da simulação
 * @returns Resultados da simulação incluindo valor futuro, rentabilidade e IR
 */
export function calculateSimulation(input: SimulationInput): SimulationResults {
  const {
    monthlyContribution,
    annualReturn,
    years,
    currentAge,
    adminFee,
    loadingFee,
    productType,
    inflation = 0,
  } = input;

  // Converte taxa anual para mensal
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = years * 12;

  let balance = 0;
  let totalContributions = 0;
  const yearlyEvolution: YearlyEvolution[] = [];

  for (let i = 0; i < totalMonths; i++) {
    // 1. Aplicar taxa de carregamento no aporte
    const netContribution = monthlyContribution * (1 - loadingFee / 100);

    // 2. Adicionar aporte líquido ao saldo
    balance += netContribution;
    totalContributions += netContribution;

    // 3. Deduzir taxa de administração (sobre o patrimônio ANTES dos juros)
    balance *= (1 - adminFee / 100 / 12);

    // 4. Aplicar juros compostos mensais
    balance *= (1 + monthlyRate);

    //Registra dado a cada ano (12 mes)

    if((i +1)% 12 === 0){
      const currentyear =(i +1)/12;
      const yearReturn = balance - totalContributions;
      const inflationMultiplier = Math.pow(1 + (inflation || 0)/100, currentyear);
      const realValueYear = balance/inflationMultiplier;
    
      yearlyEvolution.push({
        year: currentyear,
        totalContributions: totalContributions,
        futureValue: balance,
        totalReturn: yearReturn,
        realValue: realValueYear,
      });
    
    }
  }

  // Valor futuro acumulado
  const futureValue = balance;

  // Rentabilidade total (juros compostos)
  const totalReturn = futureValue - totalContributions;

  // Aplicar IR fixo de 15% (simplificado)
  // Aplica tabela regressiva de IR
  let taxBase: number
  let irAmount: number
  const irRate = getRegressiveIRRate(totalMonths);
  if (productType ==='PGBL'){
    //PGBL: IR sobre o valor total (aportes+ rentabilidade)
    taxBase = futureValue;
    irAmount = taxBase * irRate
  } else {
    //VGBL IR apenas sobre a rentabilidade
    taxBase = totalReturn
    irAmount = taxBase * irRate
  }
  const afterTaxValue = futureValue - irAmount;
  //calculando valor ajustado pela inflação

  const inflationMultiplier = Math.pow(1+inflation/100, years);
  const realFutureValue = futureValue/inflationMultiplier;
  const realAfterTaxValue = afterTaxValue/inflationMultiplier;

  // Idade na aposentadoria
  const retirementAge = currentAge + years;

  return {
    totalContributions,
    futureValue,
    totalReturn,
    afterTaxValue,
    retirementAge,
    monthlyRate,
    totalMonths,
    realFutureValue,
    realAfterTaxValue,
    inflationRate: inflation,
    yearlyEvolution,
  };
}

/**
 * Calcula a alíquota de IR pela tabela regressiva
 *
 * @param months - Total de meses de acumulação
 * @returns Alíquota de IR (0 a 1)
 */
export function getRegressiveIRRate(months: number): number {
  if (months <= 24) return 0.35;   // 0-2 anos: 35%
  if (months <= 48) return 0.30;   // 2-4 anos: 30%
  if (months <= 72) return 0.25;   // 4-6 anos: 25%
  if (months <= 96) return 0.20;   // 6-8 anos: 20%
  if (months <= 120) return 0.15;  // 8-10 anos: 15%
  return 0.10;                     // > 10 anos: 10%
}
