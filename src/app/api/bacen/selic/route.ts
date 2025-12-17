import { NextResponse } from 'next/server';


interface BacenSerieResponse {
  data: string;
  valor: string;
}

let cachedData: { value: number; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; 

export async function GET() {
  try {
    // Verifica se tem cache válido
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando Selic do cache:', cachedData.value);
      return NextResponse.json({
        value: cachedData.value,
        cached: true,
        timestamp: cachedData.timestamp,
      });
    }

    // Busca dados do BACEN
    console.log('🌐 Buscando Selic do BACEN...');
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
      { next: { revalidate: 86400 } } // Cache do Next.js: 24h
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do BACEN');
    }

    const data: BacenSerieResponse[] = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Sem dados retornados');
    }

    // Converte "11,25" para 11.25
    const value = parseFloat(data[0].valor.replace(',', '.'));

    // Atualiza cache
    cachedData = { value, timestamp: now };

    console.log('✅ Selic obtida:', value);

    return NextResponse.json({
      value,
      cached: false,
      timestamp: now,
      date: data[0].data,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar Selic:', error);

    // Se der erro, retorna valor padrão
    return NextResponse.json(
      {
        value: 11.25,
        error: true,
        message: 'Usando valor padrão (falha na API)'
      },
      { status: 200 } // 200 para não quebrar o frontend
    );
  }
}