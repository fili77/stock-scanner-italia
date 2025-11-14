import { StockData, StockPrediction, TechnicalIndicators, FundamentalAnalysis } from '@/types/stock';
import {
  calculateOBV,
  calculateVWAP,
  calculateMFI,
  calculateCMF,
  calculateADX,
  calculateStochastic,
  calculateATR,
  detectDivergence,
  isVolumeBreakout,
} from './advancedIndicators';
import { analyzeFinancialEvents, calculateExpectedDividendDrop } from './financialEvents';
import { analyzeSupportResistance, calculateSRAdjustment } from './supportResistance';
import { detectMarketRegime, shouldTradeInRegime, formatRegime, getRegimeEmoji } from './regimeDetection';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses -= changes[i];
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(data: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd = ema12 - ema26;

  // Calculate signal line (9-day EMA of MACD)
  const macdValues = [];
  for (let i = 26; i <= data.length; i++) {
    const slice = data.slice(0, i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }

  const signal = calculateEMA(macdValues, 9);
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  const middle = calculateSMA(data, period);

  const slice = data.slice(-period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: middle + (standardDeviation * stdDev),
    middle,
    lower: middle - (standardDeviation * stdDev),
  };
}

/**
 * Calculate all technical indicators
 */
export function calculateTechnicalIndicators(stockData: StockData[]): TechnicalIndicators {
  const closePrices = stockData.map(d => d.close);
  const macd = calculateMACD(closePrices);
  const bollinger = calculateBollingerBands(closePrices);

  // Volume-based indicators
  const obvValues = calculateOBV(stockData);
  const currentOBV = obvValues[obvValues.length - 1];
  const prevOBV = obvValues[obvValues.length - 2] || currentOBV;
  const obvTrend = currentOBV > prevOBV ? 'up' : currentOBV < prevOBV ? 'down' : 'neutral';

  const vwap = calculateVWAP(stockData);
  const mfi = calculateMFI(stockData);
  const cmf = calculateCMF(stockData);

  // Advanced indicators
  const adx = calculateADX(stockData);
  const stochastic = calculateStochastic(stockData);
  const atr = calculateATR(stockData);

  return {
    sma20: calculateSMA(closePrices, 20),
    sma50: calculateSMA(closePrices, 50),
    ema12: calculateEMA(closePrices, 12),
    ema26: calculateEMA(closePrices, 26),
    rsi: calculateRSI(closePrices),
    macd: macd.macd,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    bollingerUpper: bollinger.upper,
    bollingerMiddle: bollinger.middle,
    bollingerLower: bollinger.lower,
    // Volume-based
    obv: currentOBV,
    obvTrend,
    vwap,
    mfi,
    cmf,
    // Advanced
    adx,
    stochasticK: stochastic.k,
    stochasticD: stochastic.d,
    atr,
  };
}

/**
 * Linear Regression for price prediction
 */
export function linearRegression(data: number[]): { slope: number; intercept: number; prediction: number } {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const prediction = slope * n + intercept;

  return { slope, intercept, prediction };
}

/**
 * Calculate prediction confidence based on volatility and indicators alignment
 */
export function calculateConfidence(
  stockData: StockData[],
  indicators: TechnicalIndicators,
  signals: { technical: string[]; volume: string[]; momentum: string[] }
): number {
  let confidence = 50; // Base confidence

  // Reduce confidence based on volatility
  const closePrices = stockData.slice(-20).map(d => d.close);
  const avgPrice = closePrices.reduce((a, b) => a + b, 0) / closePrices.length;
  const volatility = Math.sqrt(
    closePrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / closePrices.length
  ) / avgPrice;

  confidence -= volatility * 100; // High volatility reduces confidence

  // Increase confidence if multiple indicators align
  const totalSignals = signals.technical.length + signals.volume.length + signals.momentum.length;
  confidence += totalSignals * 3;

  // RSI extreme values increase confidence
  if (indicators.rsi > 70 || indicators.rsi < 30) {
    confidence += 10;
  }

  // MACD crossover increases confidence
  if (Math.abs(indicators.macdHistogram) < 0.5) {
    confidence += 5;
  }

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Generate trading signals with advanced volume analysis
 */
export function generateSignals(
  stockData: StockData[],
  indicators: TechnicalIndicators
): { technical: string[]; volume: string[]; momentum: string[] } {
  const signals = {
    technical: [] as string[],
    volume: [] as string[],
    momentum: [] as string[],
  };

  const currentPrice = stockData[stockData.length - 1].close;
  const previousPrice = stockData[stockData.length - 2]?.close || currentPrice;

  // Check for patterns
  const divergence = detectDivergence(stockData);
  const volumeBreakout = isVolumeBreakout(stockData);

  // Technical signals
  if (currentPrice > indicators.sma20) {
    signals.technical.push('Prezzo sopra SMA 20');
  } else {
    signals.technical.push('Prezzo sotto SMA 20');
  }

  if (indicators.sma20 > indicators.sma50) {
    signals.technical.push('Golden Cross (SMA 20 > SMA 50)');
  } else if (indicators.sma20 < indicators.sma50) {
    signals.technical.push('Death Cross (SMA 20 < SMA 50)');
  }

  if (currentPrice > indicators.bollingerUpper) {
    signals.technical.push('Prezzo sopra Bollinger superiore (ipercomprato)');
  } else if (currentPrice < indicators.bollingerLower) {
    signals.technical.push('Prezzo sotto Bollinger inferiore (ipervenduto)');
  }

  // VWAP signal (importante!)
  if (currentPrice > indicators.vwap) {
    signals.technical.push('Prezzo sopra VWAP (forza acquirenti)');
  } else {
    signals.technical.push('Prezzo sotto VWAP (forza venditori)');
  }

  // ADX - forza trend
  if (indicators.adx > 25) {
    signals.technical.push(`Trend forte (ADX: ${indicators.adx.toFixed(1)})`);
  } else {
    signals.technical.push(`Trend debole (ADX: ${indicators.adx.toFixed(1)})`);
  }

  // Momentum signals
  if (indicators.rsi > 70) {
    signals.momentum.push('RSI ipercomprato (>70)');
  } else if (indicators.rsi < 30) {
    signals.momentum.push('RSI ipervenduto (<30)');
  } else {
    signals.momentum.push(`RSI neutrale (${indicators.rsi.toFixed(2)})`);
  }

  // MFI (RSI con volume)
  if (indicators.mfi > 80) {
    signals.momentum.push('MFI ipercomprato (>80) - pressione vendita');
  } else if (indicators.mfi < 20) {
    signals.momentum.push('MFI ipervenduto (<20) - pressione acquisto');
  } else {
    signals.momentum.push(`MFI: ${indicators.mfi.toFixed(1)}`);
  }

  if (indicators.macdHistogram > 0 && indicators.macd > indicators.macdSignal) {
    signals.momentum.push('MACD bullish (sopra signal line)');
  } else if (indicators.macdHistogram < 0) {
    signals.momentum.push('MACD bearish (sotto signal line)');
  }

  // Stochastic
  if (indicators.stochasticK > 80) {
    signals.momentum.push('Stochastic ipercomprato');
  } else if (indicators.stochasticK < 20) {
    signals.momentum.push('Stochastic ipervenduto');
  }

  // Volume signals - ENHANCED!
  const recentVolumes = stockData.slice(-10).map(d => d.volume);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const currentVolume = stockData[stockData.length - 1].volume;

  if (volumeBreakout.isBreakout) {
    signals.volume.push(`🔥 Volume breakout ${volumeBreakout.multiplier.toFixed(1)}x (${volumeBreakout.direction === 'up' ? 'rialzista' : 'ribassista'})`);
  } else if (currentVolume > avgVolume * 1.5) {
    signals.volume.push('Volume alto (possibile movimento)');
  } else if (currentVolume < avgVolume * 0.5) {
    signals.volume.push('Volume basso (consolidamento)');
  } else {
    signals.volume.push('Volume normale');
  }

  // OBV trend
  if (indicators.obvTrend === 'up') {
    signals.volume.push('OBV in crescita (accumulazione)');
  } else if (indicators.obvTrend === 'down') {
    signals.volume.push('OBV in calo (distribuzione)');
  }

  // CMF - Chaikin Money Flow
  if (indicators.cmf > 0.1) {
    signals.volume.push('CMF positivo (pressione acquisto)');
  } else if (indicators.cmf < -0.1) {
    signals.volume.push('CMF negativo (pressione vendita)');
  }

  // Divergence detection
  if (divergence.hasDivergence) {
    if (divergence.type === 'bullish') {
      signals.volume.push('⚠️ Divergenza bullish (possibile rimbalzo)');
    } else if (divergence.type === 'bearish') {
      signals.volume.push('⚠️ Divergenza bearish (possibile inversione)');
    }
  }

  return signals;
}

/**
 * Determine overall trend with volume confirmation
 */
export function determineTrend(
  stockData: StockData[],
  indicators: TechnicalIndicators
): 'bullish' | 'bearish' | 'neutral' {
  let score = 0;

  const currentPrice = stockData[stockData.length - 1].close;

  // Price vs moving averages (3 points)
  if (currentPrice > indicators.sma20) score += 1;
  if (currentPrice > indicators.sma50) score += 1;
  if (indicators.sma20 > indicators.sma50) score += 1;

  // Price vs VWAP (2 points - importante!)
  if (currentPrice > indicators.vwap) score += 2;

  // MACD (2 points)
  if (indicators.macd > indicators.macdSignal) score += 1;
  if (indicators.macdHistogram > 0) score += 1;

  // RSI & MFI (2 points)
  if (indicators.rsi > 50) score += 1;
  if (indicators.mfi > 50) score += 1;

  // EMA (1 point)
  if (indicators.ema12 > indicators.ema26) score += 1;

  // OBV trend (2 points - conferma volume)
  if (indicators.obvTrend === 'up') score += 2;
  else if (indicators.obvTrend === 'down') score -= 1;

  // CMF (1 point)
  if (indicators.cmf > 0) score += 1;

  // Stochastic (1 point)
  if (indicators.stochasticK > 50) score += 1;

  // Total possible: 16 points
  if (score >= 10) return 'bullish';
  if (score <= 5) return 'bearish';
  return 'neutral';
}

/**
 * Generate recommendation
 */
export function generateRecommendation(
  trend: 'bullish' | 'bearish' | 'neutral',
  indicators: TechnicalIndicators,
  confidence: number
): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
  if (trend === 'bullish') {
    if (indicators.rsi < 30 && confidence > 60) return 'strong_buy';
    if (indicators.rsi < 50) return 'buy';
    return 'hold';
  }

  if (trend === 'bearish') {
    if (indicators.rsi > 70 && confidence > 60) return 'strong_sell';
    if (indicators.rsi > 50) return 'sell';
    return 'hold';
  }

  return 'hold';
}

/**
 * Main prediction function with advanced volume analysis
 * @param symbol Stock symbol
 * @param stockData Historical stock data
 * @param fundamentals Optional fundamental analysis (for backtesting optimization)
 * @param sector Stock sector (for correlation analysis)
 * @param globalIndicesData Optional global indices data for correlation analysis
 */
export function predictStock(
  symbol: string,
  stockData: StockData[],
  fundamentals?: FundamentalAnalysis,
  sector?: string,
  globalIndicesData?: Map<string, StockData[]>
): StockPrediction {
  if (stockData.length < 50) {
    throw new Error('Dati insufficienti per la previsione (minimo 50 giorni)');
  }

  const indicators = calculateTechnicalIndicators(stockData);
  const closePrices = stockData.map(d => d.close);
  const currentPrice = closePrices[closePrices.length - 1];

  // Analyze volume patterns
  const divergence = detectDivergence(stockData);
  const volumeBreakout = isVolumeBreakout(stockData);

  // Use multiple prediction methods
  const regression = linearRegression(closePrices.slice(-30));
  const emaPredict = indicators.ema12; // Short-term trend
  const smaPredict = indicators.sma20; // Medium-term trend
  const vwapPredict = indicators.vwap; // Volume-weighted average

  // Calculate dynamic weights based on market conditions
  let weights = {
    regression: 0.30,
    ema: 0.25,
    sma: 0.20,
    vwap: 0.25,
  };

  // Adjust weights based on volume analysis
  if (volumeBreakout.isBreakout) {
    // High volume = più peso a trend recenti
    weights.regression += 0.10;
    weights.ema += 0.10;
    weights.vwap -= 0.10;
    weights.sma -= 0.10;
  }

  // Se c'è divergenza, diamo più peso a VWAP (valore "giusto")
  if (divergence.hasDivergence) {
    weights.vwap += 0.15;
    weights.regression -= 0.10;
    weights.sma -= 0.05;
  }

  // Se ADX alto (trend forte), più peso a indicatori di trend
  if (indicators.adx > 25) {
    weights.ema += 0.10;
    weights.sma += 0.05;
    weights.regression -= 0.10;
    weights.vwap -= 0.05;
  }

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(key => {
    weights[key as keyof typeof weights] /= totalWeight;
  });

  // Weighted prediction
  let predictedPrice = (
    regression.prediction * weights.regression +
    emaPredict * weights.ema +
    smaPredict * weights.sma +
    vwapPredict * weights.vwap
  );

  let predictedChange = predictedPrice - currentPrice;
  let predictedChangePercent = (predictedChange / currentPrice) * 100;

  const signals = generateSignals(stockData, indicators);
  const trend = determineTrend(stockData, indicators);
  let confidence = calculateConfidence(stockData, indicators, signals);
  let recommendation = generateRecommendation(trend, indicators, confidence);

  // Detect Market Regime (CRITICAL for short-term trading)
  const regimeAnalysis = detectMarketRegime(stockData, indicators);
  const regimeSignals = regimeAnalysis.signals;

  // Adjust confidence based on regime
  confidence = confidence * (regimeAnalysis.confidence / 100);

  // Adjust prediction aggressiveness based on regime
  if (regimeAnalysis.recommended_strategy === 'stay_cash') {
    // In regimi sfavorevoli, riduci prediction e raccomanda cautela
    confidence = Math.min(confidence, 50); // Cap confidence

    if (recommendation === 'strong_buy') recommendation = 'hold';
    if (recommendation === 'buy') recommendation = 'hold';

    regimeSignals.push(`⚠️ REGIME SFAVOREVOLE - Ridurre operatività o stay in cash`);
  } else if (regimeAnalysis.recommended_strategy === 'breakout_follow') {
    // In breakout, aumenta confidence se allineato
    if (trend === 'bullish' && (recommendation === 'buy' || recommendation === 'strong_buy')) {
      confidence = Math.min(confidence * 1.15, 95);
      regimeSignals.push(`✅ Regime e segnali allineati - ALTA PROBABILITÀ di successo`);
    }
  }

  // If fundamentals provided, combine with technical recommendation
  let combinedScore: number | undefined = undefined;
  let fundamentalSignals: string[] | undefined = undefined;
  let eventSignals: string[] | undefined = undefined;

  if (fundamentals) {
    const { combineRecommendations } = require('./fundamentalAnalysis');
    const combined = combineRecommendations(recommendation, fundamentals.recommendation);
    recommendation = combined.recommendation;
    combinedScore = combined.score;
    fundamentalSignals = fundamentals.signals;

    // Analyze financial events (earnings, dividends)
    const eventAnalysis = analyzeFinancialEvents(fundamentals.data);
    eventSignals = eventAnalysis.events;

    // Adjust prediction based on financial events
    if (eventAnalysis.adjustmentFactor !== 0) {
      const adjustment = currentPrice * eventAnalysis.adjustmentFactor;
      predictedPrice = predictedPrice + adjustment;
      predictedChange = predictedPrice - currentPrice;
      predictedChangePercent = (predictedChange / currentPrice) * 100;
    }

    // Adjust confidence if high volatility expected
    if (eventAnalysis.volatilityWarning) {
      confidence = Math.max(confidence * 0.85, 40); // Reduce confidence but keep minimum 40%
    }

    // Adjust for expected dividend drop
    const dividendDrop = calculateExpectedDividendDrop(currentPrice, fundamentals.data);
    if (dividendDrop !== 0) {
      predictedPrice = predictedPrice + dividendDrop;
      predictedChange = predictedPrice - currentPrice;
      predictedChangePercent = (predictedChange / currentPrice) * 100;
    }
  }

  // Analyze Support & Resistance levels
  const srAnalysis = analyzeSupportResistance(stockData);
  const srSignals = srAnalysis.signals;

  // Adjust prediction based on S/R levels
  const srAdjustment = calculateSRAdjustment(currentPrice, predictedPrice, srAnalysis);
  if (srAdjustment.reason) {
    // Apply S/R adjustment to prediction
    const srDiff = srAdjustment.adjustedPrice - predictedPrice;
    if (Math.abs(srDiff) > 0.01) {
      predictedPrice = srAdjustment.adjustedPrice;
      predictedChange = predictedPrice - currentPrice;
      predictedChangePercent = (predictedChange / currentPrice) * 100;

      // Add reason to signals
      srSignals.push(`🎯 ${srAdjustment.reason}`);
    }

    // Adjust confidence based on S/R
    confidence = confidence * srAdjustment.confidence;
  }

  // Analyze Global Market Correlations (if data available)
  let globalMarketSignals: string[] | undefined = undefined;
  if (globalIndicesData && sector) {
    try {
      const { analyzeGlobalCorrelationsSync, calculateGlobalMarketAdjustment } = require('./globalCorrelations');

      const correlationAnalysis = analyzeGlobalCorrelationsSync(
        symbol,
        sector,
        stockData,
        globalIndicesData
      );

      globalMarketSignals = correlationAnalysis.signals;

      // Adjust prediction based on global market sentiment
      const globalAdjustment = calculateGlobalMarketAdjustment(correlationAnalysis, trend);

      if (Math.abs(globalAdjustment.adjustment) > 0.01) {
        // Apply adjustment
        predictedPrice = predictedPrice * (1 + globalAdjustment.adjustment);
        predictedChange = predictedPrice - currentPrice;
        predictedChangePercent = (predictedChange / currentPrice) * 100;

        // Add adjustment reason to signals
        if (globalAdjustment.reason) {
          globalMarketSignals.push(`🎯 ${globalAdjustment.reason}`);
        }
      }

      // Adjust confidence based on correlation strength
      confidence = Math.min(confidence * (correlationAnalysis.confidence / 100 + 0.5), 95);
    } catch (error) {
      console.warn('Global correlation analysis failed:', error);
      // Continue without global correlations
    }
  }

  return {
    symbol,
    currentPrice,
    predictedPrice,
    predictedChange,
    predictedChangePercent,
    confidence,
    trend,
    signals: {
      ...signals,
      ...(fundamentalSignals && { fundamental: fundamentalSignals }),
      ...(eventSignals && { events: eventSignals }),
      ...(srSignals && { supportResistance: srSignals }),
      ...(globalMarketSignals && { globalMarkets: globalMarketSignals }),
      ...(regimeSignals && { regime: regimeSignals }),
    },
    indicators,
    ...(fundamentals && { fundamentals }),
    recommendation,
    ...(combinedScore !== undefined && { combinedScore }),

    // Market regime information
    marketRegime: {
      type: formatRegime(regimeAnalysis.regime),
      confidence: regimeAnalysis.confidence,
      recommendedStrategy: regimeAnalysis.recommended_strategy,
      positionSizeMultiplier: regimeAnalysis.position_size_multiplier,
      shouldTrade: shouldTradeInRegime(regimeAnalysis.regime, regimeAnalysis.confidence),
    },
  };
}
