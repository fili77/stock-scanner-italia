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
  };
}
