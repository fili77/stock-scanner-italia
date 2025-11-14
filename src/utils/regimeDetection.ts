import { StockData, TechnicalIndicators } from '@/types/stock';
import { calculateSMA, calculateEMA } from './stockPrediction';
import { calculateADX, calculateATR } from './advancedIndicators';

export type MarketRegime =
  | 'trending_up'
  | 'trending_down'
  | 'range_bound'
  | 'high_volatility'
  | 'low_volatility'
  | 'breakout_up'
  | 'breakdown';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number; // 0-100, quanto siamo sicuri del regime
  duration: number; // Da quanti giorni siamo in questo regime
  signals: string[];

  // Metriche di supporto
  adx: number;
  atr_percentile: number; // ATR come percentile degli ultimi 60 giorni
  bb_width_percentile: number; // Bollinger Band width percentile
  trend_strength: number; // 0-100

  // Suggerimenti operativi
  recommended_strategy: 'momentum' | 'mean_reversion' | 'stay_cash' | 'breakout_follow';
  position_size_multiplier: number; // 0.5 = riduci size del 50%, 1.5 = aumenta del 50%
}

/**
 * Calcola Bollinger Bands Width
 */
function calculateBBWidth(stockData: StockData[], period: number = 20): number[] {
  const closes = stockData.map(d => d.close);
  const bbWidth: number[] = [];

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;

    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    const upper = sma + 2 * std;
    const lower = sma - 2 * std;
    const width = ((upper - lower) / sma) * 100; // Width as % of price

    bbWidth.push(width);
  }

  return bbWidth;
}

/**
 * Calcola il percentile di un valore in una serie
 */
function calculatePercentile(value: number, series: number[]): number {
  const sorted = [...series].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);

  if (index === -1) return 100;
  return (index / sorted.length) * 100;
}

/**
 * Rileva il regime di mercato corrente
 */
export function detectMarketRegime(
  stockData: StockData[],
  indicators: TechnicalIndicators
): RegimeAnalysis {
  if (stockData.length < 60) {
    // Dati insufficienti, default a range_bound con bassa confidence
    return {
      regime: 'range_bound',
      confidence: 30,
      duration: 0,
      signals: ['Dati insufficienti per regime detection affidabile'],
      adx: 0,
      atr_percentile: 50,
      bb_width_percentile: 50,
      trend_strength: 50,
      recommended_strategy: 'stay_cash',
      position_size_multiplier: 0.5,
    };
  }

  const closes = stockData.map(d => d.close);
  const currentPrice = closes[closes.length - 1];

  // Calcola ADX (trend strength)
  const adx = indicators.adx;

  // Calcola ATR e suo percentile
  const atrValues = stockData.slice(-60).map((_, i) => {
    if (i < 14) return 0;
    const slice = stockData.slice(i - 14, i + 1);
    return calculateATR(slice);
  }).filter(v => v > 0);

  const currentATR = indicators.atr;
  const atrPercentile = calculatePercentile(currentATR, atrValues);

  // Calcola Bollinger Band Width e suo percentile
  const bbWidthValues = calculateBBWidth(stockData.slice(-60), 20);
  const currentBBWidth = bbWidthValues[bbWidthValues.length - 1];
  const bbWidthPercentile = calculatePercentile(currentBBWidth, bbWidthValues);

  // Calcola trend direction
  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  const ema12 = indicators.ema12;

  const isBullish = currentPrice > sma20 && sma20 > sma50 && currentPrice > ema12;
  const isBearish = currentPrice < sma20 && sma20 < sma50 && currentPrice < ema12;

  // Calcola trend strength (0-100)
  let trendStrength = 0;
  if (adx > 40) trendStrength = 100;
  else if (adx > 30) trendStrength = 80;
  else if (adx > 25) trendStrength = 60;
  else if (adx > 20) trendStrength = 40;
  else trendStrength = 20;

  // Check for breakout/breakdown
  const recentVolume = stockData.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
  const avgVolume = stockData.slice(-30).reduce((sum, d) => sum + d.volume, 0) / 30;
  const highVolume = recentVolume > avgVolume * 1.5;

  const priceChange5d = ((currentPrice - stockData[stockData.length - 6].close) / stockData[stockData.length - 6].close) * 100;

  // REGIME DETECTION LOGIC
  let regime: MarketRegime;
  let confidence: number;
  let recommendedStrategy: 'momentum' | 'mean_reversion' | 'stay_cash' | 'breakout_follow';
  let positionSizeMultiplier: number;
  const signals: string[] = [];

  // 1. HIGH VOLATILITY regime
  if (atrPercentile > 80) {
    regime = 'high_volatility';
    confidence = Math.min(atrPercentile, 95);
    recommendedStrategy = 'stay_cash';
    positionSizeMultiplier = 0.5; // Riduci position size del 50%

    signals.push(`⚠️ Alta volatilità (ATR ${atrPercentile.toFixed(0)}° percentile)`);
    signals.push(`🛡️ RIDURRE esposizione del 50%`);
    signals.push(`💰 Aspettare stabilizzazione o operare con size ridotte`);
  }

  // 2. BREAKOUT UP regime
  else if (highVolume && priceChange5d > 5 && adx > 25 && isBullish) {
    regime = 'breakout_up';
    confidence = 75 + (adx - 25) * 0.5; // Confidence aumenta con ADX
    recommendedStrategy = 'breakout_follow';
    positionSizeMultiplier = 1.2; // Aumenta position size del 20%

    signals.push(`🚀 BREAKOUT rialzista confermato`);
    signals.push(`📊 Volume elevato (+${((recentVolume/avgVolume - 1) * 100).toFixed(0)}%)`);
    signals.push(`📈 Trend forte (ADX: ${adx.toFixed(1)})`);
    signals.push(`✅ Strategia: SEGUIRE momentum, ignorare resistenze deboli`);
  }

  // 3. BREAKDOWN regime
  else if (highVolume && priceChange5d < -5 && adx > 25 && isBearish) {
    regime = 'breakdown';
    confidence = 75 + (adx - 25) * 0.5;
    recommendedStrategy = 'stay_cash';
    positionSizeMultiplier = 0.3; // Riduci fortemente

    signals.push(`📉 BREAKDOWN ribassista in corso`);
    signals.push(`📊 Volume elevato in vendita`);
    signals.push(`⚠️ Trend debole confermato (ADX: ${adx.toFixed(1)})`);
    signals.push(`🛑 Strategia: EVITARE long, considerare solo short o cash`);
  }

  // 4. TRENDING UP regime
  else if (adx > 25 && isBullish) {
    regime = 'trending_up';
    confidence = Math.min(60 + (adx - 25) * 2, 90);
    recommendedStrategy = 'momentum';
    positionSizeMultiplier = 1.1;

    signals.push(`📈 Trend rialzista forte (ADX: ${adx.toFixed(1)})`);
    signals.push(`✅ Prezzo > SMA20 > SMA50`);
    signals.push(`💡 Strategia: MOMENTUM - seguire il trend`);
    signals.push(`🎯 Ignorare resistenze deboli, focus su momentum`);
  }

  // 5. TRENDING DOWN regime
  else if (adx > 25 && isBearish) {
    regime = 'trending_down';
    confidence = Math.min(60 + (adx - 25) * 2, 90);
    recommendedStrategy = 'stay_cash';
    positionSizeMultiplier = 0.7;

    signals.push(`📉 Trend ribassista forte (ADX: ${adx.toFixed(1)})`);
    signals.push(`⚠️ Prezzo < SMA20 < SMA50`);
    signals.push(`🛑 Strategia: EVITARE long o aspettare inversione`);
  }

  // 6. LOW VOLATILITY regime
  else if (atrPercentile < 20 && bbWidthPercentile < 30) {
    regime = 'low_volatility';
    confidence = 70;
    recommendedStrategy = 'stay_cash';
    positionSizeMultiplier = 1.5; // Può aumentare size, rischio basso

    signals.push(`😴 Bassa volatilità (ATR ${atrPercentile.toFixed(0)}° percentile)`);
    signals.push(`📊 Bollinger Bands strette (${bbWidthPercentile.toFixed(0)}° percentile)`);
    signals.push(`⏳ Possibile espansione volatilità imminente`);
    signals.push(`💡 Preparare per breakout futuro, ma ora stay cash`);
  }

  // 7. RANGE BOUND regime (default)
  else {
    regime = 'range_bound';
    confidence = 60 + (25 - Math.min(adx, 25)); // Più ADX basso, più confident
    recommendedStrategy = 'mean_reversion';
    positionSizeMultiplier = 0.9;

    signals.push(`↔️ Range laterale (ADX: ${adx.toFixed(1)} < 25)`);
    signals.push(`📊 BB Width: ${bbWidthPercentile.toFixed(0)}° percentile`);
    signals.push(`💡 Strategia: MEAN REVERSION`);
    signals.push(`🎯 Comprare supporti, vendere resistenze`);
    signals.push(`⚠️ Stop tight, profitti rapidi`);
  }

  // Calcola duration (quanti giorni consecutivi in questo regime)
  const duration = calculateRegimeDuration(stockData, regime, adx, isBullish, isBearish);

  // Aggiungi segnale sulla durata
  if (duration > 20) {
    signals.push(`⏰ Regime attivo da ${duration} giorni - possibile cambio imminente`);
  } else if (duration > 10) {
    signals.push(`⏱️ Regime attivo da ${duration} giorni`);
  }

  return {
    regime,
    confidence,
    duration,
    signals,
    adx,
    atr_percentile: atrPercentile,
    bb_width_percentile: bbWidthPercentile,
    trend_strength: trendStrength,
    recommended_strategy: recommendedStrategy,
    position_size_multiplier: positionSizeMultiplier,
  };
}

/**
 * Calcola da quanti giorni siamo in questo regime
 */
function calculateRegimeDuration(
  stockData: StockData[],
  currentRegime: MarketRegime,
  currentADX: number,
  isBullish: boolean,
  isBearish: boolean
): number {
  // Semplificazione: guarda indietro e conta giorni consecutivi con stesso regime
  let duration = 1;

  // Controlla ultimi 30 giorni
  for (let i = stockData.length - 2; i >= Math.max(0, stockData.length - 31); i--) {
    const slice = stockData.slice(0, i + 1);
    if (slice.length < 60) break;

    // Quick regime check basato su price action
    const price = slice[slice.length - 1].close;
    const sma20 = calculateSMA(slice.slice(-20).map(d => d.close), 20);
    const sma50 = calculateSMA(slice.slice(-50).map(d => d.close), 50);

    const wasBullish = price > sma20 && sma20 > sma50;
    const wasBearish = price < sma20 && sma20 < sma50;

    // Check se regime compatibile
    let compatible = false;

    switch (currentRegime) {
      case 'trending_up':
      case 'breakout_up':
        compatible = wasBullish;
        break;
      case 'trending_down':
      case 'breakdown':
        compatible = wasBearish;
        break;
      case 'range_bound':
        compatible = !wasBullish && !wasBearish;
        break;
      default:
        compatible = true;
    }

    if (compatible) {
      duration++;
    } else {
      break;
    }
  }

  return duration;
}

/**
 * Determina se è il momento giusto per operare basato sul regime
 */
export function shouldTradeInRegime(regime: MarketRegime, confidence: number): boolean {
  // Non operare se confidence bassa
  if (confidence < 60) return false;

  // Non operare in regimi ad alto rischio
  if (regime === 'high_volatility') return false;
  if (regime === 'breakdown') return false;
  if (regime === 'trending_down') return false;

  // Opera solo in regimi favorevoli
  return regime === 'trending_up' ||
         regime === 'breakout_up' ||
         regime === 'range_bound' ||
         regime === 'low_volatility';
}

/**
 * Aggiusta i pesi degli indicatori basato sul regime
 */
export function getRegimeAdjustedWeights(regime: MarketRegime): {
  momentum: number;
  meanReversion: number;
  support: number;
  resistance: number;
} {
  switch (regime) {
    case 'trending_up':
    case 'breakout_up':
      return {
        momentum: 0.7,      // Alto peso a momentum
        meanReversion: 0.1, // Basso peso a mean reversion
        support: 0.1,       // Supporti meno importanti
        resistance: 0.1,    // Resistenze meno importanti
      };

    case 'trending_down':
    case 'breakdown':
      return {
        momentum: 0.3,
        meanReversion: 0.1,
        support: 0.3,       // Supporti importanti per uscite
        resistance: 0.3,
      };

    case 'range_bound':
      return {
        momentum: 0.1,
        meanReversion: 0.5, // Alto peso a mean reversion
        support: 0.2,       // Supporti importanti per entry
        resistance: 0.2,    // Resistenze importanti per exit
      };

    case 'high_volatility':
      return {
        momentum: 0.25,
        meanReversion: 0.25,
        support: 0.25,
        resistance: 0.25,   // Pesi bilanciati, cautela
      };

    case 'low_volatility':
      return {
        momentum: 0.2,
        meanReversion: 0.3,
        support: 0.25,
        resistance: 0.25,
      };

    default:
      return {
        momentum: 0.25,
        meanReversion: 0.25,
        support: 0.25,
        resistance: 0.25,
      };
  }
}

/**
 * Formatta il regime per display utente
 */
export function formatRegime(regime: MarketRegime): string {
  const regimeNames: Record<MarketRegime, string> = {
    trending_up: 'Trend Rialzista',
    trending_down: 'Trend Ribassista',
    range_bound: 'Range Laterale',
    high_volatility: 'Alta Volatilità',
    low_volatility: 'Bassa Volatilità',
    breakout_up: 'Breakout Rialzista',
    breakdown: 'Breakdown Ribassista',
  };

  return regimeNames[regime];
}

/**
 * Emoji per il regime
 */
export function getRegimeEmoji(regime: MarketRegime): string {
  const emojis: Record<MarketRegime, string> = {
    trending_up: '📈',
    trending_down: '📉',
    range_bound: '↔️',
    high_volatility: '⚠️',
    low_volatility: '😴',
    breakout_up: '🚀',
    breakdown: '💥',
  };

  return emojis[regime];
}

/**
 * Colore per il regime (per UI)
 */
export function getRegimeColor(regime: MarketRegime): string {
  const colors: Record<MarketRegime, string> = {
    trending_up: 'text-green-700 bg-green-50 border-green-200',
    trending_down: 'text-red-700 bg-red-50 border-red-200',
    range_bound: 'text-blue-700 bg-blue-50 border-blue-200',
    high_volatility: 'text-orange-700 bg-orange-50 border-orange-200',
    low_volatility: 'text-gray-700 bg-gray-50 border-gray-200',
    breakout_up: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    breakdown: 'text-rose-700 bg-rose-50 border-rose-200',
  };

  return colors[regime];
}
