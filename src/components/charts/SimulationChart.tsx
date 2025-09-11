'use client';

import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

import type { SimulationResults } from '@/types/simulation';


interface SimulationChartProps{
    results: SimulationResults;
}



export default function SimulationChart({ results }: SimulationChartProps){



    const pieData =[
        {name: 'Aportes', value: results.totalContributions, color: '#3B82F6'},
        {name: 'Rentabilidade', value: results.totalReturn, color: '#10B981'},
    ];

    const lineData: { year: number; contributions: number; futureValue: number; profit: number }[] = [];
    const monthlyContribution = results.totalContributions / results.totalMonths;

    for(let i=0; i<=results.totalMonths; i+=12){
        const year = i/12;
        const contributions = monthlyContribution*i;
        const futureValue =
         results.monthlyRate === 0
          ? monthlyContribution * i
          : monthlyContribution * ((Math.pow(1 + results.monthlyRate, i) - 1) / results.monthlyRate);
    
        lineData.push({
            year,
            contributions,
            futureValue,
            profit: futureValue - contributions,
          });
    
    
    }
    return (
            <div className="mt-8 space-y-8">
              {/* Gráfico de Pizza */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Composição do Montante Final
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name }) => name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
          
              {/* Gráfico de Linha */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Evolução do Investimento (anual)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tickFormatter={(y) => `${y}º`} />
                      <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number, name) => [
                          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                          name === 'contributions'
                            ? 'Aportes'
                            : name === 'futureValue'
                            ? 'Valor Futuro'
                            : 'Rentabilidade',
                        ]}
                        labelFormatter={(label) => `Ano ${label}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="contributions" stroke="#3B82F6" strokeWidth={2} name="Aportes" />
                      <Line type="monotone" dataKey="futureValue" stroke="#10B981" strokeWidth={2} name="Valor Futuro" />
                      <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} name="Rentabilidade" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );

}