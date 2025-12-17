export interface SimulationResults {
  totalContributions: number;
  futureValue: number;
  totalReturn: number;
  afterTaxValue: number;
  retirementAge: number;
  monthlyRate: number;
  totalMonths: number;
  realFutureValue?: number;      // ← ADICIONE
  realAfterTaxValue?: number;    // ← ADICIONE
  inflationRate?: number;
  yearlyEvolution?: YearlyEvolution[]; 
}

export interface YearlyEvolution{
  year: number;
  totalContributions: number;
  futureValue: number;
  totalReturn: number;
  realValue: number;
}

