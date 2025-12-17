'use client';

  import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
  import type { YearlyEvolution } from '@/types/simulation';

  interface StackedAreaChartProps {
    data: YearlyEvolution[];
  }

  export default function StackedAreaChart({ data }: StackedAreaChartProps) {
    // Formata valores para mostrar no tooltip
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Composição do Patrimônio ao Longo do Tempo
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Evolução dos seus aportes e da rentabilidade acumulada
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

            {/* Área dos Aportes (base) */}
            <Area
              type="monotone"
              dataKey="totalContributions"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              name="Aportes Acumulados"
            />

            {/* Área da Rentabilidade (empilhada sobre aportes) */}
            <Area
              type="monotone"
              dataKey="totalReturn"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              name="Rentabilidade"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Seu dinheiro (aportes)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Lucro (rentabilidade)</span>
          </div>
        </div>
      </div>
    );
  }