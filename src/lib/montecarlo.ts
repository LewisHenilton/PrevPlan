/**
 * Gera um número aleatório seguindo distribuição normal (Gaussiana)
 * usando o algoritmo Box-Muller
 *
 * @returns número aleatório com média 0 e desvio padrão 1
 */
function randomNormal(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();

  // Evita log(0)
  const r = Math.sqrt(-2.0 * Math.log(u1 + 1e-10));
  const theta = 2.0 * Math.PI * u2;

  return r * Math.cos(theta);
}

/**
 * Gera um retorno anual seguindo distribuição lognormal
 *
 * @param meanReturn - Retorno médio esperado (decimal, ex: 0.08 para 8%)
 * @param volatility - Volatilidade/desvio padrão (decimal, ex: 0.15 para 15%)
 * @returns Retorno anual (decimal, ex: 0.12 para 12%)
 */
export function generateLognormalReturn(meanReturn: number, volatility: number): number {
  const z = randomNormal();

  // Ajuste para distribuição lognormal
  // drift = μ - σ²/2 (correção de Itô)
  const drift = meanReturn - (volatility * volatility) / 2;

  // Retorno = e^(drift + σ*z) - 1
  const annualReturn = Math.exp(drift + volatility * z) - 1;

  return annualReturn;
}

/**
 * Parâmetros para simulação Monte Carlo
 */
export interface MonteCarloParams {
    monthlyContribution: number;
    meanReturn: number;        // Retorno médio esperado (% a.a. em decimal)
    volatility: number;        // Volatilidade (% a.a. em decimal)
    years: number;
    currentAge: number;
    adminFee: number;          // Taxa de administração (% a.a. em decimal)
    loadingFee: number;        // Taxa de carregamento (% em decimal)
    productType: 'PGBL' | 'VGBL';
    inflation?: number;
    numSimulations?: number;   // Padrão: 1000
  }

  /**
   * Resultado de UMA simulação Monte Carlo
   */
  interface SimulationPath {
    futureValue: number;
    afterTaxValue: number;
    yearlyValues: number[];    // Valor ao final de cada ano
  }

  /**
   * Resultado agregado de TODAS as simulações
   */
  export interface MonteCarloResults {
    percentile5: number;       // Pior caso (5º percentil)
    percentile50: number;      // Mediana (50º percentil)
    percentile95: number;      // Melhor caso (95º percentil)
    mean: number;              // Média de todas as simulações
    allPaths: SimulationPath[]; // Todos os caminhos simulados
  }

  /**
   * Executa simulação Monte Carlo
   */
  export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResults {
    const {
      monthlyContribution,
      meanReturn,
      volatility,
      years,
      currentAge: _currentAge,
      adminFee,
      loadingFee,
      productType,
      inflation: _inflation = 0,
      numSimulations = 1000,
    } = params;

    const allPaths: SimulationPath[] = [];
    const totalMonths = years * 12;

    // Roda N simulações
    for (let sim = 0; sim < numSimulations; sim++) {
      let balance = 0;
      let totalContributions = 0;
      const yearlyValues: number[] = [];

      // Simula mês a mês
      for (let month = 1; month <= totalMonths; month++) {
        // 1. Gera retorno anual aleatório para este ano
        const yearIndex = Math.floor((month - 1) / 12);
        const isFirstMonthOfYear = month % 12 === 1;

        let annualReturn: number;
        if (isFirstMonthOfYear || month === 1) {
          // Gera novo retorno no início de cada ano
          annualReturn = generateLognormalReturn(meanReturn, volatility);
        } else {
          // Usa o retorno do ano atual (já gerado)
          annualReturn = yearlyValues[yearIndex] || 0;
        }

        const monthlyRate = Math.pow(1 + annualReturn, 1/12) - 1;

        // 2. Aplica carregamento
        const netContribution = monthlyContribution * (1 - loadingFee);
        balance += netContribution;
        totalContributions += netContribution;

        // 3. Aplica taxa de administração (anual, pro-rata mensal)
        balance *= (1 - adminFee / 12);

        // 4. Aplica juros compostos
        balance *= (1 + monthlyRate);

        // 5. Registra valor ao final do ano
        if (month % 12 === 0) {
          yearlyValues.push(balance);
        }
      }

      // Calcula IR (tabela regressiva)
      const irRate = getRegressiveIRRate(totalMonths);
      let taxBase: number;

      if (productType === 'PGBL') {
        taxBase = balance; // IR sobre tudo
      } else {
        taxBase = balance - totalContributions; // IR só sobre rendimentos
      }

      const irAmount = taxBase * irRate;
      const afterTaxValue = balance - irAmount;

      allPaths.push({
        futureValue: balance,
        afterTaxValue,
        yearlyValues,
      });
    }

    // Ordena por valor final (após IR)
    const sortedValues = allPaths
      .map(p => p.afterTaxValue)
      .sort((a, b) => a - b);

    return {
      percentile5: sortedValues[Math.floor(numSimulations * 0.05)],
      percentile50: sortedValues[Math.floor(numSimulations * 0.50)],
      percentile95: sortedValues[Math.floor(numSimulations * 0.95)],
      mean: sortedValues.reduce((a, b) => a + b, 0) / numSimulations,
      allPaths,
    };
  }

  /**
   * Tabela regressiva de IR (mesma função do calculations.ts)
   */
  function getRegressiveIRRate(months: number): number {
    if (months <= 24) return 0.35;
    if (months <= 48) return 0.30;
    if (months <= 72) return 0.25;
    if (months <= 96) return 0.20;
    if (months <= 120) return 0.15;
    return 0.10;
  }

/**
 * Interface para dados do gráfico de bandas
 */
export interface MonteCarloChartData {
  year: number;
  p5: number;   // 5º percentil
  p25: number;  // 25º percentil
  p50: number;  // 50º percentil (mediana)
  p75: number;  // 75º percentil
  p95: number;  // 95º percentil
}

/**
 * Processa resultados do Monte Carlo para gráfico de bandas
 * Calcula percentis ano a ano
 */
export function processMonteCarloForChart(results: MonteCarloResults): MonteCarloChartData[] {
  const { allPaths } = results;

  if (allPaths.length === 0) return [];

  // Descobre quantos anos temos
  const numYears = allPaths[0].yearlyValues.length;
  const chartData: MonteCarloChartData[] = [];

  // Para cada ano
  for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
    // Coleta valores desse ano de todos os caminhos
    const valuesThisYear = allPaths.map(path => path.yearlyValues[yearIndex]);

    // Ordena para calcular percentis
    const sorted = valuesThisYear.sort((a, b) => a - b);
    const n = sorted.length;

    chartData.push({
      year: yearIndex + 1,
      p5: sorted[Math.floor(n * 0.05)],
      p25: sorted[Math.floor(n * 0.25)],
      p50: sorted[Math.floor(n * 0.50)],
      p75: sorted[Math.floor(n * 0.75)],
      p95: sorted[Math.floor(n * 0.95)],
    });
  }

  return chartData;
}