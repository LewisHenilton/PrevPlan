import {useState, useEffect} from 'react';
interface BacenData {
    value: number;
    cached?: boolean;
    tiemstamp?: number;
    date?: string;
    monthlyValue?: number;
    error?: boolean;
    message?: string;

}
interface UseBacenDataReturn {
    data: BacenData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useBacenData(
    endpoint: 'selic' | 'ipca',
    enabled: boolean = true
  ): UseBacenDataReturn {
    const [data, setData] = useState<BacenData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/bacen/${endpoint}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do BACEN');
        }

        const result: BacenData = await response.json();
        setData(result);

        if (result.error) {
          setError(result.message || 'Erro desconhecido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, [endpoint, enabled]);

    return {
      data,
      loading,
      error,
      refetch: fetchData,
    };
}