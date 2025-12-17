import { NextResponse } from 'next/server';

  // Tipos para a resposta da API do BACEN
  interface BacenSerieResponse {
    data: string;
    valor: string;
  }

  // Cache em memória (simples)
  let cachedData: { value: number; timestamp: number } | null = null;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

  export async function GET() {
    try {
      // Verifica se tem cache válido
      const now = Date.now();
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        console.log('📦 Usando IPCA do cache:', cachedData.value);
        return NextResponse.json({
          value: cachedData.value,
          cached: true,
          timestamp: cachedData.timestamp,
        });
      }

      // Busca dados do BACEN
      console.log('🌐 Buscando IPCA do BACEN...');
      const response = await fetch(
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json',
        { next: { revalidate: 86400 } } // Cache do Next.js: 24h
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do BACEN');
      }

      const data: BacenSerieResponse[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error('Sem dados retornados');
      }

      // Converte "0,42" para 0.42 (IPCA mensal)
      const value = parseFloat(data[0].valor.replace(',', '.'));

      // IPCA vem mensal, mas queremos anualizado (aproximado)
      // Fórmula: (1 + mensal)^12 - 1
      const annualizedValue = (Math.pow(1 + value / 100, 12) - 1) * 100;

      // Atualiza cache
      cachedData = { value: annualizedValue, timestamp: now };

      console.log('✅ IPCA obtido:', value, '% (mensal) →', annualizedValue.toFixed(2), '% (anual)');

      return NextResponse.json({
        value: annualizedValue,
        monthlyValue: value,
        cached: false,
        timestamp: now,
        date: data[0].data,
      });

    } catch (error) {
      console.error('❌ Erro ao buscar IPCA:', error);

      // Se der erro, retorna valor padrão
      return NextResponse.json(
        {
          value: 4.0,
          error: true,
          message: 'Usando valor padrão (falha na API)'
        },
        { status: 200 }
      );
    }
  }