# 📊 PrevPlan - Simulador de Previdência Privada

> **Simulador profissional de investimentos em PGBL/VGBL com análise Monte Carlo e integração com dados reais do Banco Central**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.1-8884d8)](https://recharts.org/)

---

## 🎯 Sobre o Projeto

**PrevPlan** é uma aplicação web moderna que permite simular investimentos em produtos de previdência privada (PGBL/VGBL) com a mesma precisão de ferramentas profissionais de wealth management.

### 🌟 Destaques

- 🧮 **Cálculos Financeiros Precisos**: Tabela regressiva de IR, diferenciação PGBL/VGBL, correção por inflação
- 📈 **6 Gráficos Profissionais**: Visualizações interativas da evolução do patrimônio
- 🎲 **Simulação Monte Carlo**: 1000 cenários estocásticos para análise de risco
- 🏦 **Dados Reais**: Integração com API do BACEN (Selic e IPCA atualizados)
- ⚡ **Performance**: Web Workers para simulações pesadas sem travar a UI
- 💾 **Histórico**: Salve e compare múltiplas simulações
- 📄 **Exportação PDF**: Relatórios completos para impressão

---

## 🚀 Demo

**🔗 [Acesse a aplicação online](https://prevplan.vercel.app)** _(em breve)_

### Screenshots

_📸 Screenshots serão adicionados após deploy_

---

## 🛠️ Tecnologias Utilizadas

### Core
- **[Next.js 15.5](https://nextjs.org/)** - Framework React com App Router
- **[React 19](https://react.dev/)** - Biblioteca UI
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipagem estática

### Estilização
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[Lucide React](https://lucide.dev/)** - Ícones modernos

### Formulários e Validação
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod](https://zod.dev/)** - Schema validation

### Visualização de Dados
- **[Recharts](https://recharts.org/)** - Biblioteca de gráficos

### Outras Ferramentas
- **[Vitest](https://vitest.dev/)** - Framework de testes
- **[react-to-print](https://www.npmjs.com/package/react-to-print)** - Exportação PDF

---

## 📦 Instalação e Uso

### Pré-requisitos

- Node.js 20+
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/LewisHenilton/PrevPlan.git
cd PrevPlan
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Abra no navegador**
```
http://localhost:3000
```

### Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Inicia servidor de produção
npm run lint       # Executa linter
npm run test       # Executa testes
npm run test:ui    # Executa testes com UI
```

---

## 📊 Funcionalidades

### 1. Simulador Determinístico

- ✅ Cálculo preciso de juros compostos mês a mês
- ✅ Tabela regressiva de IR (35% → 10% conforme tempo)
- ✅ Diferenciação entre PGBL (IR sobre tudo) e VGBL (IR só sobre rendimentos)
- ✅ Correção por inflação (valores nominais vs reais)
- ✅ Análise de cenários (Pessimista, Base, Otimista)
- ✅ What-if analysis com slider interativo

### 2. Integração BACEN

- ✅ Taxa Selic atual (série 432)
- ✅ IPCA atual (série 433)
- ✅ Cache de 24h para otimização
- ✅ Opção de usar taxa fixa ou dados do BACEN

### 3. Comparador de Fundos

- ✅ 7 fundos reais cadastrados (BB, Caixa, Itaú, Bradesco, Santander, BTG, Nubank)
- ✅ 3 benchmarks (Tesouro Selic, IPCA+, CDI)
- ✅ Ranking automático por melhor resultado
- ✅ Cálculo de diferença vs melhor opção

### 4. Simulação Monte Carlo

- ✅ 1000 cenários com distribuição lognormal
- ✅ Algoritmo Box-Muller para números aleatórios
- ✅ Processamento em Web Worker (não trava a UI!)
- ✅ Percentis P5, P50, P95
- ✅ Gráfico de bandas de confiança

### 5. Visualizações

1. **Gráfico de Pizza**: Composição (Aportes vs Rentabilidade)
2. **Gráfico de Linha**: Evolução ano a ano
3. **Gráfico de Área Empilhada**: Decomposição do patrimônio
4. **Gráfico Nominal vs Real**: Impacto da inflação
5. **Gráfico de Cenários**: Análise de sensibilidade
6. **Gráfico Monte Carlo**: Bandas de confiança (P5-P95)

### 6. Gerenciamento de Simulações

- ✅ Salvar simulações com nomes personalizados
- ✅ Carregar simulações antigas
- ✅ Deletar simulações
- ✅ Persistência em localStorage

### 7. Exportação

- ✅ Impressão de relatórios completos
- ✅ Compatibilidade com impressoras físicas e "Salvar como PDF"

---

## 🧮 Conceitos Financeiros Implementados

### Tabela Regressiva de IR

| Prazo | Alíquota |
|-------|----------|
| 0-2 anos | 35% |
| 2-4 anos | 30% |
| 4-6 anos | 25% |
| 6-8 anos | 20% |
| 8-10 anos | 15% |
| > 10 anos | 10% |

### PGBL vs VGBL

- **PGBL**: IR incide sobre o valor total (aportes + rendimentos)
- **VGBL**: IR incide apenas sobre os rendimentos
- **Escolha**: Depende da declaração de IR (completa vs simplificada)

### Monte Carlo

- **Volatilidade**: 15% a.a. (padrão)
- **Distribuição**: Lognormal (retornos de investimentos)
- **Cenários**: 1000 simulações
- **Intervalo de confiança**: 90% (P5 a P95)

---

## 🧪 Testes

O projeto utiliza **Vitest** para testes unitários:

```bash
npm run test          # Executa testes
npm run test:ui       # Interface visual de testes
npm run test:coverage # Cobertura de código
```

**Cobertura atual**: 12 testes unitários cobrindo cálculos financeiros críticos.

---

## 📂 Estrutura do Projeto

```
prevplan/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── api/bacen/         # API Routes (Selic, IPCA)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── charts/            # Componentes de gráficos
│   │   │   ├── MonteCarloChart.tsx
│   │   │   ├── NominalVsRealChart.tsx
│   │   │   ├── ScenariosChart.tsx
│   │   │   ├── SimulationChart.tsx
│   │   │   └── StackedAreaChart.tsx
│   │   ├── ui/                # Design System
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── FundosComparator.tsx
│   │   └── SimulationForm.tsx
│   ├── data/
│   │   └── fundos.ts          # Base de dados de fundos
│   ├── hooks/
│   │   ├── useBacenData.ts
│   │   └── useMonteCarloWorker.ts
│   ├── lib/
│   │   ├── calculations.ts     # Cálculos financeiros
│   │   └── montecarlo.ts       # Simulação Monte Carlo
│   ├── test/
│   │   └── setup.ts
│   └── types/
│       └── simulation.ts
├── public/
│   └── montecarlo.worker.js   # Web Worker
├── vitest.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🎓 Aprendizados e Destaques Técnicos

Este projeto demonstra conhecimentos em:

### Front-end Avançado
- ✅ App Router do Next.js 15
- ✅ Server Components e Client Components
- ✅ TypeScript avançado (Generics, Union Types, Type Guards)
- ✅ React Hooks customizados
- ✅ Design System componentizado

### Performance
- ✅ Web Workers para processamento pesado
- ✅ Memoização e otimizações de re-render
- ✅ Code splitting e lazy loading

### Matemática Financeira
- ✅ Juros compostos
- ✅ Tabela regressiva de IR
- ✅ Correção por inflação
- ✅ Distribuições estatísticas (normal, lognormal)
- ✅ Algoritmo Box-Muller
- ✅ Simulação estocástica (Monte Carlo)

### Integrações
- ✅ API Routes (Next.js)
- ✅ Fetch com cache
- ✅ Web APIs (Workers, localStorage)

### Testes
- ✅ Testes unitários (Vitest)
- ✅ Testing Library

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👤 Autor

**Luiz Henrique** (LewisHenilton)

- GitHub: [@LewisHenilton](https://github.com/LewisHenilton)
- LinkedIn: [Seu LinkedIn](https://www.linkedin.com/in/seu-perfil) _(adicione seu link)_

---

## 🙏 Agradecimentos

- Banco Central do Brasil pela API de dados econômicos
- Comunidade Next.js e React
- Todos que contribuíram com feedback e sugestões

---

## 📊 Roadmap Futuro

- [ ] Fase de desacumulação (calcular renda mensal na aposentadoria)
- [ ] Cálculo reverso (goal-based planning)
- [ ] Modo escuro
- [ ] Internacionalização (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Mais fundos cadastrados
- [ ] Integração com mais APIs financeiras

---

**⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!**
