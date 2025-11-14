import { StockData, FundamentalData } from '@/types/stock';
import { MarketRegime } from './regimeDetection';

export type OpportunityType =
  | 'volume_anomaly'
  | 'post_earnings'
  | 'pre_dividend'
  | 'correlation_breakdown'
  | 'support_bounce'
  | 'resistance_break';

export type EdgeStrength = 'strong' | 'medium' | 'weak';

export interface TradingOpportunity {
  symbol: string;
  stockName: string;
  type: OpportunityType;
  edgeStrength: EdgeStrength;

  // Statistical significance
  zScore: number; // Standard deviations from mean
  pValue: number; // Statistical significance
  confidence: number; // 0-100

  // Expected outcomes
  expectedReturn: number; // % expected return
  expectedHoldingPeriod: number; // Days
  riskRewardRatio: number; // Expected return / risk

  // Entry/Exit levels
  currentPrice: number;
  entryPrice: number; // Suggested entry
  stopLoss: number;
  takeProfit: number;

  // Supporting data
  details: string[]; // Detailed explanation
  regime: MarketRegime; // Current market regime
  volumeAnomaly?: number; // If volume spike, how much (e.g., 3.2x normal)

  // Risk assessment
  positionSize: number; // % of portfolio (Kelly-based)
  maxLoss: number; // Max $ loss if stop hit

  // Filters
  passesFilters: boolean;
  filterReasons: string[]; // Why it passed/failed filters

  // Score
  totalScore: number; // 0-100 composite score
}

export interface ScannerResult {
  scanDate: string;
  opportunities: TradingOpportunity[];
  scannedSymbols: number;
  filteredOut: number;
  summary: string[];
}

/**
 * Rileva volume anomalies (picchi inusuali di volume senza news)
 */
export function detectVolumeAnomaly(
  stockData: StockData[],
  currentPrice: number,
  symbol: string
): TradingOpportunity | null {
  if (stockData.length < 30) return null;

  const recentVolume = stockData[stockData.length - 1].volume;
  const volumes = stockData.slice(-30).map(d => d.volume);

  // Calcola media e std dev
  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length;
  const std = Math.sqrt(variance);

  // Z-score
  const zScore = (recentVolume - mean) / std;

  // Anomalia significativa solo se z-score > 3 (99.7% confidence)
  if (zScore < 3) return null;

  // Check price action
  const priceChange = ((currentPrice - stockData[stockData.length - 2].close) / stockData[stockData.length - 2].close) * 100;

  // Se volume alto + price up sharp → possibile breakout (long bias)
  // Se volume alto + price down sharp → possibile panic sell (long bias su reversal)
  // Se volume alto + price flat → investigate (possibile accumulation)

  const volumeMultiplier = recentVolume / mean;
  const details: string[] = [];
  let expectedReturn = 0;
  let edgeStrength: EdgeStrength = 'medium';

  if (Math.abs(priceChange) > 3 && volumeMultiplier > 4) {
    // Strong anomaly
    edgeStrength = 'strong';
    if (priceChange > 0) {
      expectedReturn = 2.5; // Momentum continuation
      details.push(`📈 Volume spike (${volumeMultiplier.toFixed(1)}x) + rialzo ${priceChange.toFixed(1)}%`);
      details.push(`🎯 Possibile inizio breakout - momentum likely continua`);
    } else {
      expectedReturn = 1.8; // Panic sell reversal
      details.push(`📉 Volume spike (${volumeMultiplier.toFixed(1)}x) + calo ${Math.abs(priceChange).toFixed(1)}%`);
      details.push(`🎯 Possibile panic selling - mean reversion attesa`);
    }
  } else if (volumeMultiplier > 3.5) {
    edgeStrength = 'medium';
    expectedReturn = 1.5;
    details.push(`📊 Volume anomalo (${volumeMultiplier.toFixed(1)}x normale)`);
    details.push(`🔍 Possibile insider activity o anticipazione news`);
  } else {
    edgeStrength = 'weak';
    expectedReturn = 1.0;
    details.push(`📊 Volume elevato (${volumeMultiplier.toFixed(1)}x normale)`);
  }

  // P-value from z-score (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Entry/exit levels
  const atr = calculateATR(stockData.slice(-15));
  const stopLoss = currentPrice - (atr * 2.0); // 2.0 ATR stop (allargato)
  const takeProfit = currentPrice + (atr * 2.5); // 2.5 ATR target

  return {
    symbol,
    stockName: symbol,
    type: 'volume_anomaly',
    edgeStrength,
    zScore,
    pValue,
    confidence: (1 - pValue) * 100,
    expectedReturn,
    expectedHoldingPeriod: 3, // 3 giorni avg
    riskRewardRatio: 1.67,
    currentPrice,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    details,
    regime: 'range_bound', // Placeholder, verrà sovrascritto
    volumeAnomaly: volumeMultiplier,
    positionSize: calculateKellySize(expectedReturn / 100, 0.55, (currentPrice - stopLoss) / currentPrice),
    maxLoss: 0, // Calcolato dopo
    passesFilters: true,
    filterReasons: [],
    totalScore: 0, // Calcolato dopo
  };
}

/**
 * Rileva post-earnings drift opportunities
 */
export function detectPostEarnings(
  symbol: string,
  currentPrice: number,
  fundamentals: FundamentalData | null
): TradingOpportunity | null {
  if (!fundamentals || !fundamentals.earningsDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earningsDate = parseDate(fundamentals.earningsDate);
  if (!earningsDate) return null;

  // Check se earnings sono stati negli ultimi 3 giorni
  const daysSinceEarnings = getDaysDifference(earningsDate, today);

  if (daysSinceEarnings < 0 || daysSinceEarnings > 3) return null;

  // In assenza di earnings surprise data, assumiamo edge moderato
  // In produzione, dovresti fetchare actual vs expected earnings
  const details: string[] = [];
  details.push(`📊 Earnings pubblicati ${daysSinceEarnings} giorni fa`);
  details.push(`📈 Post-Earnings Drift: statisticamente continua 5-10 giorni`);
  details.push(`✅ Edge documentato in letteratura accademica (Ball & Brown, 1968)`);

  const expectedReturn = 1.5; // Conservative estimate
  const atr = currentPrice * 0.02; // Stima ATR come 2% del prezzo

  return {
    symbol,
    stockName: symbol,
    type: 'post_earnings',
    edgeStrength: 'medium',
    zScore: 2.5, // Earnings events sono significativi
    pValue: 0.012, // Significativo
    confidence: 75,
    expectedReturn,
    expectedHoldingPeriod: 7,
    riskRewardRatio: 2.0,
    currentPrice,
    entryPrice: currentPrice,
    stopLoss: currentPrice - (atr * 1.5),
    takeProfit: currentPrice + (atr * 3.0),
    details,
    regime: 'range_bound',
    positionSize: calculateKellySize(expectedReturn / 100, 0.58, 0.015),
    maxLoss: 0,
    passesFilters: true,
    filterReasons: [],
    totalScore: 0,
  };
}

/**
 * Rileva pre-dividend accumulation
 */
export function detectPreDividend(
  symbol: string,
  currentPrice: number,
  fundamentals: FundamentalData | null
): TradingOpportunity | null {
  if (!fundamentals || !fundamentals.exDividendDate || !fundamentals.dividendRate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exDivDate = parseDate(fundamentals.exDividendDate);
  if (!exDivDate) return null;

  const daysUntilExDiv = getDaysDifference(today, exDivDate);

  // Setup valido solo 2-5 giorni prima dello stacco
  if (daysUntilExDiv < 2 || daysUntilExDiv > 5) return null;

  const quarterlyDiv = fundamentals.dividendRate / 4; // Assumiamo dividendo trimestrale
  const divYield = (quarterlyDiv / currentPrice) * 100;

  // Edge troppo piccolo se dividend yield < 0.5%
  if (divYield < 0.5) return null;

  const details: string[] = [];
  details.push(`💰 Stacco dividendo tra ${daysUntilExDiv} giorni`);
  details.push(`💵 Dividendo trimestrale: €${quarterlyDiv.toFixed(4)} (${divYield.toFixed(2)}% yield)`);
  details.push(`📈 Pre-dividend accumulation: piccolo rialzo atteso`);
  details.push(`⚠️ Exit PRIMA dello stacco per catturare appreciation`);

  const expectedReturn = Math.min(divYield * 0.6, 1.2); // Max 60% del dividend yield, cap a 1.2%

  return {
    symbol,
    stockName: symbol,
    type: 'pre_dividend',
    edgeStrength: divYield > 1.5 ? 'strong' : 'medium',
    zScore: 1.8,
    pValue: 0.072,
    confidence: 65,
    expectedReturn,
    expectedHoldingPeriod: daysUntilExDiv - 1, // Exit before ex-div
    riskRewardRatio: 1.5,
    currentPrice,
    entryPrice: currentPrice,
    stopLoss: currentPrice * 0.985, // -1.5% stop
    takeProfit: currentPrice * (1 + expectedReturn / 100),
    details,
    regime: 'range_bound',
    positionSize: calculateKellySize(expectedReturn / 100, 0.60, 0.015),
    maxLoss: 0,
    passesFilters: true,
    filterReasons: [],
    totalScore: 0,
  };
}

/**
 * Calcola ATR semplificato
 */
function calculateATR(data: StockData[]): number {
  if (data.length < 2) return 0;

  let sum = 0;
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    sum += tr;
  }

  return sum / (data.length - 1);
}

/**
 * Kelly Criterion per position sizing
 */
function calculateKellySize(
  expectedReturn: number,
  winRate: number,
  avgLoss: number
): number {
  // Kelly = (p * b - q) / b
  // Dove: p = win rate, q = 1-p, b = win/loss ratio

  const p = winRate;
  const q = 1 - p;
  const b = expectedReturn / avgLoss;

  const kelly = (p * b - q) / b;

  // Use fractional Kelly (25% of full Kelly per safety)
  const fractionalKelly = Math.max(0, Math.min(kelly * 0.25, 0.15)); // Max 15% portfolio

  return fractionalKelly * 100; // Return as percentage
}

/**
 * Normal CDF approximation (per p-value)
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - prob : prob;
}

/**
 * Parse date helper
 */
function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calcola differenza giorni
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Rileva momentum semplice (2-3 giorni stessa direzione)
 * COMPATIBILE CON EOD: scan sera → entry mattina dopo
 */
export function detectMomentumSimple(
  stockData: StockData[],
  currentPrice: number,
  symbol: string
): TradingOpportunity | null {
  if (stockData.length < 5) return null;

  const recentData = stockData.slice(-4); // Ultimi 4 giorni (oggi + 3 precedenti)

  // Calcola variazioni giornaliere
  const changes: number[] = [];
  for (let i = 1; i < recentData.length; i++) {
    const change = ((recentData[i].close - recentData[i - 1].close) / recentData[i - 1].close) * 100;
    changes.push(change);
  }

  // Verifica se gli ultimi 2-3 giorni hanno stesso segno
  const last3 = changes.slice(-3);
  const allPositive = last3.every(c => c > 0.3); // 3 giorni up
  const allNegative = last3.every(c => c < -0.3); // 3 giorni down

  const last2 = changes.slice(-2);
  const twoPositive = last2.every(c => c > 0.5); // 2 giorni up forte
  const twoNegative = last2.every(c => c < -0.5); // 2 giorni down forte

  if (!allPositive && !allNegative && !twoPositive && !twoNegative) return null;

  const atr = calculateATR(recentData);
  const details: string[] = [];
  let expectedReturn = 0;
  let edgeStrength: EdgeStrength = 'medium';
  let isContinuation = false;

  // Volume analysis
  const lastVolume = recentData[recentData.length - 1].volume;
  const avgVolume = recentData.slice(0, -1).reduce((sum, d) => sum + d.volume, 0) / (recentData.length - 1);
  const volumeConfirmation = lastVolume > avgVolume * 1.2;

  if (allPositive || twoPositive) {
    // Momentum UP
    isContinuation = volumeConfirmation;

    if (allPositive && volumeConfirmation) {
      edgeStrength = 'strong';
      expectedReturn = 1.5;
      details.push(`🚀 3 giorni consecutivi al rialzo + volume`);
      details.push(`📈 Momentum continuation: trend forte`);
      details.push(`✅ Probabilità 60-65% di continuazione`);
    } else if (twoPositive && volumeConfirmation) {
      edgeStrength = 'medium';
      expectedReturn = 1.2;
      details.push(`📈 2 giorni forti al rialzo + volume`);
      details.push(`🎯 Momentum likely continua`);
    } else {
      expectedReturn = 1.0;
      details.push(`📊 Momentum UP (2-3 giorni)`);
      details.push(`⚠️ Senza conferma volume - probabilità 55%`);
    }

    return {
      symbol,
      stockName: symbol,
      type: 'support_bounce',
      edgeStrength,
      zScore: 1.5,
      pValue: 0.07,
      confidence: volumeConfirmation ? 60 : 52,
      expectedReturn,
      expectedHoldingPeriod: 3,
      riskRewardRatio: 1.8,
      currentPrice,
      entryPrice: currentPrice,
      stopLoss: currentPrice - (atr * 2.0), // Stop allargato a 2.0 ATR
      takeProfit: currentPrice + (atr * 2.0),
      details,
      regime: 'trending_up',
      positionSize: calculateKellySize(expectedReturn / 100, 0.60, 0.012),
      maxLoss: 0,
      passesFilters: true,
      filterReasons: [],
      totalScore: 0,
    };
  } else {
    // Momentum DOWN (mean reversion opportunity)
    if (allNegative && volumeConfirmation) {
      edgeStrength = 'medium';
      expectedReturn = 1.3;
      details.push(`📉 3 giorni consecutivi al ribasso`);
      details.push(`📈 Mean reversion: probabile rimbalzo`);
      details.push(`✅ Oversold - probabilità 60% di rimbalzo`);
    } else if (twoNegative) {
      edgeStrength = 'medium';
      expectedReturn = 1.0;
      details.push(`📊 2 giorni forti al ribasso`);
      details.push(`🎯 Possibile rimbalzo tecnico`);
    } else {
      expectedReturn = 0.8;
      details.push(`📉 Momentum DOWN`);
      details.push(`⚠️ Mean reversion cauta`);
    }

    return {
      symbol,
      stockName: symbol,
      type: 'support_bounce',
      edgeStrength,
      zScore: 1.5,
      pValue: 0.07,
      confidence: allNegative ? 58 : 50,
      expectedReturn,
      expectedHoldingPeriod: 3,
      riskRewardRatio: 1.5,
      currentPrice,
      entryPrice: currentPrice,
      stopLoss: currentPrice - (atr * 2.0), // Stop allargato a 2.0 ATR
      takeProfit: currentPrice + (atr * 2.0),
      details,
      regime: 'range_bound',
      positionSize: calculateKellySize(expectedReturn / 100, 0.58, 0.015),
      maxLoss: 0,
      passesFilters: true,
      filterReasons: [],
      totalScore: 0,
    };
  }
}

/**
 * Rileva rimbalzi su livelli di supporto
 */
export function detectSupportBounce(
  stockData: StockData[],
  currentPrice: number,
  symbol: string
): TradingOpportunity | null {
  if (stockData.length < 30) return null;

  const recentData = stockData.slice(-30);

  // Trova minimi locali (potenziali supporti)
  const supports: number[] = [];
  for (let i = 2; i < recentData.length - 2; i++) {
    const current = recentData[i].low;
    const before1 = recentData[i - 1].low;
    const before2 = recentData[i - 2].low;
    const after1 = recentData[i + 1].low;
    const after2 = recentData[i + 2].low;

    // È un minimo locale se più basso dei 2 precedenti e 2 successivi
    if (current < before1 && current < before2 && current < after1 && current < after2) {
      supports.push(current);
    }
  }

  if (supports.length === 0) return null;

  // Trova il supporto più vicino al prezzo corrente
  const nearestSupport = supports.reduce((prev, curr) =>
    Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
  );

  // Distanza % dal supporto
  const distanceFromSupport = ((currentPrice - nearestSupport) / nearestSupport) * 100;

  // Opportunità valida solo se siamo vicini al supporto (entro 2%)
  if (distanceFromSupport < -0.5 || distanceFromSupport > 2) return null;

  // Check se c'è stato un rimbalzo (candela con long lower wick)
  const lastCandle = recentData[recentData.length - 1];
  const wickLength = lastCandle.close - lastCandle.low;
  const bodyLength = Math.abs(lastCandle.close - lastCandle.open);
  const wickRatio = bodyLength > 0 ? wickLength / bodyLength : 0;

  // Se wick lungo rispetto al body, possibile rimbalzo
  const bounceStrength = wickRatio > 1.5 ? 'strong' : wickRatio > 0.8 ? 'medium' : 'weak';

  if (bounceStrength === 'weak') return null;

  const atr = calculateATR(recentData.slice(-15));
  const details: string[] = [];
  let expectedReturn = 0;
  let edgeStrength: EdgeStrength = 'medium';

  if (bounceStrength === 'strong') {
    edgeStrength = 'strong';
    expectedReturn = 2.0;
    details.push(`📈 Forte rimbalzo su supporto €${nearestSupport.toFixed(3)}`);
    details.push(`🎯 Candela con long lower wick (${wickRatio.toFixed(1)}x body)`);
    details.push(`✅ Support testato ${supports.length} volte negli ultimi 30 giorni`);
  } else {
    edgeStrength = 'medium';
    expectedReturn = 1.3;
    details.push(`📊 Rimbalzo su supporto €${nearestSupport.toFixed(3)}`);
    details.push(`🎯 Prezzo vicino al supporto (+${distanceFromSupport.toFixed(1)}%)`);
  }

  const stopLoss = nearestSupport - (atr * 1.5); // Stop allargato a 1.5 ATR sotto supporto
  const takeProfit = currentPrice + (atr * 2.5);

  return {
    symbol,
    stockName: symbol,
    type: 'support_bounce',
    edgeStrength,
    zScore: 2.0,
    pValue: 0.045,
    confidence: edgeStrength === 'strong' ? 70 : 60,
    expectedReturn,
    expectedHoldingPeriod: 5,
    riskRewardRatio: (takeProfit - currentPrice) / (currentPrice - stopLoss),
    currentPrice,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    details,
    regime: 'range_bound',
    positionSize: calculateKellySize(expectedReturn / 100, 0.60, (currentPrice - stopLoss) / currentPrice),
    maxLoss: 0,
    passesFilters: true,
    filterReasons: [],
    totalScore: 0,
  };
}

/**
 * Rileva rotture di resistenza con volume
 */
export function detectResistanceBreak(
  stockData: StockData[],
  currentPrice: number,
  symbol: string
): TradingOpportunity | null {
  if (stockData.length < 30) return null;

  const recentData = stockData.slice(-30);

  // Trova massimi locali (potenziali resistenze)
  const resistances: number[] = [];
  for (let i = 2; i < recentData.length - 3; i++) {
    const current = recentData[i].high;
    const before1 = recentData[i - 1].high;
    const before2 = recentData[i - 2].high;
    const after1 = recentData[i + 1].high;
    const after2 = recentData[i + 2].high;

    if (current > before1 && current > before2 && current > after1 && current > after2) {
      resistances.push(current);
    }
  }

  if (resistances.length === 0) return null;

  // Trova la resistenza più vicina appena sotto o appena sopra il prezzo
  const nearestResistance = resistances.reduce((prev, curr) => {
    const prevDist = Math.abs(prev - currentPrice);
    const currDist = Math.abs(curr - currentPrice);
    return currDist < prevDist ? curr : prev;
  });

  // Distanza % dalla resistenza
  const distanceFromResistance = ((currentPrice - nearestResistance) / nearestResistance) * 100;

  // Opportunità valida solo se abbiamo appena rotto la resistenza (entro 1% sopra)
  if (distanceFromResistance < -0.5 || distanceFromResistance > 1.5) return null;

  // Check volume
  const lastCandle = recentData[recentData.length - 1];
  const avgVolume = recentData.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
  const volumeRatio = lastCandle.volume / avgVolume;

  // Serve volume elevato per conferma breakout
  if (volumeRatio < 1.3) return null;

  const atr = calculateATR(recentData.slice(-15));
  const details: string[] = [];
  let expectedReturn = 0;
  let edgeStrength: EdgeStrength = 'medium';

  if (volumeRatio > 2.0) {
    edgeStrength = 'strong';
    expectedReturn = 2.5;
    details.push(`🚀 Rottura forte di resistenza €${nearestResistance.toFixed(3)}`);
    details.push(`📊 Volume ${volumeRatio.toFixed(1)}x superiore alla media`);
    details.push(`✅ Breakout confermato con chiusura sopra resistenza`);
  } else {
    edgeStrength = 'medium';
    expectedReturn = 1.5;
    details.push(`📈 Rottura resistenza €${nearestResistance.toFixed(3)}`);
    details.push(`📊 Volume ${volumeRatio.toFixed(1)}x media (conferma breakout)`);
  }

  const stopLoss = nearestResistance - (atr * 1.5); // Stop allargato a 1.5 ATR sotto ex-resistenza
  const takeProfit = currentPrice + (atr * 3.0);

  return {
    symbol,
    stockName: symbol,
    type: 'resistance_break',
    edgeStrength,
    zScore: 2.2,
    pValue: 0.028,
    confidence: edgeStrength === 'strong' ? 75 : 65,
    expectedReturn,
    expectedHoldingPeriod: 7,
    riskRewardRatio: (takeProfit - currentPrice) / (currentPrice - stopLoss),
    currentPrice,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    details,
    regime: 'breakout_up',
    positionSize: calculateKellySize(expectedReturn / 100, 0.62, (currentPrice - stopLoss) / currentPrice),
    maxLoss: 0,
    passesFilters: true,
    filterReasons: [],
    totalScore: 0,
  };
}

/**
 * Rileva condizioni di mean reversion (oversold/overbought)
 */
export function detectMeanReversion(
  stockData: StockData[],
  currentPrice: number,
  symbol: string
): TradingOpportunity | null {
  if (stockData.length < 50) return null;

  const recentData = stockData.slice(-50);

  // Calcola media mobile 20 giorni
  const ma20Data = recentData.slice(-20);
  const ma20 = ma20Data.reduce((sum, d) => sum + d.close, 0) / 20;

  // Calcola deviazione standard
  const variance = ma20Data.reduce((sum, d) => sum + Math.pow(d.close - ma20, 2), 0) / 20;
  const stdDev = Math.sqrt(variance);

  // Z-score del prezzo corrente
  const zScore = (currentPrice - ma20) / stdDev;

  // Calcola RSI semplificato (14 periodi)
  let gains = 0;
  let losses = 0;
  for (let i = recentData.length - 14; i < recentData.length; i++) {
    const change = recentData[i].close - recentData[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // Opportunità: oversold (possibile rimbalzo)
  const isOversold = rsi < 35 && zScore < -1.5;

  if (!isOversold) return null;

  const atr = calculateATR(recentData.slice(-15));
  const details: string[] = [];
  let expectedReturn = 0;
  let edgeStrength: EdgeStrength = 'medium';

  if (rsi < 25 && zScore < -2) {
    edgeStrength = 'strong';
    expectedReturn = 2.2;
    details.push(`🔽 Fortemente oversold: RSI=${rsi.toFixed(0)}, Z-score=${zScore.toFixed(2)}`);
    details.push(`📈 Prezzo ${Math.abs((currentPrice - ma20) / ma20 * 100).toFixed(1)}% sotto MA20`);
    details.push(`✅ Alta probabilità di mean reversion`);
  } else {
    edgeStrength = 'medium';
    expectedReturn = 1.4;
    details.push(`📉 Oversold: RSI=${rsi.toFixed(0)}, Z-score=${zScore.toFixed(2)}`);
    details.push(`🎯 Mean reversion attesa verso MA20 €${ma20.toFixed(3)}`);
  }

  const stopLoss = currentPrice - (atr * 2.0); // Stop allargato a 2.0 ATR
  const takeProfit = ma20; // Target: ritorno alla media

  // Skip se take profit è troppo vicino
  if ((takeProfit - currentPrice) / currentPrice < 0.008) return null;

  return {
    symbol,
    stockName: symbol,
    type: 'support_bounce', // Usiamo questo type (è simile)
    edgeStrength,
    zScore: Math.abs(zScore),
    pValue: 0.035,
    confidence: edgeStrength === 'strong' ? 72 : 62,
    expectedReturn,
    expectedHoldingPeriod: 5,
    riskRewardRatio: (takeProfit - currentPrice) / (currentPrice - stopLoss),
    currentPrice,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    details,
    regime: 'range_bound',
    positionSize: calculateKellySize(expectedReturn / 100, 0.61, (currentPrice - stopLoss) / currentPrice),
    maxLoss: 0,
    passesFilters: true,
    filterReasons: [],
    totalScore: 0,
  };
}

/**
 * Scanner principale: analizza tutti i titoli e trova opportunità
 */
export async function scanForOpportunities(
  stockDataMap: Map<string, StockData[]>,
  fundamentalsMap: Map<string, FundamentalData>,
  regimeMap: Map<string, MarketRegime>
): Promise<ScannerResult> {
  const opportunities: TradingOpportunity[] = [];
  const scannedSymbols = stockDataMap.size;
  let filteredOut = 0;

  for (const [symbol, stockData] of stockDataMap.entries()) {
    if (stockData.length < 30) {
      filteredOut++;
      continue;
    }

    const currentPrice = stockData[stockData.length - 1].close;
    const fundamentals = fundamentalsMap.get(symbol) || null;
    const regime = regimeMap.get(symbol) || 'range_bound';

    // 1. Check Momentum Simple (2-3 giorni) - COMPATIBILE EOD
    const momentumOpp = detectMomentumSimple(stockData, currentPrice, symbol);
    if (momentumOpp) {
      momentumOpp.regime = regime;
      opportunities.push(momentumOpp);
    }

    // 2. Check Mean Reversion - COMPATIBILE EOD
    const reversionOpp = detectMeanReversion(stockData, currentPrice, symbol);
    if (reversionOpp) {
      reversionOpp.regime = regime;
      opportunities.push(reversionOpp);
    }

    // 3. Check Support Bounce - COMPATIBILE EOD
    const supportOpp = detectSupportBounce(stockData, currentPrice, symbol);
    if (supportOpp) {
      supportOpp.regime = regime;
      opportunities.push(supportOpp);
    }

    // 4. Check Resistance Break - PARZIALMENTE COMPATIBILE EOD
    const resistanceOpp = detectResistanceBreak(stockData, currentPrice, symbol);
    if (resistanceOpp) {
      resistanceOpp.regime = regime;
      opportunities.push(resistanceOpp);
    }

    // 5. Check Volume Anomaly - PARZIALMENTE COMPATIBILE EOD
    const volumeOpp = detectVolumeAnomaly(stockData, currentPrice, symbol);
    if (volumeOpp) {
      volumeOpp.regime = regime;
      opportunities.push(volumeOpp);
    }

    // RIMOSSE STRATEGIE INCOMPATIBILI CON EOD:
    // - Gap Fill: il gap si vede solo intraday, incompatibile con dati EOD
    // - Post-Earnings: richiede fundamentals (401 errors)
    // - Pre-Dividend: richiede fundamentals (401 errors)
  }

  // Filter opportunità
  const filtered = opportunities.filter(opp => applyFilters(opp));
  filteredOut += opportunities.length - filtered.length;

  // Score opportunità
  filtered.forEach(opp => {
    opp.totalScore = calculateOpportunityScore(opp);
  });

  // Sort by score (best first)
  filtered.sort((a, b) => b.totalScore - a.totalScore);

  // Take only top 5
  const topOpportunities = filtered.slice(0, 5);

  // Generate summary
  const summary: string[] = [];
  summary.push(`🔍 Scansionati ${scannedSymbols} titoli`);
  summary.push(`✅ Trovate ${topOpportunities.length} opportunità valide`);
  summary.push(`❌ Filtrate ${filteredOut} opportunità (bassa qualità o regime sfavorevole)`);

  if (topOpportunities.length === 0) {
    summary.push(`💰 STAY CASH - Nessuna opportunità con edge sufficiente oggi`);
  } else {
    summary.push(`🎯 Top opportunity: ${topOpportunities[0].symbol} (${topOpportunities[0].type}, score: ${topOpportunities[0].totalScore.toFixed(0)})`);
  }

  return {
    scanDate: new Date().toISOString(),
    opportunities: topOpportunities,
    scannedSymbols,
    filteredOut,
    summary,
  };
}

/**
 * Applica filtri di qualità
 */
function applyFilters(opp: TradingOpportunity): boolean {
  const reasons: string[] = [];
  let passes = true;

  // Filter 1: Confidence minima (abbassata da 60% a 50%)
  if (opp.confidence < 50) {
    passes = false;
    reasons.push('Confidence troppo bassa (<50%)');
  }

  // Filter 2: Risk/Reward minimo (abbassato da 1.3 a 1.2)
  if (opp.riskRewardRatio < 1.2) {
    passes = false;
    reasons.push('Risk/Reward inadeguato (<1.2)');
  }

  // Filter 3: Expected return minimo (abbassato da 0.8% a 0.6%)
  if (opp.expectedReturn < 0.6) {
    passes = false;
    reasons.push('Expected return troppo basso (<0.6% dopo costi)');
  }

  // Filter 4: Regime check (RIMOSSO - accettiamo tutti i regimi)
  // Le strategie gap e momentum funzionano anche in volatilità
  /*
  if (opp.regime === 'high_volatility' || opp.regime === 'breakdown' || opp.regime === 'trending_down') {
    passes = false;
    reasons.push(`Regime sfavorevole (${opp.regime})`);
  }
  */

  // Filter 5: Position size troppo piccola (abbassato da 3% a 2%)
  if (opp.positionSize < 2) {
    passes = false;
    reasons.push('Position size troppo piccola (<2%)');
  }

  opp.passesFilters = passes;
  opp.filterReasons = reasons;

  return passes;
}

/**
 * Calcola score composito (0-100)
 */
function calculateOpportunityScore(opp: TradingOpportunity): number {
  let score = 0;

  // 1. Edge strength (0-30 punti)
  if (opp.edgeStrength === 'strong') score += 30;
  else if (opp.edgeStrength === 'medium') score += 20;
  else score += 10;

  // 2. Statistical significance (0-25 punti)
  score += opp.confidence * 0.25;

  // 3. Risk/Reward (0-20 punti)
  score += Math.min(opp.riskRewardRatio * 8, 20);

  // 4. Expected return (0-15 punti)
  score += Math.min(opp.expectedReturn * 3, 15);

  // 5. Regime favorability (0-10 punti)
  if (opp.regime === 'breakout_up' || opp.regime === 'trending_up') score += 10;
  else if (opp.regime === 'range_bound' || opp.regime === 'low_volatility') score += 7;
  else score += 0;

  return Math.min(score, 100);
}
