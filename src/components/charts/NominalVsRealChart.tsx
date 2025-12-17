'use client';

  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
  import type { YearlyEvolution } from '@/types/simulation';

  interface NominalVsRealChartProps {
    data: YearlyEvolution[];
    inflationRate: number;
  }

  export default function NominalVsRealChart({ data, inflationRate }: NominalVsRealChartProps) {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    // Calcula a "perda" percentual no último ano
    const lastYear = data[data.length - 1];
    const lossPercentage = ((lastYear.futureValue - lastYear.realValue) / lastYear.futureValue * 100).toFixed(1);

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💰 Valor Nominal vs Valor Real (Impacto da Inflação)
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Comparação entre o valor futuro e seu poder de compra real (em dinheiro de hoje)
        </p>
        <p className="text-sm text-amber-600 font-medium mb-4">
          ⚠️ Com {inflationRate.toFixed(2)}% de inflação ao ano, você "perde" {lossPercentage}% do poder de compra!
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              label={{ value: 'Anos', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Valor', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Ano ${label}`}
            />
            <Legend />

            {/* Linha Nominal (verde) */}
            <Line
              type="monotone"
              dataKey="futureValue"
              stroke="#10B981"
              strokeWidth={3}
              dot={false}
              name="Valor Nominal (futuro)"
            />

            {/* Linha Real (vermelho) */}
            <Line
              type="monotone"
              dataKey="realValue"
              stroke="#EF4444"
              strokeWidth={3}
              dot={false}
              name="Valor Real (poder de compra hoje)"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Valor Nominal (no papel)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(lastYear.futureValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">O número que você verá na conta</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Valor Real (poder de compra)</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(lastYear.realValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">O que realmente vale em dinheiro de hoje</p>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
          <p className="text-sm text-gray-700">
            💡 <strong>Dica:</strong> Quanto maior a inflação, maior a distância entre as linhas.
            Por isso é importante investir em ativos que rendam <strong>acima da inflação</strong>!
          </p>
        </div>
      </div>
    );
  }