import { StockData, FundamentalData } from '@/types/stock';
import { scanForOpportunities, TradingOpportunity } from './opportunityScanner';
import { detectMarketRegime } from './regimeDetection';
import { calculateTechnicalIndicators } from './stockPrediction';

export interface BacktestTrade {
  date: string;
  symbol: string;
  stockName: string;
  type: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  actualReturn: number; // Ritorno effettivo %
  expectedReturn: number; // Ritorno previsto %
  daysHeld: number;
  outcome: 'win' | 'loss' | 'breakeven';
  hitStopLoss: boolean;
  hitTakeProfit: boolean;
}

export interface BacktestResult {
  startDate: string;
  endDate: string;
  totalScans: number;
  totalOpportunitiesFound: number;
  totalTrades: number;

  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // %

  avgReturnPerTrade: number; // %
  totalReturn: number; // % composto

  avgWin: number; // %
  avgLoss: number; // %
  profitFactor: number; // Profitto totale / Perdita totale

  trades: BacktestTrade[];

  // NUOVE ANALISI DETTAGLIATE
  byStrategy: StrategyBreakdown[];
  byYear: YearlyBreakdown[];
  maxDrawdown: number; // %
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgHoldingDays: number;
}

export interface StrategyBreakdown {
  strategy: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
  profitFactor: number;
}

export interface YearlyBreakdown {
  year: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalReturn: number;
}

/**
 * Simula l'esito di un trade dato i dati storici successivi
 * Implementa trailing stop per proteggere i profitti
 */
function simulateTrade(
  opportunity: TradingOpportunity,
  futureData: StockData[],
  maxDays: number = 10
): BacktestTrade | null {
  if (futureData.length === 0) return null;

  const entryPrice = opportunity.entryPrice;
  let stopLoss = opportunity.stopLoss;
  const takeProfit = opportunity.takeProfit;

  // Calcola ATR per trailing stop (approssimazione: 2% del prezzo di entrata)
  const atrEstimate = entryPrice * 0.02;
  const trailingDistance = atrEstimate * 1.5; // Trailing stop a 1.5 ATR dal massimo

  let exitPrice = entryPrice;
  let daysHeld = 0;
  let hitStopLoss = false;
  let hitTakeProfit = false;
  let outcome: 'win' | 'loss' | 'breakeven' = 'breakeven';
  let highestPrice = entryPrice; // Traccia il massimo raggiunto

  // Simula i giorni successivi
  for (let i = 0; i < Math.min(futureData.length, maxDays); i++) {
    const day = futureData[i];
    daysHeld++;

    // Aggiorna il massimo raggiunto
    if (day.high > highestPrice) {
      highestPrice = day.high;

      // Aggiorna trailing stop se siamo in profitto (prezzo > entryPrice)
      if (highestPrice > entryPrice) {
        const newTrailingStop = highestPrice - trailingDistance;
        // Alza lo stop solo se il nuovo trailing è più alto dello stop attuale
        if (newTrailingStop > stopLoss) {
          stopLoss = newTrailingStop;
        }
      }
    }

    // Check se hit stop loss (incluso trailing stop)
    if (day.low <= stopLoss) {
      exitPrice = stopLoss;
      hitStopLoss = true;
      outcome = stopLoss > entryPrice ? 'win' : 'loss'; // Win se trailing stop in profitto
      break;
    }

    // Check se hit take profit
    if (day.high >= takeProfit) {
      exitPrice = takeProfit;
      hitTakeProfit = true;
      outcome = 'win';
      break;
    }

    // Se è l'ultimo giorno del periodo (o maxDays), esci al close
    if (i === Math.min(futureData.length, maxDays) - 1 || daysHeld >= opportunity.expectedHoldingPeriod) {
      exitPrice = day.close;
      break;
    }
  }

  // Calcola ritorno effettivo
  const actualReturn = ((exitPrice - entryPrice) / entryPrice) * 100;

  // Determina outcome se non è stato determinato prima
  if (outcome === 'breakeven') {
    if (actualReturn > 0.2) outcome = 'win';
    else if (actualReturn < -0.2) outcome = 'loss';
  }

  return {
    date: futureData[0]?.date || 'unknown',
    symbol: opportunity.symbol,
    stockName: opportunity.stockName,
    type: opportunity.type,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    actualReturn,
    expectedReturn: opportunity.expectedReturn,
    daysHeld,
    outcome,
    hitStopLoss,
    hitTakeProfit,
  };
}

/**
 * Esegue backtest semplificato su dati storici
 * Scansiona 1 volta al mese per 5 anni
 */
export async function runBacktest(
  historicalData: Map<string, StockData[]>,
  startDate: Date,
  endDate: Date
): Promise<BacktestResult> {
  const trades: BacktestTrade[] = [];
  let totalOpportunitiesFound = 0;
  let totalScans = 0;

  // Genera date di scansione (primo giorno di ogni mese)
  const scanDates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    scanDates.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  console.log(`🔄 Backtest: ${scanDates.length} scansioni programmate`);

  // Per ogni data di scansione
  for (const scanDate of scanDates) {
    totalScans++;

    // Prepara i dati disponibili fino a quella data
    const stockDataMap = new Map<string, StockData[]>();
    const regimeMap = new Map<string, any>();
    const fundamentalsMap = new Map<string, FundamentalData>();

    for (const [symbol, fullData] of historicalData.entries()) {
      // Filtra solo i dati fino alla data di scansione
      const dataUntilScanDate = fullData.filter(d => {
        const dataDate = new Date(d.date);
        return dataDate <= scanDate;
      });

      if (dataUntilScanDate.length < 60) continue; // Serve almeno 60 giorni

      // Prendi gli ultimi 90 giorni per lo scanner
      const recentData = dataUntilScanDate.slice(-90);
      stockDataMap.set(symbol, recentData);

      // Calcola regime
      const indicators = calculateTechnicalIndicators(recentData);
      const regime = detectMarketRegime(recentData, indicators);
      regimeMap.set(symbol, regime.regime);
    }

    if (stockDataMap.size === 0) continue;

    // Esegui scanner
    const scanResult = await scanForOpportunities(stockDataMap, fundamentalsMap, regimeMap);

    if (scanResult.opportunities.length > 0) {
      console.log(`📅 ${scanDate.toISOString().split('T')[0]}: ${scanResult.opportunities.length} opportunità trovate`);
      totalOpportunitiesFound += scanResult.opportunities.length;

      // Per ogni opportunità, simula il trade
      for (const opp of scanResult.opportunities) {
        // Trova i dati futuri per simulare il trade
        const fullData = historicalData.get(opp.symbol);
        if (!fullData) continue;

        const futureData = fullData.filter(d => {
          const dataDate = new Date(d.date);
          return dataDate > scanDate;
        });

        const trade = simulateTrade(opp, futureData, 15);
        if (trade) {
          trades.push(trade);
        }
      }
    }
  }

  // Calcola statistiche
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const breakeven = trades.filter(t => t.outcome === 'breakeven').length;

  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  const avgReturnPerTrade = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.actualReturn, 0) / trades.length
    : 0;

  // Calcola rendimento composto (assumendo posizione del 5% per trade)
  let totalReturn = 0;
  for (const trade of trades) {
    totalReturn += (trade.actualReturn / 100) * 0.05 * 100; // 5% position size
  }

  const avgWin = wins > 0
    ? trades.filter(t => t.outcome === 'win').reduce((sum, t) => sum + t.actualReturn, 0) / wins
    : 0;

  const avgLoss = losses > 0
    ? Math.abs(trades.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + t.actualReturn, 0) / losses)
    : 0;

  const totalProfits = trades.filter(t => t.outcome === 'win').reduce((sum, t) => sum + t.actualReturn, 0);
  const totalLosses = Math.abs(trades.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + t.actualReturn, 0));
  const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : 0;

  // NUOVE ANALISI DETTAGLIATE

  // 1. Breakdown per strategia
  const strategyMap = new Map<string, BacktestTrade[]>();
  for (const trade of trades) {
    const strategy = trade.type;
    if (!strategyMap.has(strategy)) {
      strategyMap.set(strategy, []);
    }
    strategyMap.get(strategy)!.push(trade);
  }

  const byStrategy: StrategyBreakdown[] = [];
  for (const [strategy, strategyTrades] of strategyMap.entries()) {
    const strategyWins = strategyTrades.filter(t => t.outcome === 'win').length;
    const strategyLosses = strategyTrades.filter(t => t.outcome === 'loss').length;
    const strategyWinRate = strategyTrades.length > 0 ? (strategyWins / strategyTrades.length) * 100 : 0;
    const strategyAvgReturn = strategyTrades.length > 0
      ? strategyTrades.reduce((sum, t) => sum + t.actualReturn, 0) / strategyTrades.length
      : 0;
    const strategyTotalReturn = strategyTrades.reduce((sum, t) => sum + (t.actualReturn / 100) * 0.05 * 100, 0);

    const strategyProfits = strategyTrades.filter(t => t.outcome === 'win').reduce((sum, t) => sum + t.actualReturn, 0);
    const strategyLossesAbs = Math.abs(strategyTrades.filter(t => t.outcome === 'loss').reduce((sum, t) => sum + t.actualReturn, 0));
    const strategyProfitFactor = strategyLossesAbs > 0 ? strategyProfits / strategyLossesAbs : 0;

    byStrategy.push({
      strategy,
      totalTrades: strategyTrades.length,
      wins: strategyWins,
      losses: strategyLosses,
      winRate: strategyWinRate,
      avgReturn: strategyAvgReturn,
      totalReturn: strategyTotalReturn,
      profitFactor: strategyProfitFactor,
    });
  }

  // Ordina per totalReturn decrescente
  byStrategy.sort((a, b) => b.totalReturn - a.totalReturn);

  // 2. Breakdown per anno
  const yearMap = new Map<number, BacktestTrade[]>();
  for (const trade of trades) {
    const year = new Date(trade.date).getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)!.push(trade);
  }

  const byYear: YearlyBreakdown[] = [];
  for (const [year, yearTrades] of yearMap.entries()) {
    const yearWins = yearTrades.filter(t => t.outcome === 'win').length;
    const yearLosses = yearTrades.filter(t => t.outcome === 'loss').length;
    const yearWinRate = yearTrades.length > 0 ? (yearWins / yearTrades.length) * 100 : 0;
    const yearTotalReturn = yearTrades.reduce((sum, t) => sum + (t.actualReturn / 100) * 0.05 * 100, 0);

    byYear.push({
      year,
      totalTrades: yearTrades.length,
      wins: yearWins,
      losses: yearLosses,
      winRate: yearWinRate,
      totalReturn: yearTotalReturn,
    });
  }

  // Ordina per anno
  byYear.sort((a, b) => a.year - b.year);

  // 3. Calcola max drawdown
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const trade of trades) {
    equity += (trade.actualReturn / 100) * 0.05 * 100; // 5% position size
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // 4. Calcola consecutive wins/losses
  let currentStreak = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let lastOutcome: 'win' | 'loss' | null = null;

  for (const trade of trades) {
    if (trade.outcome === 'breakeven') continue;

    if (trade.outcome === lastOutcome) {
      currentStreak++;
    } else {
      if (lastOutcome === 'win' && currentStreak > maxConsecutiveWins) {
        maxConsecutiveWins = currentStreak;
      }
      if (lastOutcome === 'loss' && currentStreak > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentStreak;
      }
      currentStreak = 1;
      lastOutcome = trade.outcome;
    }
  }

  // Check last streak
  if (lastOutcome === 'win' && currentStreak > maxConsecutiveWins) {
    maxConsecutiveWins = currentStreak;
  }
  if (lastOutcome === 'loss' && currentStreak > maxConsecutiveLosses) {
    maxConsecutiveLosses = currentStreak;
  }

  // 5. Calcola average holding days
  const avgHoldingDays = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.daysHeld, 0) / trades.length
    : 0;

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalScans,
    totalOpportunitiesFound,
    totalTrades: trades.length,
    wins,
    losses,
    breakeven,
    winRate,
    avgReturnPerTrade,
    totalReturn,
    avgWin,
    avgLoss,
    profitFactor,
    trades,
    byStrategy,
    byYear,
    maxDrawdown,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    avgHoldingDays,
  };
}
