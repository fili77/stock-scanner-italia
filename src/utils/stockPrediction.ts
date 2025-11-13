import { StockData, StockPrediction, TechnicalIndicators } from '@/types/stock';

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
 * Generate trading signals
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

  // Momentum signals
  if (indicators.rsi > 70) {
    signals.momentum.push('RSI ipercomprato (>70)');
  } else if (indicators.rsi < 30) {
    signals.momentum.push('RSI ipervenduto (<30)');
  } else {
    signals.momentum.push(`RSI neutrale (${indicators.rsi.toFixed(2)})`);
  }

  if (indicators.macdHistogram > 0 && indicators.macd > indicators.macdSignal) {
    signals.momentum.push('MACD bullish (sopra signal line)');
  } else if (indicators.macdHistogram < 0) {
    signals.momentum.push('MACD bearish (sotto signal line)');
  }

  // Volume signals
  const recentVolumes = stockData.slice(-10).map(d => d.volume);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const currentVolume = stockData[stockData.length - 1].volume;

  if (currentVolume > avgVolume * 1.5) {
    signals.volume.push('Volume alto (possibile breakout)');
  } else if (currentVolume < avgVolume * 0.5) {
    signals.volume.push('Volume basso (consolidamento)');
  } else {
    signals.volume.push('Volume normale');
  }

  return signals;
}

/**
 * Determine overall trend
 */
export function determineTrend(
  stockData: StockData[],
  indicators: TechnicalIndicators
): 'bullish' | 'bearish' | 'neutral' {
  let score = 0;

  const currentPrice = stockData[stockData.length - 1].close;

  // Price vs moving averages
  if (currentPrice > indicators.sma20) score += 1;
  if (currentPrice > indicators.sma50) score += 1;
  if (indicators.sma20 > indicators.sma50) score += 2;

  // MACD
  if (indicators.macd > indicators.macdSignal) score += 1;
  if (indicators.macdHistogram > 0) score += 1;

  // RSI
  if (indicators.rsi > 50) score += 1;

  // EMA
  if (indicators.ema12 > indicators.ema26) score += 1;

  if (score >= 6) return 'bullish';
  if (score <= 2) return 'bearish';
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
 * Main prediction function
 */
export function predictStock(symbol: string, stockData: StockData[]): StockPrediction {
  if (stockData.length < 50) {
    throw new Error('Dati insufficienti per la previsione (minimo 50 giorni)');
  }

  const indicators = calculateTechnicalIndicators(stockData);
  const closePrices = stockData.map(d => d.close);
  const currentPrice = closePrices[closePrices.length - 1];

  // Use multiple prediction methods
  const regression = linearRegression(closePrices.slice(-30));
  const emaPredict = indicators.ema12; // Short-term trend
  const smaPredict = indicators.sma20; // Medium-term trend

  // Weighted average of predictions
  const predictedPrice = (
    regression.prediction * 0.4 +
    emaPredict * 0.35 +
    smaPredict * 0.25
  );

  const predictedChange = predictedPrice - currentPrice;
  const predictedChangePercent = (predictedChange / currentPrice) * 100;

  const signals = generateSignals(stockData, indicators);
  const trend = determineTrend(stockData, indicators);
  const confidence = calculateConfidence(stockData, indicators, signals);
  const recommendation = generateRecommendation(trend, indicators, confidence);

  return {
    symbol,
    currentPrice,
    predictedPrice,
    predictedChange,
    predictedChangePercent,
    confidence,
    trend,
    signals,
    indicators,
    recommendation,
  };
}
