'use client';

import {useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import type { SimulationResults } from '@/types/simulation';
import { useSearchParams, useRouter } from 'next/navigation';
import SimulationChart from '@/components/charts/SimulationChart';

//salvar no local storage
import {useEffect} from 'react';
const STORAGE_KEY= 'prevplan:simulation:v1';

// Schema de validação
const simulationSchema = z.object({
  monthlyContribution: z.number().min(0, 'Valor deve ser positivo'),
  annualReturn: z.number().min(0, 'Taxa deve ser positiva').max(50, 'Taxa muito alta'),
  years: z.number().min(1, 'Mínimo 1 ano').max(50, 'Máximo 50 anos'),
  currentAge: z.number().min(18, 'Idade mínima 18 anos').max(80, 'Idade máxima 80 anos'),
  productType: z.enum(['PGBL', 'VGBL']),
  adminFee: z.number().min(0, 'Taxa deve ser positiva').max(10, 'Taxa muito alta'),
  loadingFee: z.number().min(0, 'Taxa deve ser positiva').max(10,'Taxa muito alta'),
});

type SimulationData = z.infer<typeof simulationSchema>;

export default function SimulationForm() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SimulationData>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      monthlyContribution: 1000,
      annualReturn: 6,
      years: 30,
      currentAge: 30,
      productType: 'PGBL',
      adminFee: 0.5,
      loadingFee: 0,
    },
    mode: 'onChange'
  });


  const calculateSimulation = (data:SimulationData): SimulationResults => {
    const {monthlyContribution, annualReturn, years, currentAge} = data
    
    //Juros
    const monthlyRate = annualReturn/100/12;
    const totalMonths = years * 12;
    const totalContributions = monthlyContribution *totalMonths;

    //Valor Futuro
    const futureValue =
     monthlyRate === 0
      ? monthlyContribution * totalMonths
      : monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    //Rentabilidade total
    const totalReturn = futureValue - totalContributions;
    
    //Possivel mudança no futuro identificar contextos de taxação 15% esta ultra simplificado
    const taxRate=0.15;
    const afterTaxValue = futureValue *(1-taxRate);

    //Aposentadoria - idade final
    const retirementAge= currentAge + years;
    return {
        totalContributions,
        futureValue,
        totalReturn,
        afterTaxValue,
        retirementAge,
        monthlyRate,
        totalMonths,
    };
  };
    

    const [results, setResults] = useState<SimulationResults| null>(null);
    const onSubmit = (data: SimulationData) => {
        console.log('Dados da simulação:', data);
    
        const calculatedResults = calculateSimulation(data);

        setResults(calculatedResults);
        
        console.log('Resultados da simulação:', calculatedResults);
        console.log('Total de aportes', calculatedResults.totalContributions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        console.log('Valor futuro:', calculatedResults.futureValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        console.log('Rentabilidade total:', calculatedResults.totalReturn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        console.log('Valor líquido (após IR):', calculatedResults.afterTaxValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        console.log('Idade na aposentadoria:', calculatedResults.retirementAge + ' anos');

    };

    const [whatIfReturn, setWhatIfReturn] = useState<number | null>(null);
    const currentValues = watch();
    
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {

      if(isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentValues));
      } catch {}
     }
    }, [currentValues, isInitialized]);

    const previewAnnualReturn = whatIfReturn ?? currentValues?.annualReturn ?? 0;
    const previewResults = currentValues?.monthlyContribution && currentValues?.years
    ? calculateSimulation({
        monthlyContribution: Number(currentValues.monthlyContribution),
        annualReturn: Number(previewAnnualReturn),
        years: Number(currentValues.years),
        currentAge: Number(currentValues.currentAge || 18),
        })
    : null;
    
    useEffect(()=> {
      const params =new URLSearchParams(window.location.search);
        const qs = {
          monthlyContribution: params.get('mc'),
          annualReturn: params.get('ar'),
          years: params.get('y'),
          currentAge: params.get('age'),
        };
        if(qs.monthlyContribution) setValue('monthlyContribution', Number(qs.monthlyContribution));
        if(qs.annualReturn) setValue('annualReturn', Number(qs.annualReturn));
        if(qs.years) setValue('years', Number(qs.years));
        if(qs.currentAge) setValue('currentAge', Number(qs.currentAge));
      
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return;
        const saved = JSON.parse(raw) as Partial<SimulationData>;
        if(saved.monthlyContribution !==undefined) setValue('monthlyContribution',Number(saved.monthlyContribution));
        if(saved.annualReturn !==undefined) setValue('annualReturn',Number(saved.annualReturn));
        if (saved.years !== undefined) setValue('years', Number(saved.years));
        if (saved.currentAge !== undefined) setValue('currentAge', Number(saved.currentAge));
      } catch {}
      setIsInitialized(true);
    }, []);

    return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Simulador Previdenciário
        </h1>
        <p className="text-gray-600">
          Calcule seu futuro financeiro com simulações precisas
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Valor Mensal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-2" />
            Aporte Mensal (R$)
          </label>
          <input
            type="number"
            {...register('monthlyContribution', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Ex: 1500"
          />
          {errors.monthlyContribution && (
            <p className="text-red-500 text-sm mt-1">{errors.monthlyContribution.message}</p>
          )}
        </div>

        {/* Taxa de Retorno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TrendingUp className="inline w-4 h-4 mr-2" />
            Taxa de Retorno Anual (%)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('annualReturn', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Ex: 12.3"
          />
          {errors.annualReturn && (
            <p className="text-red-500 text-sm mt-1">{errors.annualReturn.message}</p>
          )}
        </div>
        {/* Tempo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-2" />
            Tempo de Contribuição (anos)
          </label>
          <input
            type="number"
            {...register('years', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Ex: 30"
          />
          {errors.years && (
            <p className="text-red-500 text-sm mt-1">{errors.years.message}</p>
          )}
        </div>

        {/* Idade Atual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idade Atual
          </label>
          <input
            type="number"
            {...register('currentAge', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Ex: 18"
          />
          {errors.currentAge && (
            <p className="text-red-500 text-sm mt-1">{errors.currentAge.message}</p>
          )}
        </div>
        {/*Taxa de adm*/}
        <div>
          <label className ="block text-sm font-medium text-gray-700 mb-2">
            Taxa de Administração Mensal (%)
          </label>
          <input
            type ="number"
            step = "0.01"
            {...register('adminFee', {valueAsNumber:true})}
            className ="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder = "Ex: 0.5"
          />
          {errors.adminFee && (
            <p className= "text-red-500 text-sm mt-1">{errors.adminFee.message}</p>
          )}
        </div>
        {/*Taxa de carreg*/}
        <div>
          <label
            className = "block text-sm font-medium text-gray-700 mb-2">
              Taxa de Carregamento (%)
            </label>
            <input
              type = "number"
              step = "0.01"
              className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder = "Ex 0"
            />
            {errors.loadingFee && (
              <p className= "text-red-500 text-sm mt-1">{errors.loadingFee.message}</p>
            )}
        </div>
        {/*Tipo de produt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Produto
          </label>
          <select
            {...register('productType')}
            className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
              <option value = "PGBL">PGBL</option>
              <option value = "VGBL">PGBL</option>
            </select>
        </div>
        {/* Botão */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center cursor-pointer"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calcular Simulação
        </button>
      </form>
      {/*Resultados (results && vai mostrar só se tiver resultados)*/}
    {results && (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Resultados da Simulação
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total de Aportes */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total de Aportes</h3>
            <p className="text-2xl font-bold text-blue-600">
              {results.totalContributions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* Valor Futuro */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Valor Futuro</h3>
            <p className="text-2xl font-bold text-green-600">
              {results.futureValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* Rentabilidade Total */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Rentabilidade Total</h3>
            <p className="text-2xl font-bold text-purple-600">
              {results.totalReturn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* Valor Líquido */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Valor Líquido (após IR)</h3>
            <p className="text-2xl font-bold text-orange-600">
              {results.afterTaxValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Idade na Aposentadoria */}
        <div className="mt-4 text-center">
          <p className="text-lg text-gray-700">
            <span className="font-semibold">Idade na aposentadoria:</span> {results.retirementAge} anos
          </p>
        </div>

        {/* What-if: ajuste rápido da taxa de retorno */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Teste Cenários (What-if)
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Retorno (%): <span className="font-semibold text-blue-600">{previewAnnualReturn.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={30}
              step={0.1}
              className="w-full cursor-pointer"
              value={previewAnnualReturn}
              onChange={(e) => setWhatIfReturn(parseFloat(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Arraste para testar diferentes cenários de rentabilidade
            </p>
          </div>

          {/* Prévia rápida baseada no What-if */}
          {previewResults && (
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 border rounded-md p-3">
                <p className="text-xs text-gray-600">Aportes</p>
                <p className="text-sm font-semibold text-blue-600">
                  {previewResults.totalContributions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="bg-gray-50 border rounded-md p-3">
                <p className="text-xs text-gray-600">Valor Futuro (What-if)</p>
                <p className="text-sm font-semibold text-green-600">
                  {previewResults.futureValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="bg-gray-50 border rounded-md p-3">
                <p className="text-xs text-gray-600">Rentabilidade (What-if)</p>
                <p className="text-sm font-semibold text-amber-600">
                  {(previewResults.futureValue - previewResults.totalContributions).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          )}

          {/* Botão Aplicar What-if */}
          <div className="text-center">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 cursor-pointer"
              onClick={() => {
                setValue('annualReturn', Number(previewAnnualReturn));
                setWhatIfReturn(null);
              }}
            >
              Aplicar What-if
            </button>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 inline-flex items-center rounded-md bg-gray-700 text-white px-4 py-2 text-sm hover:bg-gray-800 cursor-pointer" 
          onClick={() => {
            const q = new URLSearchParams({
              mc: String(currentValues.monthlyContribution ?? ''),
              ar: String(currentValues.annualReturn ?? ''),
              y: String(currentValues.years ?? ''),
              age: String(currentValues.currentAge ?? ''),
            });
            const url = `${window.location.pathname}?${q.toString()}`;
            navigator.clipboard.writeText(url).then(() =>{
              alert('Link copiado para a area de transferencia!');
            });
            window.history.replaceState(null, '', url);
          }}
        >
          Compartilhar cenário
        </button>      
        {/* Gráfico */}
        {(previewResults || results) && (
          <div className="mt-8">
            <SimulationChart results={(previewResults || results)!} />
          </div>
        )}
      </div>
    )}
    </div>
  );
}