'use client';

  import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
  import type { MonteCarloChartData } from '@/lib/montecarlo';

  interface MonteCarloChartProps {
    data: MonteCarloChartData[];
  }

  export default function MonteCarloChart({ data }: MonteCarloChartProps) {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const formatYAxis = (value: number) => {
      if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
      }
      return `R$ ${(value / 1000).toFixed(0)}k`;
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 Evolução Monte Carlo (1000 Cenários)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Bandas de confiança: quanto maior a banda, maior a incerteza
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

            <XAxis
              dataKey="year"
              label={{ value: 'Anos', position: 'insideBottom', offset: -5 }}
              stroke="#666"
            />

            <YAxis
              tickFormatter={formatYAxis}
              label={{ value: 'Valor Acumulado', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />

            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '10px'
              }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
            />

            {/* Banda P5-P95 (90% dos casos) - mais clara */}
            <Area
              type="monotone"
              dataKey="p95"
              fill="#c7d2fe"
              stroke="none"
              fillOpacity={0.3}
              name="P95 (melhor 5%)"
            />
            <Area
              type="monotone"
              dataKey="p5"
              fill="#ffffff"
              stroke="none"
              name="P5 (pior 5%)"
            />

            {/* Banda P25-P75 (50% dos casos) - mais escura */}
            <Area
              type="monotone"
              dataKey="p75"
              fill="#818cf8"
              stroke="none"
              fillOpacity={0.4}
              name="P75"
            />
            <Area
              type="monotone"
              dataKey="p25"
              fill="#ffffff"
              stroke="none"
              name="P25"
            />

            {/* Linha da mediana (P50) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={false}
              name="Mediana (P50)"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legenda explicativa */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-200 rounded"></div>
            <span className="text-gray-700">Banda clara: 90% dos casos (P5-P95)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-400 rounded"></div>
            <span className="text-gray-700">Banda escura: 50% dos casos (P25-P75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-600 rounded"></div>
            <span className="text-gray-700">Linha roxa: Mediana (P50)</span>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-gray-700">
            💡 <strong>Como interpretar:</strong> A linha roxa é o resultado mais provável.
            As bandas mostram a incerteza - quanto mais largas, maior o risco.
            Há 90% de chance de ficar dentro da banda clara.
          </p>
        </div>
      </div>
    );
  }