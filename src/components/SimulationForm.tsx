'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { SimulationResults } from '@/types/simulation';
import SimulationChart from '@/components/charts/SimulationChart';
import NominalVsRealChart from './charts/NominalVsRealChart';
import StackedAreaChart from './charts/StackedAreaChart';
import ScenariosChart from './charts/ScenariosChart';
import FundosComparator from './FundosComparator';
import MonteCarloChart from './charts/MonteCarloChart';
import { Button, Card } from '@/components/ui';
import { calculateSimulation } from '@/lib/calculations';
import { useBacenData } from '@/hooks/useBacenData';
import { fundosPrevidencia, type FundoPrevidencia } from '@/data/fundos';
import { processMonteCarloForChart } from '@/lib/montecarlo';
import { useMonteCarloWorker } from '@/hooks/useMonteCarloWorker'; // ← ADICIONAR

const STORAGE_KEY = 'prevplan:simulation:v1';
const HISTORY_STORAGE_KEY = 'prevplan:simulations:history:v1'; 
interface SavedSimulation {
  id: string;
  name: string;
  savedAt: string;
  data: SimulationData;
}
// Schema de validação
const simulationSchema = z.object({
  monthlyContribution: z.number().min(0, 'Valor deve ser positivo'),
  annualReturn: z.number().min(0, 'Taxa deve ser positiva').max(50, 'Taxa muito alta'),
  years: z.number().min(1, 'Mínimo 1 ano').max(50, 'Máximo 50 anos'),
  currentAge: z.number().min(18, 'Idade mínima 18 anos').max(80, 'Idade máxima 80 anos'),
  productType: z.enum(['PGBL', 'VGBL']),
  adminFee: z.number().min(0, 'Taxa deve ser positiva').max(5, 'Taxa muito alta para anual'),
  loadingFee: z.number().min(0, 'Taxa deve ser positiva').max(10,'Taxa muito alta'),
  inflation: z.number().min(0, 'Inflação não pode ser negativa').max(20, 'Inflação muito alta').optional(),
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
      inflation: 4,
    },
    mode: 'onChange'
  });
    
    const [results, setResults] = useState<SimulationResults| null>(null);
    const onSubmit = (data: SimulationData) => {
        const calculatedResults = calculateSimulation(data);
        setResults(calculatedResults);
    };
    const [whatIfReturn, setWhatIfReturn] = useState<number | null>(null);
    const [useSelicData, setUseSelicData] = useState(false);
    const [useIpcaData, setUseIpcaData] = useState(false);

    
    //funcai pra aplicar valores em fundo>
    const applyFundoPreset = (fundoId: string) => {
      const fundo = fundosPrevidencia.find(f => f.id === fundoId);
      if (!fundo) return;
  
      // Preenche todos os campos do formulário
      setValue('productType', fundo.tipo);
      setValue('adminFee', fundo.taxaAdmin);
      setValue('loadingFee', fundo.taxaCarregamento);
      setValue('annualReturn', fundo.rentabilidadeMedia);
  
      setSelectedFundo(fundoId);
    };
    
    const saveSimulation = () => {
      const currentValues = watch(); // Pega valores atuais do formulário
  
      if (!simulationName.trim()) {
        alert('Por favor, digite um nome para a simulação');
        return;
      }
  
      const newSimulation: SavedSimulation = {
        id: Date.now().toString(),
        name: simulationName.trim(),
        savedAt: new Date().toISOString(),
        data: currentValues as SimulationData,
      };
  
      const updatedHistory = [...savedSimulations, newSimulation];
      setSavedSimulations(updatedHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  
      setSimulationName(''); // Limpa o input
      alert(`✅ Simulação "${newSimulation.name}" salva com sucesso!`);
    };


    // Estados para histórico de simulações
    const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
    const [simulationName, setSimulationName] = useState<string>('');

    // Buscar dados do BACEN quando habilitado
    const { data: selicData, loading: selicLoading } = useBacenData('selic', useSelicData);
    const { data: ipcaData, loading: ipcaLoading } = useBacenData('ipca', useIpcaData);
    const [selectedFundo, setSelectedFundo] = useState<string>('');
    
    useEffect(() => {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setSavedSimulations(parsed);
        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
        }
      }
    }, []);
    
    const loadSimulation = (simulation: SavedSimulation) => {
      // Preenche todos os campos do formulário
      setValue('monthlyContribution', simulation.data.monthlyContribution);
      setValue('annualReturn', simulation.data.annualReturn);
      setValue('years', simulation.data.years);
      setValue('currentAge', simulation.data.currentAge);
      setValue('productType', simulation.data.productType);
      setValue('adminFee', simulation.data.adminFee);
      setValue('loadingFee', simulation.data.loadingFee);
      if (simulation.data.inflation !== undefined) {
        setValue('inflation', simulation.data.inflation);
      }
  
      alert(`✅ Simulação "${simulation.name}" carregada!`);
    };
  
    // Função para deletar simulação
    const deleteSimulation = (id: string) => {
      const simulationToDelete = savedSimulations.find(s => s.id === id);
  
      if (!simulationToDelete) return;
  
      const confirmed = confirm(`🗑️ Tem certeza que deseja deletar "${simulationToDelete.name}"?`);
  
      if (confirmed) {
        const updatedHistory = savedSimulations.filter(s => s.id !== id);
        setSavedSimulations(updatedHistory);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        alert(`✅ Simulação "${simulationToDelete.name}" deletada!`);
      }
    };
    const handleRunMonteCarlo = () => {
      const currentValues = watch();
  
      runSimulation({
        monthlyContribution: currentValues.monthlyContribution || 0,
        meanReturn: (currentValues.annualReturn || 6) / 100,
        volatility: 0.15, // 15% de volatilidade (pode ser configurável depois)
        years: currentValues.years || 30,
        currentAge: currentValues.currentAge || 30,
        adminFee: (currentValues.adminFee || 0) / 100,
        loadingFee: (currentValues.loadingFee || 0) / 100,
        productType: currentValues.productType || 'VGBL',
        numSimulations: 1000, // 1000 simulações!
      });
    };
    
    const printRef = useRef<HTMLDivElement>(null);
    
    //hook montecarlo
    const { results: mcResults, loading: mcLoading, progress: mcProgress, error: mcError, runSimulation } = useMonteCarloWorker();
    
    const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Simulação Previdência - ${new Date().toLocaleDateString('pt-BR')}`,
    });


    const currentValues = watch();
    useEffect(() => {
      if (selicData && !selicData.error && useSelicData) {
        setValue('annualReturn', selicData.value);
      }
    }, [selicData, useSelicData, setValue]);
  
    useEffect(() => {
      if (ipcaData && !ipcaData.error && useIpcaData) {
        setValue('inflation', ipcaData.value);
      }
    }, [ipcaData, useIpcaData, setValue]);

    
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
        productType: (currentValues.productType as 'PGBL' | 'VGBL') ?? 'PGBL',
        adminFee: Number(currentValues.adminFee ?? 0 ),
        loadingFee: Number(currentValues.loadingFee ?? 0 ),
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
        {/* Seletor de Fundos Conhecidos */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              🏦 Comparar com Fundos Reais
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione um fundo de banco conhecido para preencher automaticamente as taxas e rentabilidade média
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escolha um fundo:
                </label>
                <select
                  value={selectedFundo}
                  onChange={(e) => applyFundoPreset(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white cursor-pointer"
                >
                  <option value="">-- Selecione um fundo --</option>
                  {fundosPrevidencia.map((fundo) => (
                    <option key={fundo.id} value={fundo.id}>
                      {fundo.banco} - {fundo.nome} ({fundo.tipo})
                    </option>
                  ))}
                </select>
              </div>
              {/* Preview do Fundo Selecionado */}
              {selectedFundo && (
                <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                  {(() => {
                    const fundo = fundosPrevidencia.find(f => f.id === selectedFundo);
                    if (!fundo) return null;

                    return (
                      <>
                        <p className="text-sm font-semibold text-blue-700 mb-2">
                          {fundo.nome}
                        </p>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>🏦 <strong>Banco:</strong> {fundo.banco}</p>
                          <p>📋 <strong>Tipo:</strong> {fundo.tipo}</p>
                          <p>💰 <strong>Taxa Admin:</strong> {fundo.taxaAdmin}% a.a.</p>
                          <p>📊 <strong>Rent. Média:</strong> {fundo.rentabilidadeMedia}% a.a.</p>
                          {fundo.taxaCarregamento > 0 && (
                            <p className="text-amber-600">⚠️ <strong>Carregamento:</strong> {fundo.taxaCarregamento}%</p>
                          )}
                        </div>
                        {fundo.observacoes && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            💡 {fundo.observacoes}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
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
        {/* Checkbox: Usar Selic */}
        <div className="flex items-center gap-2 -mt-2">
          <input
            type="checkbox"
            id="useSelicData"
            checked={useSelicData}
            onChange={(e) => setUseSelicData(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="useSelicData" className="text-sm text-gray-600 cursor-pointer">
            📊 Usar Selic atual ({selicLoading ? '⏳ Carregando...' : selicData ? `${selicData.value}%` : 'clique para buscar'})
          </label>
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
            Taxa de Administração (% ao ano)
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
              {...register('loadingFee', {valueAsNumber: true})}
              className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder = "Ex 0"
            />
            {errors.loadingFee && (
              <p className= "text-red-500 text-sm mt-1">{errors.loadingFee.message}</p>
            )}
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              Inflação Anual (%)
            </label>
            <input
              type="number"
              step="0.1"
              {...register('inflation', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: 4.0"
            />
            {errors.inflation && (
              <p className="text-red-500 text-sm mt-1">{errors.inflation.message}</p>
            )}
        </div>
        {/* Checkbox: Usar IPCA */}
        <div className="flex items-center gap-2 -mt-2">
          <input
            type="checkbox"
            id="useIpcaData"
            checked={useIpcaData}
            onChange={(e) => setUseIpcaData(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="useIpcaData" className="text-sm text-gray-600 cursor-pointer">
            📈 Usar IPCA atual ({ipcaLoading ? '⏳ Carregando...' : ipcaData ? `${ipcaData.value.toFixed(2)}%` : 'clique para buscar'})
          </label>
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
              <option value = "VGBL">VGBL</option>
            </select>
        </div>
        {/* Botão */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calcular Simulação
        </Button>
      </form>
      {/* Lista de Simulações Salvas */}
      {savedSimulations.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📂 Simulações Salvas ({savedSimulations.length})
            </h3>

            <div className="space-y-3">
              {savedSimulations.map((sim) => (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{sim.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Salva em: {new Date(sim.savedAt).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>💰 R$ {sim.data.monthlyContribution}/mês</span>
                      <span>📅 {sim.data.years} anos</span>
                      <span>📈 {sim.data.annualReturn}% a.a.</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => loadSimulation(sim)}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      title="Carregar simulação"
                    >
                      📂 Carregar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSimulation(sim.id)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      title="Deletar simulação"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {savedSimulations.length > 0 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 Dica: Clique em "📂 Carregar" para preencher o formulário com valores salvos
              </p>
            )}
          </div>
        )}
      {/*Resultados (results && vai mostrar só se tiver resultados)*/}
    {results && (
      
      <div ref={printRef} className="mt-8 p-6 bg-gray-50 rounded-lg border">
        {/* Botões de ação (não aparecem na impressão) */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 print:hidden">
            {/* Input + Botão de Salvar */}
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                placeholder="Nome da simulação (ex: Plano Conservador)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={saveSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                💾 Salvar
              </button>
            </div>

            {/* Botão de Exportar PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              📄 Exportar PDF
            </button>
          </div>

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
        {results.realFutureValue && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Valor Real (Poder de Compra Hoje)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {results.realFutureValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          )}

        {results.realAfterTaxValue && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Líquido Real (Após IR e Inflação)</p>
              <p className="text-2xl font-bold text-amber-600">
                {results.realAfterTaxValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
        )}
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
        {/* Gráficos */}
        {(previewResults || results) && (
            <div className="mt-8 space-y-8">
              {/* Gráfico Original (Pizza + Linha) */}
              <SimulationChart results={(previewResults || results)!} />

              {/*Gráfico de Área Empilhada */}
              {results?.yearlyEvolution && results.yearlyEvolution.length > 0 && (
                <StackedAreaChart data={results.yearlyEvolution} />
              )}

              {/*Gráfico Nominal vs Real */}
              {results?.yearlyEvolution && results.yearlyEvolution.length > 0 && results.inflationRate && results.inflationRate > 0 && (
                <NominalVsRealChart
                  data={results.yearlyEvolution}
                  inflationRate={results.inflationRate}
                />
              )}
              {/* Monte Carlo Simulation */}
              <div className="mt-8">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      🎲 Simulação Monte Carlo
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Rode 1000 cenários com volatilidade de 15% para ver o melhor, pior e cenário mediano
                    </p>

                    {/* Botão para rodar */}
                    <Button
                      type="button"
                      onClick={handleRunMonteCarlo}
                      variant="purple"
                      size="lg"
                      fullWidth
                      loading={mcLoading}
                      disabled={mcLoading}
                    >
                      {mcLoading ? (
                        <>Rodando {mcProgress.toFixed(0)}%...</>
                      ) : (
                        <>🎲 Rodar Monte Carlo (1000 simulações)</>
                      )}
                    </Button>

                    {/* Erro */}
                    {mcError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">❌ Erro: {mcError}</p>
                      </div>
                    )}

                    {/* Resultados */}
                    {mcResults && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pior Caso (P5) */}
                        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                          <p className="text-xs text-gray-600 mb-1">😰 Pior Caso (P5)</p>
                          <p className="text-2xl font-bold text-red-700">
                            {mcResults.percentile5.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">5% dos cenários são piores que isso</p>
                        </div>

                        {/* Mediana (P50) */}
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">📊 Cenário Mediano (P50)</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {mcResults.percentile50.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Metade melhor, metade pior</p>
                        </div>

                        {/* Melhor Caso (P95) */}
                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                          <p className="text-xs text-gray-600 mb-1">🚀 Melhor Caso (P95)</p>
                          <p className="text-2xl font-bold text-green-700">
                            {mcResults.percentile95.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">5% dos cenários são melhores que isso</p>
                        </div>

                        {/* Média */}
                        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                          <p className="text-xs text-gray-600 mb-1">📈 Média de 1000 Simulações</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {mcResults.mean.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Expectativa matemática</p>
                        </div>
                      </div>
                    )}
                    {/* Gráfico de Bandas */}
                    {mcResults && (
                      <div className="mt-6">
                        <MonteCarloChart data={processMonteCarloForChart(mcResults)} />
                      </div>
                    )}
                    {/* Explicação */}
                    {mcResults && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-gray-700">
                          💡 <strong>Como interpretar:</strong> O P50 (mediana) é o resultado mais provável.
                          Há 90% de chance do resultado ficar entre P5 e P95.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              {/* Novo: Gráfico de Cenários (Análise de Sensibilidade) */}
              {results && (
                <ScenariosChart
                  baseResults={results}
                  formData={{
                    monthlyContribution: currentValues.monthlyContribution || 0,
                    annualReturn: currentValues.annualReturn || 0,
                    years: currentValues.years || 0,
                    currentAge: currentValues.currentAge || 0,
                    adminFee: currentValues.adminFee || 0,
                    loadingFee: currentValues.loadingFee || 0,
                    productType: currentValues.productType as 'PGBL' | 'VGBL',
                    inflation: currentValues.inflation,
                  }}
                />
              )}

              {/* Comparador de Fundos Reais */}
              <div className="mt-8">
                <FundosComparator
                  baseData={{
                    monthlyContribution: currentValues.monthlyContribution || 0,
                    years: currentValues.years || 0,
                    currentAge: currentValues.currentAge || 0,
                    inflation: currentValues.inflation,
                  }}
                  selic={selicData?.value || currentValues.annualReturn || 6}
                  ipca={ipcaData?.value || currentValues.inflation || 4}
                />
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    );
    
  }