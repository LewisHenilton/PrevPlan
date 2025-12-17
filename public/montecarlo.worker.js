// Web Worker para Monte Carlo
  // Este arquivo roda em thread separada

  /**
   * Gera número aleatório (distribuição normal)
   */
  function randomNormal() {
    const u1 = Math.random();
    const u2 = Math.random();
    const r = Math.sqrt(-2.0 * Math.log(u1 + 1e-10));
    const theta = 2.0 * Math.PI * u2;
    return r * Math.cos(theta);
  }

  /**
   * Gera retorno lognormal
   */
  function generateLognormalReturn(meanReturn, volatility) {
    const z = randomNormal();
    const drift = meanReturn - (volatility * volatility) / 2;
    const annualReturn = Math.exp(drift + volatility * z) - 1;
    return annualReturn;
  }

  /**
   * Tabela regressiva de IR
   */
  function getRegressiveIRRate(months) {
    if (months <= 24) return 0.35;
    if (months <= 48) return 0.30;
    if (months <= 72) return 0.25;
    if (months <= 96) return 0.20;
    if (months <= 120) return 0.15;
    return 0.10;
  }

  /**
   * Executa Monte Carlo (cópia da função do montecarlo.ts)
   */
  function runMonteCarloSimulation(params) {
    const {
      monthlyContribution,
      meanReturn,
      volatility,
      years,
      adminFee,
      loadingFee,
      productType,
      numSimulations = 1000,
    } = params;

    const allPaths = [];
    const totalMonths = years * 12;

    // Roda N simulações
    for (let sim = 0; sim < numSimulations; sim++) {
      let balance = 0;
      let totalContributions = 0;
      const yearlyValues = [];
      let currentYearReturn = 0;

      // Simula mês a mês
      for (let month = 1; month <= totalMonths; month++) {
        const yearIndex = Math.floor((month - 1) / 12);
        const isFirstMonthOfYear = month % 12 === 1;

        // Gera novo retorno no início de cada ano
        if (isFirstMonthOfYear || month === 1) {
          currentYearReturn = generateLognormalReturn(meanReturn, volatility);
        }

        const monthlyRate = Math.pow(1 + currentYearReturn, 1/12) - 1;

        // Aplica carregamento
        const netContribution = monthlyContribution * (1 - loadingFee);
        balance += netContribution;
        totalContributions += netContribution;

        // Aplica taxa de administração
        balance *= (1 - adminFee / 12);

        // Aplica juros compostos
        balance *= (1 + monthlyRate);

        // Registra valor ao final do ano
        if (month % 12 === 0) {
          yearlyValues.push(balance);
        }
      }

      // Calcula IR
      const irRate = getRegressiveIRRate(totalMonths);
      let taxBase;

      if (productType === 'PGBL') {
        taxBase = balance;
      } else {
        taxBase = balance - totalContributions;
      }

      const irAmount = taxBase * irRate;
      const afterTaxValue = balance - irAmount;

      allPaths.push({
        futureValue: balance,
        afterTaxValue,
        yearlyValues,
      });

      // Envia progresso a cada 10% (para barra de progresso futura)
      if (sim % Math.floor(numSimulations / 10) === 0) {
        self.postMessage({
          type: 'progress',
          progress: (sim / numSimulations) * 100,
        });
      }
    }

    // Ordena por valor final
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

  // Escuta mensagens da thread principal
  self.addEventListener('message', (event) => {
    const { params } = event.data;

    try {
      // Executa simulação
      const results = runMonteCarloSimulation(params);

      // Envia resultado de volta
      self.postMessage({
        type: 'complete',
        results,
      });
    } catch (error) {
      // Envia erro
      self.postMessage({
        type: 'error',
        error: error.message,
      });
    }
  });

