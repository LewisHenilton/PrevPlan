'use client';

  import { calculateSimulation } from '@/lib/calculations';
  import {fundosPrevidencia, getBenchmarks, type FundoPrevidencia} from '@/data/fundos';
  interface FundosComparatorProps {
    baseData: {
      monthlyContribution: number;
      years: number;
      currentAge: number;
      inflation?: number;
    };
    selic: number;
    ipca: number;
  }

  interface FundoComparison {
    fundo: FundoPrevidencia;
    result: {
      futureValue: number;
      afterTaxValue: number;
      totalReturn: number;
    };
  }

  export default function FundosComparator({ baseData, selic, ipca }: FundosComparatorProps) {
    // Calcula simulação para cada fundo
    const allProducts = [...fundosPrevidencia, ...getBenchmarks(selic, ipca)];
    const comparisons: FundoComparison[] = allProducts.map(fundo => {
      const result = calculateSimulation({
        monthlyContribution: baseData.monthlyContribution,
        annualReturn: fundo.rentabilidadeMedia,
        years: baseData.years,
        currentAge: baseData.currentAge,
        adminFee: fundo.taxaAdmin,
        loadingFee: fundo.taxaCarregamento,
        productType: fundo.tipo,
        inflation: baseData.inflation,
      });

      return {
        fundo,
        result: {
          futureValue: result.futureValue,
          afterTaxValue: result.afterTaxValue,
          totalReturn: result.totalReturn,
        },
      };
    });

    // Ordena por melhor resultado (maior valor líquido)
    const sortedComparisons = [...comparisons].sort((a, b) =>
      b.result.afterTaxValue - a.result.afterTaxValue
    );

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    // Melhor e pior resultado
    const bestFundo = sortedComparisons[0];
    const worstFundo = sortedComparisons[sortedComparisons.length - 1];
    const difference = bestFundo.result.afterTaxValue - worstFundo.result.afterTaxValue;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🏆 Comparador de Fundos Reais
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Simulação com seus parâmetros (R$ {baseData.monthlyContribution}/mês por {baseData.years} anos)
        </p>

        {/* Alerta de Diferença */}
        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400 mb-6">
          <p className="text-sm text-gray-700">
            💰 <strong>Diferença entre o melhor e o pior:</strong> {formatCurrency(difference)} ({((difference / worstFundo.result.afterTaxValue) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Escolher o fundo certo pode valer <strong>dezenas de milhares de reais</strong>!
          </p>
        </div>

        {/* Tabela Comparativa */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Posição</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fundo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Banco</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Taxa Admin</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Rent. Média</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Valor Líquido</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">vs Melhor</th>
              </tr>
            </thead>
            <tbody>
              {sortedComparisons.map((comparison, index) => {
                const isFirst = index === 0;
                const isLast = index === sortedComparisons.length - 1;
                const diffFromBest = bestFundo.result.afterTaxValue - comparison.result.afterTaxValue;
                const diffPercent = ((diffFromBest / bestFundo.result.afterTaxValue) * 100).toFixed(1);

                return (
                  <tr
                    key={comparison.fundo.id}
                    className={`
                      border-b border-gray-200 hover:bg-gray-50 transition-colors
                      ${isFirst ? 'bg-green-50 font-semibold' : ''}
                      ${isLast ? 'bg-red-50' : ''}
                    `}
                  >
                    {/* Posição */}
                    <td className="px-4 py-3">
                      {isFirst && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-gray-500">{index + 1}º</span>}
                    </td>

                    {/* Fundo */}
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900">{comparison.fundo.nome}</p>
                        {comparison.fundo.taxaCarregamento > 0 && (
                          <p className="text-xs text-amber-600">⚠️ Carregamento: {comparison.fundo.taxaCarregamento}%</p>
                        )}
                      </div>
                    </td>

                    {/* Banco */}
                    <td className="px-4 py-3 text-gray-700">
                      {comparison.fundo.banco}
                      {comparison.fundo.id.startsWith('benchmark-') && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          📊 Benchmark
                        </span>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3 text-center">
                      <span className={`
                        px-2 py-1 rounded text-xs font-semibold
                        ${comparison.fundo.tipo === 'VGBL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                      `}>
                        {comparison.fundo.tipo}
                      </span>
                    </td>

                    {/* Taxa Admin */}
                    <td className="px-4 py-3 text-right text-gray-700">
                      {comparison.fundo.taxaAdmin}%
                    </td>

                    {/* Rentabilidade */}
                    <td className="px-4 py-3 text-right text-gray-700">
                      {comparison.fundo.rentabilidadeMedia}%
                    </td>

                    {/* Valor Líquido */}
                    <td className="px-4 py-3 text-right">
                      <span className={`
                        font-semibold
                        ${isFirst ? 'text-green-700' : isLast ? 'text-red-700' : 'text-gray-900'}
                      `}>
                        {formatCurrency(comparison.result.afterTaxValue)}
                      </span>
                    </td>

                    {/* Diferença vs Melhor */}
                    <td className="px-4 py-3 text-right">
                      {isFirst ? (
                        <span className="text-green-600 font-semibold">🏆 Melhor</span>
                      ) : (
                        <span className="text-red-600 text-xs">
                          -{formatCurrency(diffFromBest)} (-{diffPercent}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-1">🏆 Melhor Opção</p>
            <p className="text-sm font-bold text-green-700">{bestFundo.fundo.nome}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(bestFundo.result.afterTaxValue)}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-xs text-gray-600 mb-1">⚠️ Pior Opção</p>
            <p className="text-sm font-bold text-red-700">{worstFundo.fundo.nome}</p>
            <p className="text-xs text-gray-600 mt-1">{formatCurrency(worstFundo.result.afterTaxValue)}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">💡 Economia Possível</p>
            <p className="text-sm font-bold text-blue-700">{formatCurrency(difference)}</p>
            <p className="text-xs text-gray-600 mt-1">Escolhendo o melhor fundo</p>
          </div>
        </div>
      </div>
    );
  }