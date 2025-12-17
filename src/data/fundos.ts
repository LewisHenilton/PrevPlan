export interface FundoPrevidencia {
    id: string;
    nome: string;
    banco: string;
    tipo: 'PGBL' | 'VGBL';
    taxaAdmin: number;        // % a.a.
    taxaCarregamento: number; // %
    rentabilidadeMedia: number; // % a.a. (últimos 5 anos)
    descricao: string;
    observacoes?: string;
  }

  export const fundosPrevidencia: FundoPrevidencia[] = [
    {
      id: 'bb-top-vgbl',
      nome: 'BB Previdência Top VGBL',
      banco: 'Banco do Brasil',
      tipo: 'VGBL',
      taxaAdmin: 1.8,
      taxaCarregamento: 0,
      rentabilidadeMedia: 6.5,
      descricao: 'Fundo conservador do BB com foco em renda fixa',
      observacoes: 'Indicado para perfil conservador',
    },
    {
      id: 'caixa-vida-pgbl',
      nome: 'CAIXA Vida e Previdência PGBL',
      banco: 'Caixa Econômica Federal',
      tipo: 'PGBL',
      taxaAdmin: 2.5,
      taxaCarregamento: 3.0,
      rentabilidadeMedia: 5.8,
      descricao: 'Plano tradicional da Caixa com benefício fiscal',
      observacoes: 'Taxa de carregamento aplicável. Dedutível no IR.',
    },
    {
      id: 'itau-flexprev',
      nome: 'Itaú Flexprev Plus II',
      banco: 'Itaú Unibanco',
      tipo: 'VGBL',
      taxaAdmin: 1.5,
      taxaCarregamento: 0,
      rentabilidadeMedia: 6.2,
      descricao: 'Fundo multiestratégia do Itaú',
      observacoes: 'Uma das menores taxas do mercado',
    },
    {
      id: 'bradesco-master',
      nome: 'BPREV Master VGBL',
      banco: 'Bradesco',
      tipo: 'VGBL',
      taxaAdmin: 2.0,
      taxaCarregamento: 0,
      rentabilidadeMedia: 6.0,
      descricao: 'Fundo balanceado Bradesco',
      observacoes: 'Perfil moderado',
    },
    {
      id: 'santander-total',
      nome: 'Santander Total PGBL',
      banco: 'Santander',
      tipo: 'PGBL',
      taxaAdmin: 1.7,
      taxaCarregamento: 2.0,
      rentabilidadeMedia: 6.3,
      descricao: 'Plano completo Santander',
      observacoes: 'Benefício fiscal IR',
    },
    {
      id: 'btg-top',
      nome: 'BTG Pactual Previdência',
      banco: 'BTG Pactual',
      tipo: 'VGBL',
      taxaAdmin: 1.0,
      taxaCarregamento: 0,
      rentabilidadeMedia: 7.5,
      descricao: 'Fundo premium para alta renda',
      observacoes: 'Aporte mínimo: R$ 10.000. Melhor rentabilidade.',
    },
    {
      id: 'nubank-prev',
      nome: 'Nubank Vida (Icatu)',
      banco: 'Nubank',
      tipo: 'VGBL',
      taxaAdmin: 0.5,
      taxaCarregamento: 0,
      rentabilidadeMedia: 6.8,
      descricao: 'Plano digital sem taxas abusivas',
      observacoes: 'Taxa mais baixa do mercado. 100% digital.',
    },
  ];
  export function getBenchmarks(selic: number, ipca: number): FundoPrevidencia[] {
    return [
      {
        id: 'benchmark-tesouro-selic',
        nome: 'Tesouro Selic (Benchmark)',
        banco: 'Tesouro Nacional',
        tipo: 'VGBL', // Apenas para compatibilidade
        taxaAdmin: 0,
        taxaCarregamento: 0,
        rentabilidadeMedia: selic, // 100% da Selic
        descricao: 'Investimento em Tesouro Selic (livre de taxas)',
        observacoes: 'Isento de IR se mantido por mais de 2 anos. Liquidez diária.',
      },
      {
        id: 'benchmark-tesouro-ipca',
        nome: 'Tesouro IPCA+ 6% (Benchmark)',
        banco: 'Tesouro Nacional',
        tipo: 'VGBL',
        taxaAdmin: 0,
        taxaCarregamento: 0,
        rentabilidadeMedia: ipca + 6, // IPCA + prêmio de 6%
        descricao: 'Investimento em Tesouro IPCA+ com prêmio de 6%',
        observacoes: 'IR regressivo. Indicado para longo prazo.',
      },
      {
        id: 'benchmark-cdi',
        nome: 'CDI 99% (Benchmark)',
        banco: 'Renda Fixa Tradicional',
        tipo: 'VGBL',
        taxaAdmin: 0,
        taxaCarregamento: 0,
        rentabilidadeMedia: selic * 0.99, // 99% da Selic
        descricao: 'CDB/LCI rendendo 99% do CDI',
        observacoes: 'IR regressivo. Liquidez diária ou no vencimento.',
      },
    ];
  }

  // Helper: Buscar fundo por ID
  export function getFundoById(id: string): FundoPrevidencia | undefined {
    return fundosPrevidencia.find(f => f.id === id);
  }

  // Helper: Listar por banco
  export function getFundosByBanco(banco: string): FundoPrevidencia[] {
    return fundosPrevidencia.filter(f => f.banco === banco);
  }