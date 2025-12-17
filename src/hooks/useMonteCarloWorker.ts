import { useState, useEffect, useRef } from 'react';
  import type { MonteCarloParams, MonteCarloResults } from '@/lib/montecarlo';

  interface WorkerState {
    results: MonteCarloResults | null;
    loading: boolean;
    progress: number;
    error: string | null;
  }

  export function useMonteCarloWorker() {
    const [state, setState] = useState<WorkerState>({
      results: null,
      loading: false,
      progress: 0,
      error: null,
    });

    const workerRef = useRef<Worker | null>(null);

    // Inicializa worker
    useEffect(() => {
      // Cria worker apontando para o arquivo no public/
      workerRef.current = new Worker('/montecarlo.worker.js');

      // Escuta mensagens do worker
      workerRef.current.onmessage = (event) => {
        const { type, results, progress, error } = event.data;

        if (type === 'progress') {
          setState(prev => ({ ...prev, progress }));
        } else if (type === 'complete') {
          setState({
            results,
            loading: false,
            progress: 100,
            error: null,
          });
        } else if (type === 'error') {
          setState({
            results: null,
            loading: false,
            progress: 0,
            error,
          });
        }
      };

      // Cleanup: mata worker quando componente desmonta
      return () => {
        workerRef.current?.terminate();
      };
    }, []);

    // Função para iniciar simulação
    const runSimulation = (params: MonteCarloParams) => {
      if (!workerRef.current) {
        setState(prev => ({ ...prev, error: 'Worker não inicializado' }));
        return;
      }

      setState({
        results: null,
        loading: true,
        progress: 0,
        error: null,
      });

      // Envia parâmetros para o worker
      workerRef.current.postMessage({ params });
    };

    return {
      ...state,
      runSimulation,
    };
}