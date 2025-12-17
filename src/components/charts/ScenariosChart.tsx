'use client';

  import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
  import { calculateSimulation } from '@/lib/calculations';
  import type { SimulationResults } from '@/types/simulation';

  interface ScenariosChartProps {
    baseResults: SimulationResults;
    formData: {
      monthlyContribution: number;
      annualReturn: number;
      years: number;
      currentAge: number;
      adminFee: number;
      loadingFee: number;
      productType: 'PGBL' | 'VGBL';
      inflation?: number;
    };
  }

  export default function ScenariosChart({ baseResults, formData }: ScenariosChartProps) {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    // Calcula cenários
    const pessimisticReturn = Math.max(0, formData.annualReturn - 2);
    const optimisticReturn = formData.annualReturn + 2;

    const pessimisticResults = calculateSimulation({
      ...formData,
      annualReturn: pessimisticReturn,
    });

    const optimisticResults = calculateSimulation({
      ...formData,
      annualReturn: optimisticReturn,
    });

    // Dados para o gráfico
    const data = [
      {
        name: 'Pessimista',
        value: pessimisticResults.afterTaxValue,
        return: pessimisticReturn,
        color: '#EF4444',
      },
      {
        name: 'Base',
        value: baseResults.afterTaxValue,
        return: formData.annualReturn,
        color: '#3B82F6',
      },
      {
        name: 'Otimista',
        value: optimisticResults.afterTaxValue,
        return: optimisticReturn,
        color: '#10B981',
      },
    ];

    // Calcula diferenças percentuais
    const pessimisticDiff = ((pessimisticResults.afterTaxValue - baseResults.afterTaxValue) / baseResults.afterTaxValue * 100).toFixed(1);
    const optimisticDiff = ((optimisticResults.afterTaxValue - baseResults.afterTaxValue) / baseResults.afterTaxValue * 100).toFixed(1);

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Análise de Cenários (Sensibilidade da Taxa de Retorno)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Compare o resultado com diferentes taxas de retorno (±2%)
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 14 }}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Valor Líquido', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name, props) => {
                const returnRate = props.payload.return;
                return [formatCurrency(value), `Taxa: ${returnRate}% a.a.`];
              }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar
              dataKey="value"
              name="Valor Líquido (após IR)"
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pessimista */}
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🔴 Pessimista</span>
              <span className="text-xs font-semibold text-red-600">{pessimisticReturn}% a.a.</span>
            </div>
            <p className="text-xl font-bold text-red-700 mb-1">
              {formatCurrency(pessimisticResults.afterTaxValue)}
            </p>
            <p className="text-xs text-red-600">
              {pessimisticDiff}% vs Base
            </p>
          </div>

          {/* Base */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🔵 Base (Atual)</span>
              <span className="text-xs font-semibold text-blue-600">{formData.annualReturn}% a.a.</span>
            </div>
            <p className="text-xl font-bold text-blue-700 mb-1">
              {formatCurrency(baseResults.afterTaxValue)}
            </p>
            <p className="text-xs text-blue-600">
              Cenário esperado
            </p>
          </div>

          {/* Otimista */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🟢 Otimista</span>
              <span className="text-xs font-semibold text-green-600">{optimisticReturn}% a.a.</span>
            </div>
            <p className="text-xl font-bold text-green-700 mb-1">
              {formatCurrency(optimisticResults.afterTaxValue)}
            </p>
            <p className="text-xs text-green-600">
              +{optimisticDiff}% vs Base
            </p>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-gray-700">
            💡 <strong>Insight:</strong> Uma variação de apenas 2% na taxa de retorno pode gerar uma
            diferença de <strong>{Math.abs(parseFloat(optimisticDiff) - parseFloat(pessimisticDiff)).toFixed(1)}%</strong> no
            resultado final! Por isso é importante escolher investimentos com bom histórico.
          </p>
        </div>
      </div>
    );
  }